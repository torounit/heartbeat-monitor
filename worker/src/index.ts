import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { logs } from "./db/schema";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
  const location = c.req.header("x-location");
  console.log(location);
  return c.json({ status: "ok" });
});

app.get("/api/heartbeat", async (c) => {
  const location = c.req.header("x-location");
  if (location) {
    const db = drizzle(c.env.DB);
    const result = await db
      .insert(logs)
      .values({
        location,
      })
      .returning();

    return c.json({ status: "OK" });
  }

  return c.json({ status: "Bad Request" }, 500);
});

export default app;
