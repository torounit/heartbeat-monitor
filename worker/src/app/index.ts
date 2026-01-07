import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { sendStatusChangeNotification } from "../services/discord";
import honoFactory from "../services/honoFactory";
import { updateAllLocationsReports } from "../services/reports";
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

const scheduled: ExportedHandlerScheduledHandler<CloudflareBindings> = (
  event,
  env,
  ctx,
) => {
  ctx.waitUntil(
    (async () => {
      const db = drizzle(env.DB, { schema });
      await updateAllLocationsReports(db, async ({ location, newStatus }) => {
        const webhookUrl = env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
          await sendStatusChangeNotification(webhookUrl, location, newStatus);
        }
      });
    })(),
  );
};

export type AppType = typeof app;

export default {
  fetch: app.fetch,
  request: app.request,
  scheduled,
};
