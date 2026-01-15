import honoFactory from "../services/honoFactory";
import api from "./api";
import dashboard from "./dashboard";
import { renderer } from "./renderer";

const app = honoFactory
  .createApp()
  .use(renderer)
  .route("/api", api)
  .route("/", dashboard);

export type AppType = typeof app;

export default app;
