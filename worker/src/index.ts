import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  const location = c.req.header("x-location");
  console.log(location);
  return c.json({ status: "ok" });
});

export default app;
