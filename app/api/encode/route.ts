import { NextResponse } from "next/server";
import { encodeBase64 } from "@/lib/base64";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: unknown };

  if (typeof body.text !== "string" || body.text.length === 0) {
    return NextResponse.json({ error: "Enter text to encode." }, { status: 400 });
  }

  return NextResponse.json({ result: encodeBase64(body.text) });
}
