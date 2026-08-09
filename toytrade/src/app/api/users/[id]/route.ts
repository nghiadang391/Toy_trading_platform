import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        listings: true,
        ratingsReceived: {
          select: {
            score: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalRatings = user.ratingsReceived.length;
    const averageRating = totalRatings > 0
      ? user.ratingsReceived.reduce((sum, r) => sum + r.score, 0) / totalRatings
      : 0;

    return NextResponse.json({
      ...user,
      averageRating,
      totalRatings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
