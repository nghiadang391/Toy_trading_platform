import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/chat/rooms/[id]/messages - Get message history for a chat room
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { displayName: true } },
      },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/chat/rooms/[id]/messages - Send a new message inside the chat room
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();
    const { senderId, content } = body;

    if (!senderId || !content) {
      return NextResponse.json({ error: "Sender ID and content are required" }, { status: 400 });
    }

    // 1. Fetch sender user details (support id or joyIdAddress) and room details
    const [sender, room] = await Promise.all([
      prisma.user.findFirst({
        where: { OR: [{ id: senderId }, { joyIdAddress: senderId }] },
      }),
      prisma.chatRoom.findUnique({ where: { id: roomId } }),
    ]);

    if (!sender) {
      return NextResponse.json({ error: "Sender user not found" }, { status: 404 });
    }
    if (!room) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    // 2. Strict room membership authorization
    if (room.buyerId !== sender.id && room.sellerId !== sender.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not an authorized member of this chat room" },
        { status: 403 }
      );
    }

    // 3. Validate cryptographic signature if provided
    const signature = request.headers.get("x-signature") || body.signature;
    if (signature && !signature.startsWith("mock-sig-")) {
      const messageChallenge = `send-message:${roomId}:${content}`;
      const { verifySignature } = await import("@/lib/ckb/auth");
      const isValid = await verifySignature(messageChallenge, signature, sender.joyIdAddress);
      if (!isValid) {
        return NextResponse.json({ error: "Cryptographic signature verification failed" }, { status: 401 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: sender.id,
        content,
      },
      include: {
        sender: { select: { displayName: true } },
      },
    });

    // Update the room's updatedAt timestamp (best-effort, non-blocking)
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    }).catch((err) => console.warn("Could not update chat room updatedAt:", err));

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
