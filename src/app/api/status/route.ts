import { NextResponse } from "next/server";
import { isRpcConfigured } from "@/lib/solana/rpc";

export async function GET() {
  return NextResponse.json({ rpcConfigured: isRpcConfigured() });
}
