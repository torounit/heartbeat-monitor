import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import * as schema from "../../db/schema";

const locations = new Hono<{ Bindings: CloudflareBindings }>();

locations.post(
  "/register",
  zValidator(
    "json",
    z.object({
      name: z.string(),
    }),
  ),
  async (c) => {
    const data = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });
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
);

export default locations;
