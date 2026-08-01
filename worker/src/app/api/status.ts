import { getDeviceStatus, getDeviceStatuses } from "../../services/heartbeats";
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

    const deviceStatus = await getDeviceStatus(db, deviceName);
    if (!deviceStatus) {
      return c.json({ error: "Device Not Found" }, 404);
    }

    return c.json(deviceStatus);
  });

export default status;
