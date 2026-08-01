import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, expect, it } from "vitest";

import * as schema from "../../db/schema";
import devices from "./devices";

interface DeviceWithReportsResponse {
  id: number;
  name: string;
  reports: { id: number; status: string; createdAt: string }[];
}

// Array.isArray は unknown を any[] に絞ってしまうため、専用のガードを使う
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isDeviceWithReportsResponse(
  value: unknown,
): value is DeviceWithReportsResponse {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "number" &&
    "name" in value &&
    typeof (value as { name?: unknown }).name === "string" &&
    "reports" in value &&
    Array.isArray((value as { reports?: unknown }).reports)
  );
}

/** レポート3件を持つデバイスを作成し、その名前を返す */
async function seedDeviceWithReports(): Promise<string> {
  const db = drizzle(env.DB, { schema });
  const name = `Report Limit Device ${String(Date.now())}`;
  const [device] = await db.insert(schema.devices).values({ name }).returning();

  const base = Date.now();
  await db.insert(schema.reports).values([
    {
      deviceId: device.id,
      status: "ok",
      createdAt: new Date(base).toISOString(),
    },
    {
      deviceId: device.id,
      status: "warn",
      createdAt: new Date(base - 60_000).toISOString(),
    },
    {
      deviceId: device.id,
      status: "error",
      createdAt: new Date(base - 120_000).toISOString(),
    },
  ]);

  return name;
}

describe("Devices API", () => {
  describe("GET /", () => {
    it("should return all devices", async () => {
      const res = await devices.request(
        "/",
        {
          method: "GET",
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    });
  });

  describe("GET /reports", () => {
    it("should limit reports per device when limit is given", async () => {
      const name = await seedDeviceWithReports();

      const res = await devices.request(
        "/reports?limit=2",
        { method: "GET" },
        env,
      );
      expect(res.status).toBe(200);

      const json: unknown = await res.json();
      if (!isUnknownArray(json)) {
        expect.fail("expected an array");
      }
      const target = json.find(
        (d) => isDeviceWithReportsResponse(d) && d.name === name,
      );
      if (!isDeviceWithReportsResponse(target)) {
        expect.fail("seeded device not found in response");
      }

      expect(target.reports).toHaveLength(2);
      // createdAt の降順（新しい順）で切り取られていること
      expect(target.reports.map((r) => r.status)).toEqual(["ok", "warn"]);
    });

    it("should return all reports when limit is omitted", async () => {
      const name = await seedDeviceWithReports();

      const res = await devices.request("/reports", { method: "GET" }, env);
      expect(res.status).toBe(200);

      const json: unknown = await res.json();
      if (!isUnknownArray(json)) {
        expect.fail("expected an array");
      }
      const target = json.find(
        (d) => isDeviceWithReportsResponse(d) && d.name === name,
      );
      if (!isDeviceWithReportsResponse(target)) {
        expect.fail("seeded device not found in response");
      }

      expect(target.reports).toHaveLength(3);
    });

    it("should apply the limit per device, not globally", async () => {
      await seedDeviceWithReports();

      const res = await devices.request(
        "/reports?limit=1",
        { method: "GET" },
        env,
      );
      expect(res.status).toBe(200);

      const json: unknown = await res.json();
      if (!isUnknownArray(json)) {
        expect.fail("expected an array");
      }
      expect(json.length).toBeGreaterThan(0);
      for (const device of json) {
        if (!isDeviceWithReportsResponse(device)) {
          expect.fail("unexpected response shape");
        }
        expect(device.reports.length).toBeLessThanOrEqual(1);
      }
    });

    it("should return 400 for an invalid limit", async () => {
      const zero = await devices.request(
        "/reports?limit=0",
        { method: "GET" },
        env,
      );
      expect(zero.status).toBe(400);

      const nan = await devices.request(
        "/reports?limit=abc",
        { method: "GET" },
        env,
      );
      expect(nan.status).toBe(400);
    });
  });

  describe("POST /", () => {
    it("should register a new device", async () => {
      const uniqueName = `Test Device ${String(Date.now())}`;
      const res = await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: uniqueName }),
        },
        env,
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Registered" });
    });

    it("should return 409 when device already exists", async () => {
      const duplicateName = `Duplicate Device ${String(Date.now())}`;

      // 最初の登録
      await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: duplicateName }),
        },
        env,
      );

      // 2回目の登録（重複）
      const res = await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: duplicateName }),
        },
        env,
      );
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Already Exists" });
    });
  });

  describe("PUT /:name", () => {
    it("should update an existing device", async () => {
      const originalName = `Original Device ${String(Date.now())}`;
      const newName = `Updated Device ${String(Date.now())}`;

      // まず device を登録
      await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: originalName }),
        },
        env,
      );

      // デバイス名を更新
      const res = await devices.request(
        `/${encodeURIComponent(originalName)}`,
        {
          method: "PUT",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: newName }),
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Updated", name: newName });

      // 更新後のデバイスを確認
      const getRes = await devices.request("/", { method: "GET" }, env);
      const allDevices: { name: string }[] = await getRes.json();
      const updatedDevice = allDevices.find((d) => d.name === newName);
      expect(updatedDevice).toBeDefined();
      expect(updatedDevice?.name).toBe(newName);

      // 元の名前のデバイスが存在しないことを確認
      const oldDevice = allDevices.find((d) => d.name === originalName);
      expect(oldDevice).toBeUndefined();
    });

    it("should return 404 when device does not exist", async () => {
      const res = await devices.request(
        "/NonExistentDevice",
        {
          method: "PUT",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: "New Name" }),
        },
        env,
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Not Found" });
    });

    it("should return 409 when new device name already exists", async () => {
      const device1Name = `Device 1 ${String(Date.now())}`;
      const device2Name = `Device 2 ${String(Date.now())}`;

      // 2つのデバイスを登録
      await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: device1Name }),
        },
        env,
      );

      await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: device2Name }),
        },
        env,
      );

      // device1の名前をdevice2の名前に変更しようとする（重複）
      const res = await devices.request(
        `/${encodeURIComponent(device1Name)}`,
        {
          method: "PUT",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: device2Name }),
        },
        env,
      );
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Name Already Exists" });
    });

    it("should allow updating device with the same name", async () => {
      const deviceName = `Same Name Device ${String(Date.now())}`;

      // デバイスを登録
      await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: deviceName }),
        },
        env,
      );

      // 同じ名前で更新（許可されるべき）
      const res = await devices.request(
        `/${encodeURIComponent(deviceName)}`,
        {
          method: "PUT",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: deviceName }),
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Updated", name: deviceName });
    });
  });

  describe("DELETE /:name", () => {
    it("should delete an existing device", async () => {
      const deviceName = `Device to Delete ${String(Date.now())}`;

      // まず device を登録
      await devices.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: deviceName }),
        },
        env,
      );

      // 削除
      const res = await devices.request(
        `/${encodeURIComponent(deviceName)}`,
        {
          method: "DELETE",
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Deleted" });
    });

    it("should return 404 when device does not exist", async () => {
      const res = await devices.request(
        "/NonExistentDevice",
        {
          method: "DELETE",
        },
        env,
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Not Found" });
    });
  });
});
