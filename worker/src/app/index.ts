import honoFactory from "../services/honoFactory";
import api from "./api";

const app = honoFactory.createApp();
app.route("/api", api);

app.get("/", (c) => {
  const location = c.req.header("x-location");
  console.log(location);
  return c.json({ status: "ok" });
});

export default app;
