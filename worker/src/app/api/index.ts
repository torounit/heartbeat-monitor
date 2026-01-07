import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import * as schema from "../../db/schema";
import honoFactory from "../../services/honoFactory";
import locations from "./locations";
import reports from "./reports";
import status from "./status";

const api = honoFactory
  .createApp()
  .route("/locations", locations)
  .route("/reports", reports)
  .route("/status", status)
  .post(
    "/heartbeat",
    zValidator(
      "json",
      z.object({
        location: z.string(),
      }),
    ),
    async (c) => {
      const data = c.req.valid("json");
      const db = drizzle(c.env.DB, { schema });
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

export default api;
