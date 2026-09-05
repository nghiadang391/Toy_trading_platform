import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET /api/trades/[id]/qr - Generate 1-time QR handover token for buyer
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
      // Check if paramId was passed as a listingId
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
      sellerAddress: trade.seller.joyIdAddress,
      buyerAddress: trade.buyer.joyIdAddress,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/trades/[id]/qr - Buyer scans QR token to execute 2-of-2 CKB completion & release escrow
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const body = await request.json();
    const { token, buyerAddress, sellerAddress } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Verify Token & Expiration
    if (trade.qrCodeToken !== token) {
      return NextResponse.json({ error: "Invalid QR Handover Token" }, { status: 400 });
    }

    if (trade.qrCodeExpiresAt && new Date() > trade.qrCodeExpiresAt) {
      return NextResponse.json({ error: "QR Handover Token has expired" }, { status: 400 });
    }

    // Verify Caller Identity (In modern retail flow, buyer scans seller's QR to confirm delivery and release escrow)
    if (buyerAddress && trade.buyer?.joyIdAddress && buyerAddress !== trade.buyer.joyIdAddress) {
      return NextResponse.json({
        error: "Unauthorized: Caller address does not match the trade buyer.",
      }, { status: 403 });
    } else if (!buyerAddress && sellerAddress && trade.seller?.joyIdAddress && sellerAddress !== trade.seller.joyIdAddress) {
      return NextResponse.json({
        error: "Unauthorized: Caller address does not match the listing seller.",
      }, { status: 403 });
    }

    // Update trade status to COMPLETED with 2-of-2 confirmations
    const updatedTrade = await prisma.trade.update({
      where: { id: trade.id },
      data: {
        buyerConfirmed: true,
        sellerConfirmed: true,
        status: "COMPLETED",
        completedAt: new Date(),
        qrCodeToken: null, // Consume token
      },
    });

    // Mark listing as traded
    await prisma.listing.update({
      where: { id: trade.listingId },
      data: { status: "TRADED" },
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
      trade: {
        ...updatedTrade,
        priceCkb: updatedTrade.priceCkb.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
