import { Hono } from "hono";
import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "..";
import { createBasicAuthHeader } from "../../test/utilities";

describe("GET /", () => {
  it("should return status ok", async () => {
    const res = await app.request("/", {}, env);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "ok" });
  });
});
