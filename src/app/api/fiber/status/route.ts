import { NextResponse } from "next/server";
import { fiberClient } from "@/lib/fiber/fnnClient";

// GET /api/fiber/status - Health check for Fiber Network Node
export async function GET() {
  try {
    const health = await fiberClient.checkHealth();
    return NextResponse.json({
      ...health,
      defaultEngine: "FIBER",
      fallbackEngine: "CKB_L1",
    });
  } catch (error: any) {
    return NextResponse.json({
      isAvailable: false,
      reason: error.message,
      defaultEngine: "FIBER",
      fallbackEngine: "CKB_L1",
    }, { status: 200 });
  }
}
