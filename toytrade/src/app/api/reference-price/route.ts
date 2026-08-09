import { NextResponse } from "next/server";
import { getReferencePrice } from "@/lib/serpapi/reference-price";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrl, currency } = body;

    if (!imageUrl || !currency) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (currency !== "GBP" && currency !== "VND") {
      return NextResponse.json({ error: "Invalid currency parameter" }, { status: 400 });
    }

    const referencePrice = await getReferencePrice(imageUrl, currency);
    return NextResponse.json({ referencePrice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
