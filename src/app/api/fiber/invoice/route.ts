import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fiberClient } from "@/lib/fiber/fnnClient";

// POST /api/fiber/invoice - Generate instant Fiber payment invoice for a trade
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tradeId } = body;

    if (!tradeId) {
      return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Attempt to generate Fiber invoice
    try {
      const description = `ToyTrade: ${trade.listing.title} (${trade.id})`;
      const amountShannons = trade.priceCkb.toString();

      const invoice = await fiberClient.createInvoice(amountShannons, description);

      // Save invoice reference in trade record
      await prisma.trade.update({
        where: { id: tradeId },
        data: {
          paymentEngine: "FIBER",
          fiberInvoice: invoice.invoice_address,
          fiberPaymentHash: invoice.payment_hash,
        },
      });

      return NextResponse.json({
        success: true,
        useFallback: false,
        paymentEngine: "FIBER",
        invoice: invoice.invoice_address,
        paymentHash: invoice.payment_hash,
        amountShannons,
        expiry: invoice.expiry || "1800",
        toyTitle: trade.listing.title,
      });
    } catch (fiberErr: any) {
      console.warn("Fiber invoice creation failed, triggering L1 fallback:", fiberErr.message);

      // Gracefully signal frontend to switch to L1 Standard Handover
      return NextResponse.json({
        success: false,
        useFallback: true,
        fallbackReason: fiberErr.message || "Fiber channel route unavailable",
        paymentEngine: "CKB_L1",
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
