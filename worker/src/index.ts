import { drizzle } from "drizzle-orm/d1";

import app from "./app";
import * as schema from "./db/schema";
import { sendStatusChangeNotification } from "./services/discord";
import { updateAllLocationsReports } from "./services/reports";

const scheduled: ExportedHandlerScheduledHandler<CloudflareBindings> = (
  event,
  env,
  ctx
) => {
  const db = drizzle(env.DB, { schema });

  switch (event.cron) {
    case "*/1 * * * *":
      ctx.waitUntil(
        updateAllLocationsReports(db, async ({ location, newStatus }) => {
          const webhookUrl = env.DISCORD_WEBHOOK_URL;
          if (webhookUrl) {
            await sendStatusChangeNotification(webhookUrl, location, newStatus);
          }
        }),
      );
      break;
  }
};

export default {
  fetch: app.fetch,
  scheduled,
} satisfies ExportedHandler<CloudflareBindings>;
