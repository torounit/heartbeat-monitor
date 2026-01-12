import { desc, eq } from "drizzle-orm";

import * as schema from "../../db/schema";
import { getDeviceByName } from "../../services/devices";
import honoFactory from "../../services/honoFactory";

const reports = honoFactory
  .createApp()
  .get("/", async (c) => {
    const db = c.get("db");

    const reportsList = await db.query.reports.findMany({
      orderBy: [desc(schema.reports.createdAt)],
      with: {
        device: true,
      },
    });

    return c.json(reportsList);
  })
  .get("/:device", async (c) => {
    const deviceName = c.req.param("device");
    const db = c.get("db");

    const device = await getDeviceByName(db, deviceName);
    if (!device) {
      return c.json({ error: "Device Not Found" }, 404);
    }

    const reportsList = await db.query.reports.findMany({
      where: eq(schema.reports.deviceId, device.id),
      orderBy: [desc(schema.reports.createdAt)],
      with: {
        device: true,
      },
    });

    return c.json(reportsList);
  });

export default reports;
