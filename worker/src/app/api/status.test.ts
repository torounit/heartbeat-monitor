import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, expect, it } from "vitest";

import * as schema from "../../db/schema";
import status from "./status";

interface StatusResponse {
  device: string;
  status: "ok" | "warn" | "error" | "pending";
  lastLogAt?: string;
  timeSinceLastLogSeconds?: number;
}

interface ErrorResponse {
  error: string;
}

function isStatusResponse(value: unknown): value is StatusResponse {
  return (
    !!value &&
    typeof value === "object" &&
    "device" in value &&
    typeof (value as { device?: unknown }).device === "string" &&
    "status" in value &&
    typeof (value as { status?: unknown }).status === "string" &&
    ["ok", "warn", "error", "pending"].includes(
      (value as { status: string }).status,
    )
  );
}

// Array.isArray は unknown を any[] に絞ってしまうため、専用のガードを使う
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    !!value &&
    typeof value === "object" &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "string"
  );
}

describe("Status API", () => {
  describe("GET /", () => {
    it("should return status for all devices", async () => {
      const res = await status.request(
        "/",
        {
          method: "GET",
        },
        env,
      );
      expect(res.status).toBe(200);
      const json: unknown = await res.json();
      expect(Array.isArray(json)).toBe(true);

      if (!Array.isArray(json) || json.length === 0) {
        return;
      }

      expect(json[0]).toHaveProperty("device");
      expect(json[0]).toHaveProperty("status");
      if (isStatusResponse(json[0])) {
        expect(["ok", "warn", "error", "pending"]).toContain(json[0].status);
      }
    });
  });

  describe("GET /:device", () => {
    it("should return ok status for device with recent log", async () => {
      const db = drizzle(env.DB, { schema });

      // テスト用のdeviceを作成
      const testDeviceName = `Test Device ${String(Date.now())}`;
      const [device] = await db
        .insert(schema.devices)
        .values({ name: testDeviceName })
        .returning();

      // ログを追加
      await db.insert(schema.heartbeats).values({
        deviceId: device.id,
      });

      const res = await status.request(
        `/${encodeURIComponent(testDeviceName)}`,
        {
          method: "GET",
        },
        env,
      );

      expect(res.status).toBe(200);
      const jsonUnknown = await res.json();
      expect(isStatusResponse(jsonUnknown)).toBe(true);
      if (!isStatusResponse(jsonUnknown)) return;
      expect(jsonUnknown.device).toBe(testDeviceName);
      expect(jsonUnknown.status).toBe("ok");
      expect(jsonUnknown).toHaveProperty("lastLogAt");
      expect(jsonUnknown).toHaveProperty("timeSinceLastLogSeconds");
    });

    it("should return error status for device without logs", async () => {
      const db = drizzle(env.DB, { schema });

      // ログのないdeviceを作成
      const testDeviceName = `No Log Device ${String(Date.now())}`;
      await db
        .insert(schema.devices)
        .values({ name: testDeviceName })
        .returning();

      const res = await status.request(
        `/${encodeURIComponent(testDeviceName)}`,
        {
          method: "GET",
        },
        env,
      );

      expect(res.status).toBe(200);
      const jsonUnknown = await res.json();
      expect(isStatusResponse(jsonUnknown)).toBe(true);
      if (!isStatusResponse(jsonUnknown)) return;
      expect(jsonUnknown.device).toBe(testDeviceName);
      expect(jsonUnknown.status).toBe("pending");
    });

    it("should return 404 for non-existent device", async () => {
      const res = await status.request(
        "/NonExistentDevice",
        {
          method: "GET",
        },
        env,
      );
      expect(res.status).toBe(404);
      const jsonUnknown = await res.json();
      expect(isErrorResponse(jsonUnknown)).toBe(true);
      if (!isErrorResponse(jsonUnknown)) return;
      expect(jsonUnknown.error).toBe("Device Not Found");
    });
  });

  // 一覧・単体とも「デバイスごとに最新の1件」を取る実装なので、
  // 複数ハートビートがある状態で最新が選ばれることを固定する。
  describe("latest heartbeat selection", () => {
    const newest = "2026-03-03T03:00:00Z";

    async function seedDeviceWithThreeHeartbeats(): Promise<string> {
      const db = drizzle(env.DB, { schema });
      const name = `Multi Heartbeat Device ${String(Date.now())}`;
      const [device] = await db
        .insert(schema.devices)
        .values({ name })
        .returning();

      // わざと新しい順で入れない（挿入順ではなく created_at で選ぶこと）
      await db.insert(schema.heartbeats).values([
        { deviceId: device.id, createdAt: "2026-01-01T01:00:00Z" },
        { deviceId: device.id, createdAt: newest },
        { deviceId: device.id, createdAt: "2026-02-02T02:00:00Z" },
      ]);

      return name;
    }

    it("should pick the newest heartbeat in the list endpoint", async () => {
      const name = await seedDeviceWithThreeHeartbeats();

      const res = await status.request("/", { method: "GET" }, env);
      expect(res.status).toBe(200);

      const json: unknown = await res.json();
      if (!isUnknownArray(json)) {
        expect.fail("expected an array");
      }
      const target = json.find((s) => isStatusResponse(s) && s.device === name);
      if (!isStatusResponse(target)) {
        expect.fail("seeded device not found in response");
      }
      expect(target.lastLogAt).toBe(newest);
    });

    it("should pick the newest heartbeat in the single endpoint", async () => {
      const name = await seedDeviceWithThreeHeartbeats();

      const res = await status.request(
        `/${encodeURIComponent(name)}`,
        { method: "GET" },
        env,
      );
      expect(res.status).toBe(200);

      const jsonUnknown = await res.json();
      expect(isStatusResponse(jsonUnknown)).toBe(true);
      if (!isStatusResponse(jsonUnknown)) return;
      expect(jsonUnknown.lastLogAt).toBe(newest);
    });
  });
});
