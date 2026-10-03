import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/chat/rooms - Fetch all chat rooms for a specific user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Resolve user by id or joyIdAddress
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { joyIdAddress: userId }],
      },
    });

    const resolvedUserId = user ? user.id : userId;

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [
          { buyerId: resolvedUserId },
          { sellerId: resolvedUserId }
        ]
      },
      include: {
        buyer: { select: { id: true, displayName: true } },
        seller: { select: { id: true, displayName: true } },
        listing: { select: { title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/rooms - Create or retrieve a 1-on-1 chat room for a listing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, buyerId, sellerId } = body;

    if (!buyerId || !sellerId) {
      return NextResponse.json({ error: "Buyer and Seller IDs are required" }, { status: 400 });
    }

    // 1. Fetch buyer and seller registered records by id OR joyIdAddress
    let [buyer, seller] = await Promise.all([
      prisma.user.findFirst({
        where: { OR: [{ id: buyerId }, { joyIdAddress: buyerId }] },
      }),
      prisma.user.findFirst({
        where: { OR: [{ id: sellerId }, { joyIdAddress: sellerId }] },
      }),
    ]);

    // Auto-provision buyer if they connected their JoyID wallet but are not in DB yet
    if (!buyer && (buyerId.startsWith("ckt1") || buyerId.startsWith("usr_"))) {
      buyer = await prisma.user.create({
        data: {
          joyIdAddress: buyerId.startsWith("ckt1") ? buyerId : `ckt1_${buyerId}`,
          displayName: "Passkey User " + buyerId.substring(buyerId.length - 4),
          region: "UK",
        },
      });
    }

    if (!buyer) {
      return NextResponse.json({ error: "Buyer user not found" }, { status: 404 });
    }
    if (!seller) {
      return NextResponse.json({ error: "Seller user not found" }, { status: 404 });
    }

    if (buyer.id === seller.id) {
      return NextResponse.json({ error: "Cannot create chat room with yourself" }, { status: 400 });
    }

    // 2. Validate cryptographic signature if provided
    const signature = request.headers.get("x-signature") || body.signature;
    if (signature && !signature.startsWith("mock-sig-")) {
      const message = `create-room:${buyer.id}:${seller.id}`;
      const { verifySignature } = await import("@/lib/ckb/auth");
      const isValid = await verifySignature(message, signature, buyer.joyIdAddress);
      if (!isValid) {
        return NextResponse.json({ error: "Cryptographic signature verification failed" }, { status: 401 });
      }
    }

    const cleanListingId = listingId || null;
    const finalBuyerId = buyer.id;
    const finalSellerId = seller.id;

    // Try to find an existing room for this listing and buyer/seller combination
    let room = await prisma.chatRoom.findFirst({
      where: {
        listingId: cleanListingId,
        buyerId: finalBuyerId,
        sellerId: finalSellerId,
      },
      include: {
        buyer: { select: { displayName: true, joyIdAddress: true } },
        seller: { select: { displayName: true, joyIdAddress: true } },
        listing: { select: { title: true } },
      },
    });

    // If no room exists, create a new one safely handling concurrent unique constraints
    if (!room) {
      try {
        room = await prisma.chatRoom.create({
          data: {
            listingId: cleanListingId,
            buyerId: finalBuyerId,
            sellerId: finalSellerId,
          },
          include: {
            buyer: { select: { displayName: true, joyIdAddress: true } },
            seller: { select: { displayName: true, joyIdAddress: true } },
            listing: { select: { title: true } },
          },
        });
      } catch (err: any) {
        // If a concurrent request created the room first (UNIQUE constraint error), retrieve it
        room = await prisma.chatRoom.findFirst({
          where: {
            listingId: cleanListingId,
            buyerId: finalBuyerId,
            sellerId: finalSellerId,
          },
          include: {
            buyer: { select: { displayName: true, joyIdAddress: true } },
            seller: { select: { displayName: true, joyIdAddress: true } },
            listing: { select: { title: true } },
          },
        });

        if (!room) {
          throw err;
        }
      }
    }

    return NextResponse.json(room, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
