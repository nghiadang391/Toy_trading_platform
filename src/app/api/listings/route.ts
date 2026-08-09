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

    return NextResponse.json(listings);
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

    // Reference price estimation mockup for MVP (will fetch SerpApi in Phase 5)
    // For now we set referencePriceFiat to null or static estimate
    const referencePriceFiat = null;

    const listing = await prisma.listing.create({
      data: {
        title,
        description: description || "",
        condition: condition as ToyCondition,
        category: category as ToyCategory,
        priceFiat,
        currency: currency as Currency,
        referencePriceFiat,
        imageUrls: imageUrls || [],
        tradeMethod: tradeMethod as TradeMethod,
        shippingRegion: shippingRegion as Region,
        location: location || null,
        sellerId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
