import { ccc } from "@ckb-ccc/core";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TradeMethod } from "@prisma/client";
import { invalidateListingsCache } from "@/app/api/listings/route";

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

    if (buyerId === listing.sellerId) {
      return NextResponse.json({
        error: "Invalid Trade: Sellers cannot initiate escrow trades on their own listings.",
      }, { status: 400 });
    }

    // On-Chain Live Cell Verification (CKB Testnet)
    if (
      escrowCellOutpoint &&
      process.env.NODE_ENV !== "test" &&
      !escrowCellOutpoint.startsWith("0xmock")
    ) {
      try {
        const parts = escrowCellOutpoint.split(":");
        const txHash = parts[0];
        const index = parts.length > 1 ? parseInt(parts[1], 10) : 0;

        const client = new ccc.ClientPublicTestnet();
        const liveCell = await client.getCellLive({ txHash, index });

        if (!liveCell || !liveCell.cellOutput) {
          return NextResponse.json(
            { error: "Invalid Escrow: Specified escrow cell is not live or does not exist on CKB Testnet" },
            { status: 400 }
          );
        }

        const onChainCapacity = BigInt(liveCell.cellOutput.capacity);
        if (onChainCapacity < BigInt(priceCkb)) {
          return NextResponse.json(
            {
              error: `Insufficient Escrow Capacity: Cell capacity (${onChainCapacity}) is less than required price (${priceCkb})`,
            },
            { status: 400 }
          );
        }
      } catch (rpcErr: any) {
        return NextResponse.json(
          { error: `Failed to verify on-chain escrow cell: ${rpcErr.message}` },
          { status: 400 }
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Escrow locks for 7 days

    const buyer = await prisma.user.findFirst({
      where: { OR: [{ id: buyerId }, { joyIdAddress: buyerId }] },
    });

    // Create the trade and reserve the listing status inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedListing = await tx.listing.update({
        where: { id: listingId },
        data: { status: "RESERVED" },
      });

      const trade = await tx.trade.create({
        data: {
          listingId,
          buyerId: buyer?.id || buyerId,
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

      // Notify seller that toy has been booked and escrow locked
      await tx.notification.create({
        data: {
          userId: listing.sellerId,
          type: "TRADE_BOOKED",
          title: "Toy Booked & Escrow Locked",
          message: `${buyer?.displayName || "A buyer"} reserved "${listing.title}". Escrow funds are secured on-chain.`,
          link: `/profile`,
        },
      });

      return { updatedListing, trade };
    });

    // Invalidate listings memory cache so marketplace immediately reflects RESERVED status
    invalidateListingsCache();

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
