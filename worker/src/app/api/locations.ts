import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";

import * as schema from "../../db/schema";
import honoFactory, { authMiddleware } from "../../services/honoFactory";

const locations = honoFactory
  .createApp()
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const db = c.get("db");
    const allLocations = await db.query.locations.findMany();
    return c.json(allLocations);
  })
  .get("/reports", async (c) => {
    const db = c.get("db");
    const reportsList = await db.query.locations.findMany({
      with: {
        reports: true,
      },
    });

    return c.json(reportsList);
  })
  .post(
    "/register",
    zValidator(
      "json",
      z.object({
        name: z.string(),
      }),
    ),
    async (c) => {
      const data = c.req.valid("json");
      const db = c.get("db");
      const existingLocation = await db.query.locations.findFirst({
        where: eq(schema.locations.name, data.name),
      });

      if (existingLocation) {
        return c.json({ status: "Location Already Exists" }, 409);
      }

      await db.insert(schema.locations).values({
        name: data.name,
      });

      return c.json({ status: "Location Registered" }, 201);
    },
  )
  .delete("/:name", async (c) => {
    const name = c.req.param("name");
    const db = c.get("db");
    const deleteCount = await db
      .delete(schema.locations)
      .where(eq(schema.locations.name, name))
      .returning();

    if (deleteCount.length === 0) {
      return c.json({ status: "Location Not Found" }, 404);
    }

    return c.json({ status: "Location Deleted" });
  });

export default locations;
