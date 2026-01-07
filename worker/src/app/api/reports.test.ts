import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, expect, it } from "vitest";

import { createBasicAuthHeader } from "../../../test/utilities";
import * as schema from "../../db/schema";
import reports from "./reports";

interface ReportResponse {
  id: number;
  locationId: number;
  status: "ok" | "warn" | "error" | "pending";
  createdAt: string;
  location: {
    id: number;
    name: string;
  };
}

interface ErrorResponse {
  error: string;
}

function isReportResponse(value: unknown): value is ReportResponse {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "number" &&
    "locationId" in value &&
    typeof (value as { locationId?: unknown }).locationId === "number" &&
    "status" in value &&
    typeof (value as { status?: unknown }).status === "string" &&
    ["ok", "warn", "error", "pending"].includes(
      (value as { status: string }).status,
    ) &&
    "createdAt" in value &&
    typeof (value as { createdAt?: unknown }).createdAt === "string" &&
    "location" in value &&
    typeof (value as { location?: unknown }).location === "object"
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

describe("Reports API", () => {
  const authHeader = () =>
    createBasicAuthHeader(env.BASIC_AUTH_USERNAME, env.BASIC_AUTH_PASSWORD);

  describe("GET /", () => {
    it("should return all reports", async () => {
      const res = await reports.request(
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

      expect(json[0]).toHaveProperty("id");
      expect(json[0]).toHaveProperty("locationId");
      expect(json[0]).toHaveProperty("status");
      expect(json[0]).toHaveProperty("createdAt");
      expect(json[0]).toHaveProperty("location");
      if (isReportResponse(json[0])) {
        expect(["ok", "warn", "error", "pending"]).toContain(json[0].status);
        expect(json[0].location).toHaveProperty("id");
        expect(json[0].location).toHaveProperty("name");
      }
    });

    it("should require authentication", async () => {
      const res = await reports.request(
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
    it("should return reports for a specific location", async () => {
      const db = drizzle(env.DB, { schema });

      // テスト用のlocationを作成
      const testLocationName = `Test Location ${String(Date.now())}`;
      const [location] = await db
        .insert(schema.locations)
        .values({ name: testLocationName })
        .returning();

      // reportsを追加
      await db.insert(schema.reports).values([
        {
          locationId: location.id,
          status: "ok",
          createdAt: new Date().toISOString(),
        },
        {
          locationId: location.id,
          status: "warn",
          createdAt: new Date(Date.now() - 60000).toISOString(), // 1分前
        },
        {
          locationId: location.id,
          status: "error",
          createdAt: new Date(Date.now() - 120000).toISOString(), // 2分前
        },
      ]);

      const res = await reports.request(
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
      const jsonUnknown = await res.json();
      expect(Array.isArray(jsonUnknown)).toBe(true);

      if (!Array.isArray(jsonUnknown) || jsonUnknown.length === 0) {
        return;
      }

      // 最初のレポートが最新であることを確認
      expect(isReportResponse(jsonUnknown[0])).toBe(true);
      if (!isReportResponse(jsonUnknown[0])) return;
      expect(jsonUnknown[0].locationId).toBe(location.id);
      expect(jsonUnknown[0].status).toBe("ok");
      expect(jsonUnknown[0].location.id).toBe(location.id);
      expect(jsonUnknown[0].location.name).toBe(testLocationName);

      // 降順でソートされていることを確認
      expect(jsonUnknown.length).toBe(3);
      if (!isReportResponse(jsonUnknown[1])) return;
      expect(jsonUnknown[1].status).toBe("warn");
      if (!isReportResponse(jsonUnknown[2])) return;
      expect(jsonUnknown[2].status).toBe("error");
    });

    it("should return empty array for location without reports", async () => {
      const db = drizzle(env.DB, { schema });

      // reportsのないlocationを作成
      const testLocationName = `No Reports Location ${String(Date.now())}`;
      await db
        .insert(schema.locations)
        .values({ name: testLocationName })
        .returning();

      const res = await reports.request(
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
      const jsonUnknown = await res.json();
      expect(Array.isArray(jsonUnknown)).toBe(true);
      if (!Array.isArray(jsonUnknown)) return;
      expect(jsonUnknown.length).toBe(0);
    });

    it("should return 404 for non-existent location", async () => {
      const res = await reports.request(
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
      const jsonUnknown = await res.json();
      expect(isErrorResponse(jsonUnknown)).toBe(true);
      if (!isErrorResponse(jsonUnknown)) return;
      expect(jsonUnknown.error).toBe("Location Not Found");
    });

    it("should require authentication", async () => {
      const res = await reports.request(
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
