import { describe, expect, test } from "bun:test";
import { generatePublicHandle, PUBLIC_HANDLE_PATTERN } from "./index";

describe("public handle candidates", () => {
  test("generate canonical, URL-safe handles", () => {
    for (let i = 0; i < 100; i++) {
      const handle = generatePublicHandle();
      expect(handle).toMatch(PUBLIC_HANDLE_PATTERN);
      expect(handle).toBe(handle.toLowerCase());
    }
  });

  test("reject malformed or manually formatted handles", () => {
    for (const invalid of ["admin", "@quiet-orbit-000001", "Quiet-orbit-000001", "quiet-orbit-12345", "quiet/orbit/000001"]) {
      expect(PUBLIC_HANDLE_PATTERN.test(invalid)).toBe(false);
    }
  });
});
