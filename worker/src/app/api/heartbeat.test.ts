import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, expect, it } from "vitest";

import * as schema from "../../db/schema";
import heartbeat from "./heartbeat";

describe("Heartbeat API", () => {
  describe("POST /", () => {
    it("should return 404 for unknown device", async () => {
      const res = await heartbeat.request(
        "/",
        {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ device: "Unknown Device" }),
        },
        env,
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json).toEqual({ status: "Device Not Found" });
    });

    it("should accept heartbeat for existing device", async () => {
      const db = drizzle(env.DB, { schema });

      // テスト用のdeviceを作成
      const testDeviceName = `Test Device ${String(Date.now())}`;
      await db
        .insert(schema.devices)
        .values({ name: testDeviceName })
        .returning();

      const res = await heartbeat.request(
        "/",
        {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ device: testDeviceName }),
        },
        env,
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual({ status: "Heartbeat Logged" });
    });

    it("should accept heartbeat with location field for backward compatibility", async () => {
      const db = drizzle(env.DB, { schema });

      // テスト用のdeviceを作成
      const testDeviceName = `Test Device Compat ${String(Date.now())}`;
      await db
        .insert(schema.devices)
        .values({ name: testDeviceName })
        .returning();

      const res = await heartbeat.request(
        "/",
        {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ location: testDeviceName }),
        },
        env,
      );

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual({ status: "Heartbeat Logged" });
    });

    it("should validate request body", async () => {
      const res = await heartbeat.request(
        "/",
        {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({}),
        },
        env,
      );
      expect(res.status).toBe(400);
    });
  });
});
