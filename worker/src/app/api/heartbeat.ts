import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db/schema";
import honoFactory from "../../services/honoFactory";

const heartbeat = honoFactory
  .createApp()
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        location: z.string(),
      }),
    ),
    async (c) => {
      const data = c.req.valid("json");
      const db = c.get("db");
      const location = await db.query.locations.findFirst({
        where: eq(schema.locations.name, data.location),
      });

      if (!location) {
        return c.json({ status: "Location Not Found" }, 404);
      }
      await db.insert(schema.heartbeats).values({
        locationId: location.id,
      });

      return c.json({ status: "Heartbeat Logged" }, 201);
    },
  );

export default heartbeat;
