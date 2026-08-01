import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, it, expect } from "vitest";

import * as schema from "../db/schema";
import app from "./";

describe("GET /", () => {
  it("should return dashboard HTML", async () => {
    const res = await app.request("/", {}, env);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('<div id="root"');
  });

  it("should render a mobile-ready document head", async () => {
    const res = await app.request("/", {}, env);
    const html = await res.text();
    // viewport が欠けるとモバイルレイアウトが丸ごと無効になるため恒久的に検証する
    expect(html).toContain('name="viewport"');
    expect(html).toContain('lang="ja"');
    expect(html).toContain("<title>");
  });
});

describe("GET /devices/:device", () => {
  it("should render the shell for a URL-encoded device name", async () => {
    const db = drizzle(env.DB, { schema });
    const name = `Detail Page Device ${String(Date.now())}`;
    await db.insert(schema.devices).values({ name });

    const res = await app.request(
      `/devices/${encodeURIComponent(name)}`,
      {},
      env,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain('<div id="root"');
    // デコード済みのデバイス名がクライアントへ渡ること
    expect(html).toContain(`data-device="${name}"`);
    expect(html).toContain(`<title>${name} | Heartbeat Monitor</title>`);
  });

  it("should return 404 for an unknown device", async () => {
    const res = await app.request("/devices/NoSuchDevice", {}, env);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    // クライアントJSを起動させない
    expect(html).not.toContain('<div id="root"');
    expect(html).toContain("デバイスが見つかりません");
  });
});

describe("GET /dashboard", () => {
  it("should redirect to /", async () => {
    const res = await app.request("/dashboard", {}, env);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
  });
});
