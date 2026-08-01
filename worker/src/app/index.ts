import honoFactory from "../services/honoFactory";
import api from "./api";
import deviceDetails from "./devices/details";
import { errorHandler } from "./errors";
import home from "./home";
import { renderer } from "./renderer";

const app = honoFactory
  .createApp()
  .use(renderer)
  .onError(errorHandler)
  .route("/api", api)
  .route("/devices", deviceDetails)
  .route("/", home)
  .get("/dashboard", (c) => {
    return c.redirect("/");
  });

export type AppType = typeof app;

export default app;
