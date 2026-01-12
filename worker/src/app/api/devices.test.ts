import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import locations from "./locations";

describe("Locations API", () => {
  describe("GET /", () => {
    it("should return all locations", async () => {
      const res = await locations.request(
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

  describe("POST /", () => {
    it("should register a new location", async () => {
      const uniqueName = `Test Location ${String(Date.now())}`;
      const res = await locations.request(
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
      expect(json).toEqual({ status: "Location Registered" });
    });

    it("should return 409 when location already exists", async () => {
      const duplicateName = `Duplicate Location ${String(Date.now())}`;

      // 最初の登録
      await locations.request(
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
      const res = await locations.request(
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
      expect(json).toEqual({ status: "Location Already Exists" });
    });
  });

  describe("DELETE /:name", () => {
    it("should delete an existing location", async () => {
      const locationName = `Location to Delete ${String(Date.now())}`;

      // まず location を登録
      await locations.request(
        "/",
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ name: locationName }),
        },
        env,
      );

      // 削除
      const res = await locations.request(
        `/${encodeURIComponent(locationName)}`,
        {
          method: "DELETE",
        },
        env,
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ status: "Location Deleted" });
    });

    it("should return 404 when location does not exist", async () => {
      const res = await locations.request(
        "/NonExistentLocation",
        {
          method: "DELETE",
        },
        env,
      );
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json).toEqual({ status: "Location Not Found" });
    });
  });
});
