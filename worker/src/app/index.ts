import honoFactory from "../services/honoFactory";
import api from "./api";
import dashboard from "./dashboard";

const app = honoFactory
  .createApp()
  .route("/api", api)
  .route("/dashboard", dashboard)
  .get("/", (c) => {
    const location = c.req.header("x-location");
    console.log(location);
    return c.json({ status: "ok" });
  });

export type AppType = typeof app;

export default app;
