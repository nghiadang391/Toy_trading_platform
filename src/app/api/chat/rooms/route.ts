import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/chat/rooms - Create or retrieve a 1-on-1 chat room for a listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, buyerId, sellerId } = body;

    if (!buyerId || !sellerId) {
      return NextResponse.json({ error: "Buyer and Seller IDs are required" }, { status: 400 });
    }

    // Try to find an existing room for this listing and buyer/seller combination
    let room = await prisma.chatRoom.findFirst({
      where: {
        listingId: listingId || null,
        buyerId,
        sellerId,
      },
      include: {
        buyer: { select: { displayName: true, joyIdAddress: true } },
        seller: { select: { displayName: true, joyIdAddress: true } },
        listing: { select: { title: true } },
      },
    });

    // If no room exists, create a new one
    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          listingId: listingId || null,
          buyerId,
          sellerId,
        },
        include: {
          buyer: { select: { displayName: true, joyIdAddress: true } },
          seller: { select: { displayName: true, joyIdAddress: true } },
          listing: { select: { title: true } },
        },
      });
    }

    return NextResponse.json(room, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
