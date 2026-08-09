import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unpackToRawSporeData } from "@spore-sdk/core";
import { ccc } from "@ckb-ccc/core";

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

    // Try fetching the raw on-chain Spore DOB cell content if available
    let onChainData = null;
    if (listing.sporeDobId) {
      try {
        const client = ccc.ClientPublicTestnet.default();
        const txHash = listing.sporeDobId.split(":")[0]!;
        const index = parseInt(listing.sporeDobId.split(":")[1] || "0");
        const cell = await client.getCellLive({ txHash, index: "0x" + index.toString(16) }, true);
        
        if (cell) {
          const rawSpore = unpackToRawSporeData(cell.outputData);
          const decodedContent = new TextDecoder().decode(rawSpore.content);
          onChainData = {
            contentType: rawSpore.contentType,
            content: JSON.parse(decodedContent),
          };
        }
      } catch (e) {
        // Safe fallback if indexer hasn't synced cell yet
        onChainData = { error: "Failed to load live cell from CKB target indexer" };
      }
    }

    // Map history timeline (minted first, then transferred trades)
    const history = [];
    
    // First entry: Minted by original seller
    history.push({
      event: "MINTED",
      user: listing.seller,
      date: listing.createdAt,
    });

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
      sporeDobId: listing.sporeDobId,
      onChainData,
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
