import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { HealthResponse } from "@/lib/types";

export async function GET() {
  let db: "connected" | "error" = "connected";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const response: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
    db,
    version: "0.1.0",
  };

  return NextResponse.json(response);
}
