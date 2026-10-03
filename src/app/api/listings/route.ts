import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ToyCondition, ToyCategory, TradeMethod, Region, Currency } from "@prisma/client";

// GET /api/listings - Retrieve listings with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region") as Region | null;
    const category = searchParams.get("category") as ToyCategory | null;
    const condition = searchParams.get("condition") as ToyCondition | null;
    const status = searchParams.get("status");
    const search = searchParams.get("search") || searchParams.get("q");

    const whereClause: any = {};
    if (region) whereClause.shippingRegion = region;
    if (category) whereClause.category = category;
    if (condition) whereClause.condition = condition;
    if (status) whereClause.status = status;

    if (search && search.trim()) {
      const query = search.trim();
      whereClause.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            joyIdAddress: true,
            ratingsReceived: {
              select: {
                score: true,
              },
            },
            tradesAsSeller: {
              where: { status: "COMPLETED" },
              select: { id: true },
            },
          },
        },
        trades: {
          where: {
            status: { in: ["PENDING", "ESCROW_FUNDED"] },
          },
          select: {
            id: true,
            status: true,
            buyerId: true,
            sellerId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse imageUrls from JSON string and compute seller reputation metrics
    const parsed = listings.map((l) => {
      const ratings = l.seller?.ratingsReceived || [];
      const reviewCount = ratings.length;
      const averageRating =
        reviewCount > 0
          ? Number((ratings.reduce((acc, r) => acc + r.score, 0) / reviewCount).toFixed(1))
          : null;
      const completedTradesCount = l.seller?.tradesAsSeller?.length || 0;

      return {
        ...l,
        imageUrls: (() => {
          try { return JSON.parse(l.imageUrls as string); } catch { return []; }
        })(),
        seller: l.seller
          ? {
              id: l.seller.id,
              displayName: l.seller.displayName,
              joyIdAddress: l.seller.joyIdAddress,
              rating: averageRating,
              reviewCount,
              completedTrades: completedTradesCount,
            }
          : null,
      };
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/listings - Create listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      condition,
      category,
      priceFiat,
      currency,
      imageUrls,
      tradeMethod,
      shippingRegion,
      location,
      sellerId,
    } = body;

    if (!title || !priceFiat || !sellerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch user's registered JoyID address, or create user if newly connected
    let user = await prisma.user.findUnique({
      where: { id: sellerId }
    });

    // Normalize region value to match Prisma enum
    const normalizedRegion: Region =
      shippingRegion === "VN" || shippingRegion === "VIETNAM" ? "VIETNAM" : "UK";

    if (!user && body.joyIdAddress) {
      user = await prisma.user.findUnique({
        where: { joyIdAddress: body.joyIdAddress },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: sellerId.startsWith("usr_") ? sellerId : undefined,
            joyIdAddress: body.joyIdAddress,
            displayName: body.displayName || `Seller ${body.joyIdAddress.slice(-4)}`,
            region: normalizedRegion,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found. Please connect your JoyID passkey first." }, { status: 404 });
    }

    // 2. Extract and verify signature
    const signature = request.headers.get("x-signature") || body.signature;
    const message = `create-listing:${title}:${priceFiat}`;
    
    const { verifySignature } = await import("@/lib/ckb/auth");
    if (!signature || !(await verifySignature(message, signature, user.joyIdAddress))) {
      return NextResponse.json({ error: "Cryptographic signature verification failed" }, { status: 401 });
    }

    // Run Safety Recall Check
    const { checkToySafetyAsync } = await import("@/lib/safety/recall-checker");
    const safetyResult = await checkToySafetyAsync(title, description);

    // Reference price estimation mockup for MVP
    const referencePriceFiat = null;

    // Robust Enum Normalization
    const validConditions: Record<string, ToyCondition> = {
      NEW: "NEW",
      LIKE_NEW: "LIKE_NEW",
      GOOD: "GOOD",
      FAIR: "FAIR",
      USED: "GOOD", // Map legacy "USED" -> "GOOD"
      DAMAGED: "FAIR", // Map legacy "DAMAGED" -> "FAIR"
    };
    const normalizedCondition: ToyCondition = validConditions[condition] || "GOOD";

    const validCategories: Record<string, ToyCategory> = {
      ACTION_FIGURES: "ACTION_FIGURES",
      BOARD_GAMES: "BOARD_GAMES",
      BUILDING_SETS: "BUILDING_SETS",
      DOLLS: "DOLLS",
      EDUCATIONAL: "EDUCATIONAL",
      OUTDOOR: "OUTDOOR",
      PUZZLES: "PUZZLES",
      VEHICLES: "VEHICLES",
      OTHER: "OTHER",
    };
    const normalizedCategory: ToyCategory = validCategories[category] || "OTHER";

    const normalizedCurrency: Currency = currency === "VND" ? "VND" : "GBP";
    const normalizedTradeMethod: TradeMethod =
      tradeMethod === "SHIPPING" ? "SHIPPING" : tradeMethod === "BOTH" ? "BOTH" : "MEETUP";

    const listing = await prisma.listing.create({
      data: {
        title,
        description: description || "",
        condition: normalizedCondition,
        category: normalizedCategory,
        priceFiat,
        currency: normalizedCurrency,
        referencePriceFiat,
        imageUrls: JSON.stringify(imageUrls || []),
        tradeMethod: normalizedTradeMethod,
        shippingRegion: normalizedRegion,
        location: location || null,
        isRecalled: safetyResult.isRecalled,
        recallReason: safetyResult.recallReason,
        sellerId: user.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/listings - Clean up test listings (test/dev only)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address || (!address.startsWith("ckt1_browser_") && !address.startsWith("ckt1_smoke_"))) {
      return NextResponse.json({ error: "Only test listings can be deleted" }, { status: 400 });
    }

    const testListings = await prisma.listing.findMany({
      where: {
        seller: { joyIdAddress: address },
      },
      select: { id: true },
    });

    const ids = testListings.map((l) => l.id);
    if (ids.length > 0) {
      await prisma.passportLog.deleteMany({ where: { listingId: { in: ids } } });
      await prisma.chatMessage.deleteMany({ where: { room: { listingId: { in: ids } } } });
      await prisma.chatRoom.deleteMany({ where: { listingId: { in: ids } } });
      await prisma.rating.deleteMany({ where: { trade: { listingId: { in: ids } } } });
      await prisma.trade.deleteMany({ where: { listingId: { in: ids } } });
      await prisma.listing.deleteMany({ where: { id: { in: ids } } });
    }

    await prisma.user.deleteMany({ where: { joyIdAddress: address } });

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
