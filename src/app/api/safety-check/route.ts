import { NextResponse } from "next/server";
import { checkToySafetyAsync } from "@/lib/safety/recall-checker";

// GET /api/safety-check?title=...&description=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "";
    const description = searchParams.get("description") || "";

    const result = await checkToySafetyAsync(title, description);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
