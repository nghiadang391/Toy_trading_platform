import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Region } from "@prisma/client";

// POST /api/users - Create/Register or fetch user by JoyID address
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { joyIdAddress, displayName, region } = body;

    if (!joyIdAddress || !displayName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Try finding existing user first, else create
    let user = await prisma.user.findUnique({
      where: { joyIdAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          joyIdAddress,
          displayName,
          region: (region as Region) || "UK",
        },
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
