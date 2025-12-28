import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import app from "..";

describe("GET /", () => {
  it("should return status ok", async () => {
    const res = await app.request("/", {}, env);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "ok" });
  });
});
