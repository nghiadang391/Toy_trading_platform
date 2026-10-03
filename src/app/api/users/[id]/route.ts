import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id] - Fetch user profile with open toys, sold toys, and verified reviews
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { joyIdAddress: id }],
      },
      include: {
        listings: {
          orderBy: { createdAt: "desc" },
          include: {
            trades: {
              where: { status: { in: ["PENDING", "ESCROW_FUNDED"] } },
              select: { id: true, status: true, buyerId: true },
              take: 1,
            },
          },
        },
        ratingsReceived: {
          orderBy: { createdAt: "desc" },
          include: {
            rater: {
              select: {
                id: true,
                displayName: true,
                joyIdAddress: true,
              },
            },
            trade: {
              include: {
                listing: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
        tradesAsSeller: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          include: {
            buyer: {
              select: { id: true, displayName: true },
            },
            listing: {
              select: { id: true, title: true, imageUrls: true, priceFiat: true, currency: true, sporeDobId: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalRatings = user.ratingsReceived.length;
    const averageRating =
      totalRatings > 0
        ? Number((user.ratingsReceived.reduce((sum, r) => sum + r.score, 0) / totalRatings).toFixed(1))
        : null;

    // Helper to parse JSON image URLs
    const parseImages = (jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    // Parse listings and separate into Open vs Sold
    const parsedListings = user.listings.map((l) => ({
      ...l,
      priceFiat: Number(l.priceFiat),
      imageUrls: parseImages(l.imageUrls),
    }));

    const openListings = parsedListings.filter(
      (l) => l.status === "ACTIVE" || l.status === "RESERVED"
    );
    const soldListings = parsedListings.filter((l) => l.status === "TRADED");

    // Format completed trade history
    const completedTrades = user.tradesAsSeller.map((t) => ({
      id: t.id,
      completedAt: t.completedAt,
      priceFiat: Number(t.priceFiat),
      buyerName: t.buyer.displayName,
      toyTitle: t.listing.title,
      toyId: t.listing.id,
      sporeDobId: t.listing.sporeDobId,
      imageUrls: parseImages(t.listing.imageUrls),
    }));

    // Format reviews
    const reviews = user.ratingsReceived.map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
      raterName: r.rater.displayName,
      toyTitle: r.trade.listing.title,
      toyId: r.trade.listing.id,
    }));

    return NextResponse.json({
      id: user.id,
      displayName: user.displayName,
      joyIdAddress: user.joyIdAddress,
      region: user.region,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      averageRating,
      totalRatings,
      completedTradesCount: user.tradesAsSeller.length,
      openListings,
      soldListings,
      completedTrades,
      reviews,
    });
  } catch (error: any) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
