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
    const status = searchParams.get("status") || "ACTIVE";

    const whereClause: any = {};
    if (region) whereClause.shippingRegion = region;
    if (category) whereClause.category = category;
    if (condition) whereClause.condition = condition;
    if (status) whereClause.status = status;

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            joyIdAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse imageUrls from JSON string for SQLite compatibility
    const parsed = listings.map((l) => ({
      ...l,
      imageUrls: (() => {
        try { return JSON.parse(l.imageUrls as string); } catch { return []; }
      })(),
    }));

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
    const { checkToySafety } = await import("@/lib/safety/recall-checker");
    const safetyResult = checkToySafety(title, description);

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
