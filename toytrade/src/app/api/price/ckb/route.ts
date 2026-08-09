import { NextResponse } from "next/server";
import { getLiveCkbPrice } from "@/lib/ckb/price-feed";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get("currency")?.toLowerCase() || "gbp";

    if (currency !== "gbp" && currency !== "vnd") {
      return NextResponse.json({ error: "Invalid currency parameter" }, { status: 400 });
    }

    const rate = await getLiveCkbPrice(currency);
    return NextResponse.json({ rate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
