import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import * as schema from "./db/schema";
import { eq } from "drizzle-orm";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
  const location = c.req.header("x-location");
  console.log(location);
  return c.json({ status: "ok" });
});

app.post('/api/location/register',
  zValidator(
    'json',
    z.object({
      name: z.string(),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json');
    const db = drizzle(c.env.DB, { schema });
    const existingLocation = await db.query.locations.findFirst({
      where: eq(schema.locations.name, data.name),
    });

    if (existingLocation) {
      return c.json({ status: 'Location Already Exists' }, 409);
    }

    await db.insert(schema.locations).values({
      name: data.name,
    });

    return c.json({ status: 'Location Registered' }, 201);
  },
);

app.post(
  "/api/heartbeat",
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
    await db.insert(schema.logs).values({
      locationId: location.id,
    });

    return c.json({ status: "Created" }, 201);
  },
);

export default app;
