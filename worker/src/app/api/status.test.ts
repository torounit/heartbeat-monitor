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

function isStatusResponse(value: unknown): value is StatusResponse {
  return (
    !!value &&
    typeof value === "object" &&
    "location" in value &&
    typeof (value as { location?: unknown }).location === "string" &&
    "status" in value &&
    typeof (value as { status?: unknown }).status === "string" &&
    ["ok", "warn", "error", "pending"].includes(
      (value as { status: string }).status,
    )
  );
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
      const json: unknown = await res.json();
      expect(Array.isArray(json)).toBe(true);

      if (!Array.isArray(json) || json.length === 0) {
        return;
      }

      expect(json[0]).toHaveProperty("location");
      expect(json[0]).toHaveProperty("status");
      if (isStatusResponse(json[0])) {
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
      await db.insert(schema.heartbeats).values({
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const jsonUnknown = await res.json();
      expect(isStatusResponse(jsonUnknown)).toBe(true);
      if (!isStatusResponse(jsonUnknown)) return;
      const json = jsonUnknown;
      expect(json.location).toBe(testLocationName);
      expect(json.status).toBe("ok");
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const jsonUnknown = await res.json();
      expect(isStatusResponse(jsonUnknown)).toBe(true);
      if (!isStatusResponse(jsonUnknown)) return;
      const json = jsonUnknown;
      expect(json.location).toBe(testLocationName);
      expect(json.status).toBe("pending");
      expect(json.message).toBe("No heartbeats recorded yet");
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const jsonUnknown = await res.json();
      expect(isErrorResponse(jsonUnknown)).toBe(true);
      if (!isErrorResponse(jsonUnknown)) return;
      const json = jsonUnknown;
      expect(json.error).toBe("Location Not Found");
    });
  });
});
