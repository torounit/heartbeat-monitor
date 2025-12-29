import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import { basicAuth } from "hono/basic-auth";
import { createFactory, createMiddleware } from "hono/factory";
import * as schema from "../db/schema";

interface Env {
  Bindings: CloudflareBindings;
  Variables: { db: DrizzleD1Database<typeof schema> };
}

const factory = createFactory<Env>({
  initApp: (app) => {
    app.use(async (c, next) => {
      const db = drizzle(c.env.DB, { schema });
      c.set("db", db);
      await next();
    });
  },
});

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const auth = basicAuth({
    username: c.env.BASIC_AUTH_USERNAME,
    password: c.env.BASIC_AUTH_PASSWORD,
  });
  return auth(c, next);
});

export default factory;
