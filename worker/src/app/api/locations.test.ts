import { Hono } from "hono";
import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import locations from "./locations";
import { createBasicAuthHeader } from "../../../test/utilities";

describe("POST register", () => {
  it("should register a new location", async () => {
    const res = await locations.request(
      "/register",
      {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          Authorization: createBasicAuthHeader(
            env.BASIC_AUTH_USERNAME,
            env.BASIC_AUTH_PASSWORD,
          ),
        }),
        body: JSON.stringify({ name: "Test Location" }),
      },
      env,
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual({ status: "Location Registered" });
  });
});
