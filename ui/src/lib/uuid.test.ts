import { webcrypto } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { createUuid } from "./uuid";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
afterEach(() => vi.unstubAllGlobals());

it("generates distinct UUID v4 values without randomUUID on HTTP", () => {
  vi.stubGlobal("crypto", { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) });
  const ids = Array.from({ length: 1000 }, createUuid);
  expect(ids.every((id) => UUID_V4.test(id))).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
});

it("preserves the native UUID path on HTTPS", () => {
  const id = webcrypto.randomUUID();
  vi.stubGlobal("crypto", { randomUUID: () => id });
  expect(createUuid()).toBe(id);
});

it("sets the version and variant bits in HTTP-generated UUIDs", () => {
  vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(255) });
  expect(createUuid()).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
});

it("fails instead of using weak randomness when Web Crypto is unavailable", () => {
  vi.stubGlobal("crypto", undefined);
  expect(() => createUuid()).toThrow();
});
