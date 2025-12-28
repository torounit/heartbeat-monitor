import { Hono } from "hono";

import api from "./api";

const app = new Hono<{ Bindings: CloudflareBindings }>();
app.route("/api", api);

app.get("/", (c) => {
  const location = c.req.header("x-location");
  console.log(location);
  return c.json({ status: "ok" });
});

export default app;
