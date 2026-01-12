import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import devices from "./devices";

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
