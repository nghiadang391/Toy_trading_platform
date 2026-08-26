import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/trades/expire
 * Idempotent sweep handler that identifies expired trades (older than 7-day timeout)
 * and transitions them to 'EXPIRED', releasing the toy listing back to 'ACTIVE'.
 */
export async function POST() {
  try {
    const now = new Date();

    const expiredTrades = await prisma.trade.findMany({
      where: {
        status: { in: ["PENDING", "ESCROW_FUNDED"] },
        expiresAt: { lt: now },
      },
      include: { listing: true },
    });

    if (expiredTrades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired trades to sweep.",
        expiredCount: 0,
      });
    }

    const tradeIds = expiredTrades.map((t) => t.id);
    const listingIds = expiredTrades.map((t) => t.listingId);

    // Atomically expire trades and reactivate listings
    await prisma.$transaction([
      prisma.trade.updateMany({
        where: { id: { in: tradeIds } },
        data: { status: "EXPIRED" },
      }),
      prisma.listing.updateMany({
        where: { id: { in: listingIds }, status: "RESERVED" },
        data: { status: "ACTIVE" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully expired ${tradeIds.length} trade(s) and released listings.`,
      expiredCount: tradeIds.length,
      expiredTradeIds: tradeIds,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/trades/expire
 * Read-only status endpoint to inspect trades currently pending expiration.
 */
export async function GET() {
  try {
    const now = new Date();
    const pendingExpiration = await prisma.trade.findMany({
      where: {
        status: { in: ["PENDING", "ESCROW_FUNDED"] },
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        listingId: true,
      },
    });

    return NextResponse.json({
      count: pendingExpiration.length,
      trades: pendingExpiration,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
