import { desc, eq } from "drizzle-orm";

import * as schema from "../../db/schema";
import honoFactory, { authMiddleware } from "../../services/honoFactory";
import { getLocationByName } from "../../services/locations";

const reports = honoFactory
  .createApp()
  .use("*", authMiddleware)
  .get("/:location", async (c) => {
    const locationName = c.req.param("location");
    const db = c.get("db");

    const location = await getLocationByName(db, locationName);
    if (!location) {
      return c.json({ error: "Location Not Found" }, 404);
    }

    const reportsList = await db.query.reports.findMany({
      where: eq(schema.reports.locationId, location.id),
      orderBy: [desc(schema.reports.createdAt)],
    });

    return c.json(reportsList);
  });

export default reports;
