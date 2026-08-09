import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TradeMethod } from "@prisma/client";

// POST /api/trades - Initiate a trade (funds escrow)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      listingId,
      buyerId,
      method,
      priceFiat,
      priceCkb,
      exchangeRate,
      escrowTxHash,
      escrowCellOutpoint,
    } = body;

    if (!listingId || !buyerId || !priceFiat || !priceCkb || !exchangeRate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing is not available" }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Escrow locks for 7 days

    // Create the trade and reserve the listing status inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedListing = await tx.listing.update({
        where: { id: listingId },
        data: { status: "RESERVED" },
      });

      const trade = await tx.trade.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          priceFiat,
          priceCkb: BigInt(priceCkb),
          exchangeRate,
          method: method as TradeMethod,
          escrowTxHash: escrowTxHash || null,
          escrowCellOutpoint: escrowCellOutpoint || null,
          status: "ESCROW_FUNDED",
          expiresAt,
        },
      });

      return { updatedListing, trade };
    });

    // Helper serialization since prisma doesn't natively serialize BigInt to JSON
    const responseData = {
      ...result.trade,
      priceCkb: result.trade.priceCkb.toString(),
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
