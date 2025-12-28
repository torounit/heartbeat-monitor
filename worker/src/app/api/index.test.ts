import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import api from "./index";

describe("POST /heartbeat", () => {
  it("should return 404 for unknown location", async () => {
    const res = await api.request(
      "/heartbeat",
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
  const res = await api.request(
    "/heartbeat",
    {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ location: "Matsumoto Castle" }),
    },
    env,
  );
  expect(res.status).toBe(201);
  const json = await res.json();
  expect(json).toEqual({ status: "Heartbeat Logged" });
});
