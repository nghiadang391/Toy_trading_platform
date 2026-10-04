import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/notifications?userId=... - Fetch notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || searchParams.get("user");
    const joyIdAddress = searchParams.get("joyIdAddress") || searchParams.get("address");

    if (!userId && !joyIdAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: userId or joyIdAddress" },
        { status: 400 }
      );
    }

    // Resolve user by id or joyIdAddress
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }, { joyIdAddress: userId }] : []),
          ...(joyIdAddress ? [{ joyIdAddress }] : []),
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, markAll } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Resolve user ID in case joyIdAddress was provided
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { joyIdAddress: userId }],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { read: true },
      });
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Specify id or markAll: true" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
