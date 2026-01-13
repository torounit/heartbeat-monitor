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
