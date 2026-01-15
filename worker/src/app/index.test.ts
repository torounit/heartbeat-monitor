import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import app from "./";

describe("GET /", () => {
  it("should return dashboard HTML", async () => {
    const res = await app.request("/", {}, env);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('<div id="root"');
  });
});

describe("GET /dashboard", () => {
  it("should redirect to /", async () => {
    const res = await app.request("/dashboard", {}, env);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
  });
});
