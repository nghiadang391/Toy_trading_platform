import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fiberClient } from "@/lib/fiber/fnnClient";

// POST /api/fiber/invoice - Generate instant Fiber payment invoice for a trade
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tradeId: paramId } = body;

    if (!paramId) {
      return NextResponse.json({ error: "tradeId is required" }, { status: 400 });
    }

    let trade = await prisma.trade.findUnique({
      where: { id: paramId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!trade) {
      trade = await prisma.trade.findFirst({
        where: {
          listingId: paramId,
          status: { in: ["PENDING", "ESCROW_FUNDED"] },
        },
        include: { listing: true, buyer: true, seller: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!trade) {
      return NextResponse.json({ 
        error: "No active escrow trade found. Please initiate a trade first before generating a handover QR." 
      }, { status: 404 });
    }

    const tradeId = trade.id;

    // Attempt to generate Fiber invoice
    try {
      const description = `ToyTrade: ${trade.listing.title} (${trade.id})`;
      const amountShannons = trade.priceCkb.toString();

      const invoice = await fiberClient.createInvoice(amountShannons, description);

      // 2. Pre-flight Route Viability Probe (from Fiber-Route-Diagnostics)
      const { runPreflightProbe, parseFiberError } = await import("@/lib/fiber/prober");
      const probeResult = await runPreflightProbe(invoice.invoice_address);

      if (!probeResult.viable) {
        console.warn("Pre-flight probe detected blocked Fiber route:", probeResult.errorMessage);
        return NextResponse.json({
          success: false,
          useFallback: true,
          fallbackReason: probeResult.suggestion || "Fiber payment route is currently unavailable. Switched to CKB L1 Escrow.",
          paymentEngine: "CKB_L1",
        });
      }

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
        routeLatencyMs: probeResult.latencyMs,
      });
    } catch (fiberErr: any) {
      console.warn("Fiber invoice creation failed, triggering L1 fallback:", fiberErr.message);

      const { parseFiberError } = await import("@/lib/fiber/prober");
      const parsed = parseFiberError(fiberErr.message || "");

      // Gracefully signal frontend to switch to L1 Standard Handover
      return NextResponse.json({
        success: false,
        useFallback: true,
        fallbackReason: parsed.suggestion,
        paymentEngine: "CKB_L1",
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
