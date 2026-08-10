import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ToyCondition } from "@prisma/client";

// GET /api/passport/[id] - Fetch Toy Passport (Spore DOB) and timeline logs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Retrieve database metadata records
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            joyIdAddress: true,
          },
        },
        passportLogs: {
          orderBy: {
            createdAt: "asc",
          },
        },
        trades: {
          include: {
            buyer: {
              select: {
                id: true,
                displayName: true,
                joyIdAddress: true,
              },
            },
            seller: {
              select: {
                id: true,
                displayName: true,
                joyIdAddress: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Try fetching raw on-chain Spore DOB cell data if available
    let onChainData = null;
    if (listing.sporeDobId) {
      try {
        const txHash = listing.sporeDobId.split(":")[0]!;
        onChainData = {
          sporeCellId: listing.sporeDobId,
          txHash,
          contentType: "application/json+dob",
          simulatedOnChainState: "LIVE_CELL",
        };
      } catch (e) {
        onChainData = { error: "Failed to load live cell from CKB target indexer" };
      }
    }

    // Map history timeline (minted first, then transferred trades & passport logs)
    const history: any[] = [];
    
    // First entry: Minted by original seller
    history.push({
      event: "MINTED",
      user: listing.seller,
      condition: listing.condition,
      date: listing.createdAt,
    });

    // Append custom condition passport logs
    for (const log of listing.passportLogs) {
      history.push({
        event: "PASSPORT_STAMP",
        ownerAddress: log.ownerAddress,
        condition: log.condition,
        notes: log.notes,
        photoUrl: log.photoUrl,
        date: log.createdAt,
      });
    }

    // Append completed trades
    for (const trade of listing.trades) {
      if (trade.status === "COMPLETED") {
        history.push({
          event: "TRANSFERRED",
          from: trade.seller,
          to: trade.buyer,
          priceCkb: trade.priceCkb.toString(),
          date: trade.completedAt || trade.createdAt,
        });
      }
    }

    return NextResponse.json({
      listingId: listing.id,
      title: listing.title,
      condition: listing.condition,
      isRecalled: listing.isRecalled,
      recallReason: listing.recallReason,
      sporeDobId: listing.sporeDobId,
      onChainData,
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/passport/[id] - Add a new condition timeline log to the Toy Passport
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const body = await request.json();
    const { ownerAddress, condition, notes, photoUrl, tradeId } = body;

    if (!ownerAddress || !condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await prisma.passportLog.create({
      data: {
        listingId,
        tradeId: tradeId || null,
        ownerAddress,
        condition: condition as ToyCondition,
        photoUrl: photoUrl || null,
        notes: notes || "Passport condition update",
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
