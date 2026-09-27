import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Region } from "@prisma/client";

// PATCH /api/users/profile - Update display name and region for a user
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { joyIdAddress, displayName, region } = body;

    if (!joyIdAddress) {
      return NextResponse.json({ error: "Missing required joyIdAddress" }, { status: 400 });
    }

    if (!displayName || typeof displayName !== "string" || displayName.trim().length < 2) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const trimmedName = displayName.trim().slice(0, 30);

    const normalizedRegion: Region =
      region === "VN" || region === "VIETNAM" ? "VIETNAM" : "UK";

    const user = await prisma.user.upsert({
      where: { joyIdAddress },
      update: {
        displayName: trimmedName,
        region: normalizedRegion,
      },
      create: {
        joyIdAddress,
        displayName: trimmedName,
        region: normalizedRegion,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
