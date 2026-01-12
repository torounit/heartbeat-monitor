import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import * as schema from "../../db/schema";
import honoFactory from "../../services/honoFactory";

const devices = honoFactory
  .createApp()
  .get("/", async (c) => {
    const db = c.get("db");
    const allDevices = await db.query.devices.findMany();
    return c.json(allDevices);
  })
  .get("/reports", async (c) => {
    const db = c.get("db");
    const reportsList = await db.query.devices.findMany({
      with: {
        reports: {
          orderBy: [desc(schema.reports.createdAt)],
        },
      },
    });

    return c.json(reportsList);
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        name: z.string(),
      }),
    ),
    async (c) => {
      const data = c.req.valid("json");
      const db = c.get("db");
      const existingDevice = await db.query.devices.findFirst({
        where: eq(schema.devices.name, data.name),
      });

      if (existingDevice) {
        return c.json({ status: "Device Already Exists" }, 409);
      }

      await db.insert(schema.devices).values({
        name: data.name,
      });

      return c.json({ status: "Device Registered" }, 201);
    },
  )
  .delete("/:name", async (c) => {
    const name = c.req.param("name");
    const db = c.get("db");
    const deleteCount = await db
      .delete(schema.devices)
      .where(eq(schema.devices.name, name))
      .returning();

    if (deleteCount.length === 0) {
      return c.json({ status: "Device Not Found" }, 404);
    }

    return c.json({ status: "Device Deleted" });
  });

export default devices;
