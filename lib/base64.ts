export type DecodeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function encodeBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

export function decodeBase64(text: string): DecodeResult {
  if (text.length === 0) {
    return { ok: false, error: "Enter Base64 text to decode." };
  }

  const normalized = text.trim();

  if (!/^[A-Za-z0-9+/=]+$/.test(normalized) || normalized.length % 4 !== 0) {
    return { ok: false, error: "Enter valid Base64 text." };
  }

  try {
    const value = Buffer.from(normalized, "base64").toString("utf8");
    const roundTrip = Buffer.from(value, "utf8").toString("base64");

    if (roundTrip.replace(/=+$/, "") !== normalized.replace(/=+$/, "")) {
      return { ok: false, error: "Enter valid Base64 text." };
    }

    return { ok: true, value };
  } catch {
    return { ok: false, error: "Enter valid Base64 text." };
  }
}
