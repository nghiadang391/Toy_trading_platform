import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;

    let trade = await prisma.trade.findUnique({
      where: { id: paramId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!trade) {
      trade = await prisma.trade.findFirst({
        where: {
          listingId: paramId,
          status: { in: ["PENDING", "ESCROW_FUNDED", "CANCEL_REQUESTED", "CANCELLED", "DISPUTED"] },
        },
        include: { listing: true, buyer: true, seller: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({
      tradeId: trade.id,
      status: trade.status,
      cancelReason: trade.cancelReason,
      cancelRequestedBy: trade.cancelRequestedBy,
      buyerAddress: trade.buyer.joyIdAddress,
      sellerAddress: trade.seller.joyIdAddress,
      buyerName: trade.buyer.displayName,
      sellerName: trade.seller.displayName,
      priceCkb: trade.priceCkb.toString(),
      priceFiat: trade.priceFiat.toString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const body = await request.json();
    const { action, actorType, reason, callerAddress } = body;

    if (!action || !["REQUEST_CANCEL", "CONFIRM_CANCEL", "DISPUTE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be REQUEST_CANCEL, CONFIRM_CANCEL, or DISPUTE." },
        { status: 400 }
      );
    }

    let trade = await prisma.trade.findUnique({
      where: { id: paramId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!trade) {
      trade = await prisma.trade.findFirst({
        where: {
          listingId: paramId,
          status: { in: ["PENDING", "ESCROW_FUNDED", "CANCEL_REQUESTED"] },
        },
        include: { listing: true, buyer: true, seller: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!trade) {
      return NextResponse.json({ error: "Trade not found or already closed" }, { status: 404 });
    }

    // Verify caller address authorization if provided
    if (callerAddress) {
      const isBuyer = trade.buyer.joyIdAddress === callerAddress;
      const isSeller = trade.seller.joyIdAddress === callerAddress;
      if (!isBuyer && !isSeller) {
        return NextResponse.json(
          { error: "Unauthorized: Caller is neither buyer nor seller in this trade." },
          { status: 403 }
        );
      }
    }

    // 1. REQUEST_CANCEL
    if (action === "REQUEST_CANCEL") {
      if (!["PENDING", "ESCROW_FUNDED"].includes(trade.status)) {
        return NextResponse.json(
          { error: `Cannot request cancellation when trade status is ${trade.status}` },
          { status: 400 }
        );
      }

      const updatedTrade = await prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: "CANCEL_REQUESTED",
          cancelReason: reason || "Item rejected during in-person inspection.",
          cancelRequestedBy: actorType || "BUYER",
        },
        include: { listing: true, buyer: true, seller: true },
      });

      return NextResponse.json({
        success: true,
        message: "Cancellation request recorded. Awaiting seller confirmation to release escrow refund.",
        trade: {
          ...updatedTrade,
          priceCkb: updatedTrade.priceCkb.toString(),
        },
      });
    }

    // 2. CONFIRM_CANCEL
    if (action === "CONFIRM_CANCEL") {
      if (!["CANCEL_REQUESTED", "ESCROW_FUNDED", "PENDING"].includes(trade.status)) {
        return NextResponse.json(
          { error: `Cannot confirm cancellation when trade status is ${trade.status}` },
          { status: 400 }
        );
      }

      // If callerAddress was provided, verify it is the seller when buyer requested cancel
      if (callerAddress && trade.cancelRequestedBy === "BUYER" && trade.seller.joyIdAddress !== callerAddress) {
        return NextResponse.json(
          { error: "Unauthorized: Only the seller can confirm item possession and authorize refund." },
          { status: 403 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const cancelledTrade = await tx.trade.update({
          where: { id: trade.id },
          data: {
            status: "CANCELLED",
            qrCodeToken: null,
            completedAt: new Date(),
          },
          include: { listing: true, buyer: true, seller: true },
        });

        // Restore listing back to ACTIVE
        await tx.listing.update({
          where: { id: trade.listingId },
          data: { status: "ACTIVE" },
        });

        // Record event in Toy Passport log
        await tx.passportLog.create({
          data: {
            listingId: trade.listingId,
            tradeId: trade.id,
            ownerAddress: trade.seller.joyIdAddress,
            condition: trade.listing.condition,
            notes: `Trade cancelled by mutual agreement. Physical toy retained by seller ${trade.seller.displayName}. Escrow refund released to buyer ${trade.buyer.displayName}.`,
          },
        });

        return cancelledTrade;
      });

      return NextResponse.json({
        success: true,
        message: "Trade successfully cancelled. Escrow refund released to buyer and listing restored to Active.",
        trade: {
          ...result,
          priceCkb: result.priceCkb.toString(),
        },
      });
    }

    // 3. DISPUTE
    if (action === "DISPUTE") {
      if (!["CANCEL_REQUESTED", "ESCROW_FUNDED"].includes(trade.status)) {
        return NextResponse.json(
          { error: `Cannot dispute trade when status is ${trade.status}` },
          { status: 400 }
        );
      }

      const disputedTrade = await prisma.trade.update({
        where: { id: trade.id },
        data: {
          status: "DISPUTED",
        },
        include: { listing: true, buyer: true, seller: true },
      });

      return NextResponse.json({
        success: true,
        message: "Trade status marked as DISPUTED. Platform mediation or peer negotiation required.",
        trade: {
          ...disputedTrade,
          priceCkb: disputedTrade.priceCkb.toString(),
        },
      });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
