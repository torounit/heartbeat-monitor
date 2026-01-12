import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, expect, it } from "vitest";

import * as schema from "../../db/schema";
import heartbeat from "./heartbeat";

describe("Heartbeat API", () => {
  describe("POST /", () => {
    it("should return 404 for unknown location", async () => {
      const res = await heartbeat.request(
        "/",
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

    it("should accept heartbeat for existing location", async () => {
      const db = drizzle(env.DB, { schema });

      // テスト用のlocationを作成
      const testLocationName = `Test Location ${String(Date.now())}`;
      await db
        .insert(schema.locations)
        .values({ name: testLocationName })
        .returning();

      const res = await heartbeat.request(
        "/",
        {
          method: "POST",
          headers: new Headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ location: testLocationName }),
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
