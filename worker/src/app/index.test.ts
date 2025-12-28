import { Hono } from "hono";
import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "..";

describe("GET /", () => {
  it("should return status ok", async () => {
    const res = await app.request("/", {}, env);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "ok" });
  });
});

describe("POST /api/locations/register", () => {
  it("should register a new location", async () => {
    const res = await app.request(
      "/api/locations/register",
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

describe("POST /api/heartbeat", () => {
  it("should return 404 for unknown location", async () => {
    const res = await app.request(
      "/api/heartbeat",
      {
        method: "POST",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ location: "Unknown Location" }),
      },
      env,
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ status: "Location Not Found" });
  });
});

it("should accept heartbeat for existing location", async () => {
  // First, register the location
  await app.request(
    "/api/locations/register",
    {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name: "Heartbeat Location" }),
    },
    env,
  );

  // Now, send heartbeat
  const res = await app.request(
    "/api/heartbeat",
    {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ location: "Heartbeat Location" }),
    },
    env,
  );
  expect(res.status).toBe(201);
  const json = await res.json();
  expect(json).toEqual({ status: "Heartbeat Logged" });
});
