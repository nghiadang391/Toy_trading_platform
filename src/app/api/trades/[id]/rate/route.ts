import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/trades/[id]/rate - Get ratings for a trade
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ratings = await prisma.rating.findMany({
      where: { tradeId: id },
      include: {
        rater: {
          select: { id: true, displayName: true, joyIdAddress: true },
        },
        ratedUser: {
          select: { id: true, displayName: true, joyIdAddress: true },
        },
      },
    });

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/trades/[id]/rate - Submit a review/rating (1-5 stars) for counterparty
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { callerAddress, score, comment } = body;

    if (!callerAddress) {
      return NextResponse.json({ error: "Missing required callerAddress" }, { status: 401 });
    }

    const numericScore = Number(score);
    if (!numericScore || numericScore < 1 || numericScore > 5 || !Number.isInteger(numericScore)) {
      return NextResponse.json({ error: "Score must be an integer between 1 and 5" }, { status: 400 });
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true,
      },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (trade.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Ratings can only be submitted for COMPLETED trades" },
        { status: 400 }
      );
    }

    // Determine role of the caller
    let raterId: string;
    let ratedUserId: string;

    if (trade.buyer.joyIdAddress === callerAddress) {
      raterId = trade.buyer.id;
      ratedUserId = trade.seller.id;
    } else if (trade.seller.joyIdAddress === callerAddress) {
      raterId = trade.seller.id;
      ratedUserId = trade.buyer.id;
    } else {
      return NextResponse.json(
        { error: "Unauthorized: Caller is neither buyer nor seller of this trade" },
        { status: 403 }
      );
    }

    // Check if user has already rated this trade
    const existingRating = await prisma.rating.findUnique({
      where: {
        tradeId_raterId: {
          tradeId: id,
          raterId,
        },
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: "You have already submitted a rating for this trade" },
        { status: 400 }
      );
    }

    const rating = await prisma.rating.create({
      data: {
        tradeId: id,
        raterId,
        ratedUserId,
        score: numericScore,
        comment: typeof comment === "string" ? comment.trim().slice(0, 500) : null,
      },
      include: {
        rater: {
          select: { id: true, displayName: true, joyIdAddress: true },
        },
        ratedUser: {
          select: { id: true, displayName: true, joyIdAddress: true },
        },
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
