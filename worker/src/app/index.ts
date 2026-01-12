import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { sendStatusChangeNotification } from "../services/discord";
import honoFactory from "../services/honoFactory";
import { updateAllDevicesReports } from "../services/reports";
import api from "./api";
import dashboard from "./dashboard";
import { renderer } from "./renderer";

const app = honoFactory
  .createApp()
  .use(renderer)
  .route("/api", api)
  .route("/dashboard", dashboard)
  .get("/", (c) => {
    const location = c.req.header("x-location");
    console.log(location);
    return c.json({ status: "ok" });
  })
  // ローカル開発用：scheduledハンドラーを手動でテストするエンドポイント
  .get("/__debug/trigger-scheduled", async (c) => {
    const db = drizzle(c.env.DB, { schema });

    console.log("Manual scheduled trigger (debug endpoint)");

    await updateAllDevicesReports(db, async ({ device, newStatus }) => {
      const webhookUrl = c.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await sendStatusChangeNotification(webhookUrl, device, newStatus);
      }
    });

    return c.json({
      status: "ok",
      message: "Scheduled task executed manually",
    });
  });

export type AppType = typeof app;

export default app;
