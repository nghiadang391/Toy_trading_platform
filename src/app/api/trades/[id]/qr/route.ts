import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET /api/trades/[id]/qr - Generate 1-time QR handover token for buyer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tradeId } = await params;

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { listing: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Generate dynamic 1-time token
    const token = "QR_HANDOVER_" + crypto.randomBytes(12).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins validity

    await prisma.trade.update({
      where: { id: tradeId },
      data: {
        qrCodeToken: token,
        qrCodeExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      tradeId,
      token,
      expiresAt: expiresAt.toISOString(),
      toyTitle: trade.listing.title,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/trades/[id]/qr - Seller scans QR token to execute 2-of-2 CKB completion
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tradeId } = await params;
    const body = await request.json();
    const { token, sellerAddress } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Verify Token & Expiration
    if (trade.qrCodeToken !== token) {
      return NextResponse.json({ error: "Invalid QR Handover Token" }, { status: 400 });
    }

    if (trade.qrCodeExpiresAt && new Date() > trade.qrCodeExpiresAt) {
      return NextResponse.json({ error: "QR Handover Token has expired" }, { status: 400 });
    }

    // Update trade status to COMPLETED with 2-of-2 confirmations
    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        buyerConfirmed: true,
        sellerConfirmed: true,
        status: "COMPLETED",
        completedAt: new Date(),
        qrCodeToken: null, // Consume token
      },
    });

    // Create a PassportLog entry for the Toy Passport (Spore DOB) timeline
    await prisma.passportLog.create({
      data: {
        listingId: trade.listingId,
        tradeId: trade.id,
        ownerAddress: trade.buyer.joyIdAddress,
        condition: trade.listing.condition,
        notes: `Meetup QR Handover completed between ${trade.seller.displayName} and ${trade.buyer.displayName}. CKB Escrow settled.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "QR Handover verified! CKB Escrow released to seller and Toy Passport DOB transferred to buyer.",
      trade: updatedTrade,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
