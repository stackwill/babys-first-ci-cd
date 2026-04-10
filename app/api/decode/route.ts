import { NextResponse } from "next/server";
import { decodeBase64 } from "@/lib/base64";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: unknown };

  if (typeof body.text !== "string") {
    return NextResponse.json(
      { error: "Enter Base64 text to decode." },
      { status: 400 },
    );
  }

  const result = decodeBase64(body.text);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ result: result.value });
}
