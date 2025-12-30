import type { Env } from "../services/honoFactory";
import honoFactory from "../services/honoFactory";
import api from "./api";

const app = honoFactory.createApp();
app.route("/api", api);

app.get("/", (c) => {
  const location = c.req.header("x-location");
  console.log(location);
  return c.json({ status: "ok" });
});

const scheduled: ExportedHandlerScheduledHandler<Env> = async () => {};

export default {
  fetch: app.fetch,
  request: app.request,
  scheduled,
};
