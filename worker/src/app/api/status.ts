import { getDeviceByName } from "../../services/devices";
import {
  enrichStatus,
  getDeviceStatuses,
  getHeartbeatStatus,
} from "../../services/heartbeats";
import honoFactory from "../../services/honoFactory";

const status = honoFactory
  .createApp()
  .get("/", async (c) => {
    const db = c.get("db");

    return c.json(await getDeviceStatuses(db));
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
