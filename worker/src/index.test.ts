import { Hono } from "hono";
import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "./";

describe("GET /", () => {
  it("should return status ok", async () => {
    const res = await app.request("/", {}, env);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "ok" });
  });
});

describe("POST /api/location/register", () => {
  it("should register a new location", async () => {
    const res = await app.request(
      "/api/location/register",
      {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: "Test Location" }),
      },
      env,
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({ status: "Location Registered" });
  });
});
