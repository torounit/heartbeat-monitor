import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
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
        const colors = {
          ok: 0x00ff00,
          warn: 0xffff00,
          error: 0xff0000,
          pending: 0x808080,
        } as const;

        const webhookUrl = env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embeds: [
                {
                  title: "Heartbeat Monitor - Status Update",
                  description: "S",
                  color: colors[newStatus],
                  fields: [
                    {
                      name: "Location",
                      value: location.name,
                      inline: true,
                    },
                    {
                      name: "Status",
                      value: newStatus,
                      inline: true,
                    },
                  ],
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          });
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
