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

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content,
      },
      include: {
        sender: { select: { displayName: true } },
      },
    });

    // Update the room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
