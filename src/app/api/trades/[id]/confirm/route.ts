import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { actorType, callerAddress } = body; // 'BUYER' or 'SELLER'

    if (!actorType || (actorType !== "BUYER" && actorType !== "SELLER")) {
      return NextResponse.json({ error: "Invalid actor type" }, { status: 400 });
    }

    if (!callerAddress) {
      return NextResponse.json({ error: "Missing required callerAddress" }, { status: 401 });
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
      include: { listing: true, buyer: true, seller: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    // Verify caller authorization
    if (actorType === "BUYER" && trade.buyer.joyIdAddress !== callerAddress) {
      return NextResponse.json({ error: "Unauthorized: Caller is not the trade buyer" }, { status: 403 });
    }

    if (actorType === "SELLER" && trade.seller.joyIdAddress !== callerAddress) {
      return NextResponse.json({ error: "Unauthorized: Caller is not the trade seller" }, { status: 403 });
    }

    const updateData: any = {};
    if (actorType === "BUYER") {
      updateData.buyerConfirmed = true;
    } else {
      updateData.sellerConfirmed = true;
    }

    // Determine the next state
    let nextStatus = trade.status;
    const willBeBuyerConfirmed = actorType === "BUYER" || trade.buyerConfirmed;
    const willBeSellerConfirmed = actorType === "SELLER" || trade.sellerConfirmed;

    if (willBeBuyerConfirmed && willBeSellerConfirmed) {
      nextStatus = "COMPLETED";
      updateData.completedAt = new Date();
    } else if (willBeBuyerConfirmed) {
      nextStatus = "BUYER_CONFIRMED";
    } else if (willBeSellerConfirmed) {
      nextStatus = "SELLER_CONFIRMED";
    }
    updateData.status = nextStatus;

    const result = await prisma.$transaction(async (tx) => {
      const updatedTrade = await tx.trade.update({
        where: { id },
        data: updateData,
      });

      // If trade is completed, set listing status to TRADED
      if (nextStatus === "COMPLETED") {
        await tx.listing.update({
          where: { id: trade.listingId },
          data: { status: "TRADED" },
        });
      }

      return updatedTrade;
    });

    const responseData = {
      ...result,
      priceCkb: result.priceCkb.toString(),
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
