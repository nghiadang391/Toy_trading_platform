import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fiberClient } from "@/lib/fiber/fnnClient";

// POST /api/fiber/pay - Settle a Fiber invoice and finalize toy trade handover
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tradeId, invoice } = body;

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

    const targetInvoice = invoice || trade.fiberInvoice;
    if (!targetInvoice) {
      return NextResponse.json({ error: "No Fiber invoice found for this trade" }, { status: 400 });
    }

    // Dispatch payment via Fiber
    const paymentResult = await fiberClient.sendPayment(targetInvoice);

    if (paymentResult.status !== "Success" && !paymentResult.preimage) {
      return NextResponse.json({
        error: "Fiber payment failed or pending confirmation",
        paymentResult,
      }, { status: 400 });
    }

    // Complete trade record with released preimage
    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        paymentEngine: "FIBER",
        status: "COMPLETED",
        buyerConfirmed: true,
        sellerConfirmed: true,
        fiberPreimage: paymentResult.preimage || "0x_settled_preimage",
        completedAt: new Date(),
      },
    });

    // Mark listing as traded
    await prisma.listing.update({
      where: { id: trade.listingId },
      data: { status: "TRADED" },
    });

    // Create immutable PassportLog for Spore DOB timeline
    await prisma.passportLog.create({
      data: {
        listingId: trade.listingId,
        tradeId: trade.id,
        ownerAddress: trade.buyer.joyIdAddress,
        condition: trade.listing.condition,
        notes: `Instant Fiber Handover completed between ${trade.seller.displayName} and ${trade.buyer.displayName}. Payment preimage: ${paymentResult.preimage?.slice(0, 18)}...`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Instant Fiber Handover completed successfully! Toy Passport transferred.",
      trade: {
        ...updatedTrade,
        priceCkb: updatedTrade.priceCkb.toString(),
      },
      preimage: paymentResult.preimage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
