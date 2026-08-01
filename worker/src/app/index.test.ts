import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, it, expect } from "vitest";

import * as schema from "../db/schema";
import app from "./";

/** data-* 属性は JSX が自動エスケープするので、読む側で実体参照を戻す */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // & は最後
}

/** #root の data-initial を取り出して parse する（値の " は &quot; になっている） */
function readInitialDataAttr(html: string): unknown {
  const matched = /data-initial="([^"]*)"/.exec(html);
  if (!matched) {
    expect.fail("data-initial 属性が見つからない");
  }
  const parsed: unknown = JSON.parse(decodeHtmlEntities(matched[1]));
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** ハートビート1件を持つデバイスを作り、その名前を返す */
async function seedDeviceWithHeartbeat(
  name: string,
  createdAt: string,
): Promise<string> {
  const db = drizzle(env.DB, { schema });
  const [device] = await db.insert(schema.devices).values({ name }).returning();
  await db.insert(schema.heartbeats).values({ deviceId: device.id, createdAt });
  return name;
}

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

  it("should server-render the actual device content", async () => {
    const name = `SSR Dashboard ${String(Date.now())}`;
    await seedDeviceWithHeartbeat(name, new Date().toISOString());

    const res = await app.request("/", {}, env);
    const html = await res.text();

    // クライアントJSを待たずに中身が入っていること
    expect(html).toContain(name);
    expect(html).toContain(">ok<");
    expect(html).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it("should embed round-trippable initial data", async () => {
    const name = `SSR Initial ${String(Date.now())}`;
    await seedDeviceWithHeartbeat(name, new Date().toISOString());

    const res = await app.request("/", {}, env);
    const initial = readInitialDataAttr(await res.text());

    if (!isRecord(initial)) {
      expect.fail("initial data がオブジェクトではない");
    }
    const { statuses, deviceReports } = initial;
    if (!isUnknownArray(statuses) || !isUnknownArray(deviceReports)) {
      expect.fail("statuses / deviceReports が配列ではない");
    }

    expect(statuses.some((s) => isRecord(s) && s.device === name)).toBe(true);
    expect(deviceReports.some((d) => isRecord(d) && d.name === name)).toBe(
      true,
    );
  });
});

describe("GET /devices/:device", () => {
  it("should render the shell for a URL-encoded device name", async () => {
    const name = `Detail Page Device ${String(Date.now())}`;
    await seedDeviceWithHeartbeat(name, new Date().toISOString());

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

  it("should render timestamps in JST", async () => {
    // workerd の ICU が root ロケールや UTC にフォールバックしたら落ちる。
    // これが崩れるとサーバーとクライアントで表示がずれ、引き継ぎ時にちらつく。
    const name = `JST Device ${String(Date.now())}`;
    await seedDeviceWithHeartbeat(name, "2026-01-02T15:30:00Z");

    const res = await app.request(
      `/devices/${encodeURIComponent(name)}`,
      {},
      env,
    );
    const html = await res.text();
    expect(html).toContain("2026/01/03 00:30");
  });

  it("should server-render the elapsed label", async () => {
    // useState(() => ...) がサーバーで走り useEffect が動かないことの確認も兼ねる
    const name = `Elapsed Device ${String(Date.now())}`;
    await seedDeviceWithHeartbeat(name, "2026-01-02T15:30:00Z");

    const res = await app.request(
      `/devices/${encodeURIComponent(name)}`,
      {},
      env,
    );
    const html = await res.text();
    expect(html).toMatch(/\d+日前/);
  });

  it("should trim embedded reports to the displayed columns", async () => {
    const name = `Trim Device ${String(Date.now())}`;
    await seedDeviceWithHeartbeat(name, new Date().toISOString());
    const db = drizzle(env.DB, { schema });
    const device = await db.query.devices.findFirst({
      where: (d, { eq }) => eq(d.name, name),
    });
    if (!device) {
      expect.fail("seed したデバイスが見つからない");
    }
    await db.insert(schema.reports).values({
      deviceId: device.id,
      status: "ok",
      createdAt: new Date().toISOString(),
    });

    const res = await app.request(
      `/devices/${encodeURIComponent(name)}`,
      {},
      env,
    );
    const initial = readInitialDataAttr(await res.text());

    if (!isRecord(initial) || !isUnknownArray(initial.reports)) {
      expect.fail("reports が配列ではない");
    }
    const [first] = initial.reports;
    if (!isRecord(first)) {
      expect.fail("report がオブジェクトではない");
    }
    // deviceId や nested device を載せると初期データが無駄に膨らむ
    expect(Object.keys(first).sort()).toEqual(["createdAt", "id", "status"]);
  });

  it("should round-trip a device name containing quotes and angle brackets", async () => {
    // 設計全体が JSX の属性自動エスケープに乗っているので固定する
    const name = `Quote "X" & <Y> ${String(Date.now())}`;
    await seedDeviceWithHeartbeat(name, new Date().toISOString());

    const res = await app.request(
      `/devices/${encodeURIComponent(name)}`,
      {},
      env,
    );
    expect(res.status).toBe(200);

    const initial = readInitialDataAttr(await res.text());
    if (!isRecord(initial) || !isRecord(initial.status)) {
      expect.fail("status がオブジェクトではない");
    }
    expect(initial.status.device).toBe(name);
  });

  it("should return 404 for an unknown device", async () => {
    const res = await app.request("/devices/NoSuchDevice", {}, env);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    // クライアントJSを起動させない
    expect(html).not.toContain('<div id="root"');
    expect(html).not.toContain("data-initial");
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
