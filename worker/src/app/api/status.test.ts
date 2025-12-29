import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, expect, it } from "vitest";

import { createBasicAuthHeader } from "../../../test/utilities";
import * as schema from "../../db/schema";
import status from "./status";

interface StatusResponse {
  location: string;
  status: "ok" | "warn" | "error" | "pending";
  message?: string;
  lastLogAt?: string;
  timeSinceLastLogSeconds?: number;
}

interface ErrorResponse {
  error: string;
}

describe("Status API", () => {
  const authHeader = () =>
    createBasicAuthHeader(env.BASIC_AUTH_USERNAME, env.BASIC_AUTH_PASSWORD);

  describe("GET /", () => {
    it("should return status for all locations", async () => {
      const res = await status.request(
        "/",
        {
          method: "GET",
          headers: new Headers({
            Authorization: authHeader(),
          }),
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);

      // 各要素がステータス情報を持っているか確認
      if (Array.isArray(json) && json.length > 0) {
        expect(json[0]).toHaveProperty("location");
        expect(json[0]).toHaveProperty("status");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(["ok", "warn", "error", "pending"]).toContain(json[0].status);
      }
    });

    it("should require authentication", async () => {
      const res = await status.request(
        "/",
        {
          method: "GET",
        },
        env,
      );
      expect(res.status).toBe(401);
    });
  });

  describe("GET /:location", () => {
    it("should return ok status for location with recent log", async () => {
      const db = drizzle(env.DB, { schema });

      // テスト用のlocationを作成
      const testLocationName = `Test Location ${String(Date.now())}`;
      const [location] = await db
        .insert(schema.locations)
        .values({ name: testLocationName })
        .returning();

      // ログを追加
      await db.insert(schema.logs).values({
        locationId: location.id,
      });

      const res = await status.request(
        `/${encodeURIComponent(testLocationName)}`,
        {
          method: "GET",
          headers: new Headers({
            Authorization: authHeader(),
          }),
        },
        env,
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toHaveProperty("location");
      expect(json).toHaveProperty("status");
      expect((json as StatusResponse).location).toBe(testLocationName);
      expect((json as StatusResponse).status).toBe("ok");
      expect(json).toHaveProperty("lastLogAt");
      expect(json).toHaveProperty("timeSinceLastLogSeconds");
    });

    it("should return error status for location without logs", async () => {
      const db = drizzle(env.DB, { schema });

      // ログのないlocationを作成
      const testLocationName = `No Log Location ${String(Date.now())}`;
      await db
        .insert(schema.locations)
        .values({ name: testLocationName })
        .returning();

      const res = await status.request(
        `/${encodeURIComponent(testLocationName)}`,
        {
          method: "GET",
          headers: new Headers({
            Authorization: authHeader(),
          }),
        },
        env,
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect((json as StatusResponse).location).toBe(testLocationName);
      expect((json as StatusResponse).status).toBe("pending");
      expect((json as StatusResponse).message).toBe("No logs recorded yet");
    });

    it("should return 404 for non-existent location", async () => {
      const res = await status.request(
        "/NonExistentLocation",
        {
          method: "GET",
          headers: new Headers({
            Authorization: authHeader(),
          }),
        },
        env,
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect((json as ErrorResponse).error).toBe("Location Not Found");
    });

    it("should require authentication", async () => {
      const res = await status.request(
        "/SomeLocation",
        {
          method: "GET",
        },
        env,
      );
      expect(res.status).toBe(401);
    });
  });
});
