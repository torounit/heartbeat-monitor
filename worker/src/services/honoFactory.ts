import { drizzle } from "drizzle-orm/d1";
import { createFactory } from "hono/factory";
import * as schema from "../db/schema";
import type { Env } from "../types";

const factory = createFactory<Env>({
  initApp: (app) => {
    app.use(async (c, next) => {
      const db = drizzle(c.env.DB, { schema });
      c.set("db", db);
      await next();
    });
  },
});

export default factory;
