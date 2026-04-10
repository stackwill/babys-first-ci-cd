import { describe, expect, test } from "bun:test";
import { decodeBase64, encodeBase64 } from "../lib/base64";

describe("base64 helpers", () => {
  test("encodes utf-8 text to base64", () => {
    expect(encodeBase64("hello world")).toBe("aGVsbG8gd29ybGQ=");
  });

  test("decodes valid base64 to utf-8 text", () => {
    const result = decodeBase64("aGVsbG8gd29ybGQ=");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("hello world");
    }
  });

  test("rejects invalid base64 input", () => {
    const result = decodeBase64("%%%");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Enter valid Base64 text.");
    }
  });

  test("rejects empty input", () => {
    const result = decodeBase64("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Enter Base64 text to decode.");
    }
  });
});
