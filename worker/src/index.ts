import { drizzle } from "drizzle-orm/d1";

import honoApp from "./app";
import * as schema from "./db/schema";
import { sendStatusChangeNotification } from "./services/discord";
import { updateAllDevicesReports } from "./services/reports";

const scheduled: ExportedHandlerScheduledHandler<CloudflareBindings> = (
  controller,
  env,
  ctx,
) => {
  const db = drizzle(env.DB, { schema });
  switch (controller.cron) {
    case "*/1 * * * *":
      ctx.waitUntil(
        updateAllDevicesReports(db, async ({ device, newStatus }) => {
          const webhookUrl = env.DISCORD_WEBHOOK_URL;
          if (webhookUrl) {
            await sendStatusChangeNotification(webhookUrl, device, newStatus);
          }
        }),
      );
      break;
  }
};

export default {
  fetch: honoApp.fetch,
  scheduled,
} satisfies ExportedHandler<CloudflareBindings>;
