import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { z } from "zod";

import * as schema from "../../db/schema";

const locations = new Hono<{ Bindings: CloudflareBindings }>();
locations.use(
  "*",
  basicAuth({
    verifyUser: (
      username,
      password,
      c: Context<{ Bindings: CloudflareBindings }>,
    ) => {
      return (
        username === c.env.BASIC_AUTH_USERNAME &&
        password === c.env.BASIC_AUTH_PASSWORD
      );
    },
  }),
);

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

locations.get("/", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const allLocations = await db.query.locations.findMany();
  return c.json(allLocations);
});

locations.delete("/:name", async (c) => {
  const name = c.req.param("name");
  const db = drizzle(c.env.DB, { schema });
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
