import { getHeartbeatStatus } from "../../services/heartbeats";
import honoFactory from "../../services/honoFactory";
import { getDeviceByName, getDevices } from "../../services/devices";

interface StatusInfo {
  device: string;
  status: "ok" | "warn" | "error" | "pending";
  lastLogAt: string;
  timeSinceLastLogSeconds?: number;
}

function enrichStatus(baseStatus: {
  device: string;
  status: "ok" | "warn" | "error" | "pending";
  lastLogAt: string;
}): StatusInfo {
  const { device, status, lastLogAt } = baseStatus;

  if (status === "pending") {
    return {
      device,
      status,
      lastLogAt,
    };
  }

  // timeSinceLastLogSecondsを計算
  const latestTime = new Date(lastLogAt);
  const now = new Date();
  const timeSinceLastLogSeconds = Math.floor(
    (now.getTime() - latestTime.getTime()) / 1000,
  );

  return {
    device,
    status,
    lastLogAt,
    timeSinceLastLogSeconds,
  };
}

const status = honoFactory
  .createApp()
  .get("/", async (c) => {
    const db = c.get("db");

    const devices = await getDevices(db);
    const statuses = (
      await Promise.all(
        devices.map((device) => getHeartbeatStatus(db, device.name)),
      )
    )
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(enrichStatus);

    return c.json(statuses);
  })
  .get("/:device", async (c) => {
    const deviceName = c.req.param("device");
    const db = c.get("db");

    const device = await getDeviceByName(db, deviceName);
    if (!device) {
      return c.json({ error: "Device Not Found" }, 404);
    }

    const baseStatus = await getHeartbeatStatus(db, deviceName);
    if (!baseStatus) {
      return c.json({ error: "Status Not Available" }, 500);
    }

    return c.json(enrichStatus(baseStatus));
  });

export default status;
