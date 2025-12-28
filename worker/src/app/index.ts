import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import * as schema from "../db/schema";

import api from "./api";

const app = new Hono<{ Bindings: CloudflareBindings }>();
app.route("/api", api);

app.get("/", (c) => {
  const location = c.req.header("x-location");
  console.log(location);
  return c.json({ status: "ok" });
});

export default app;
