import { getDeviceStatuses } from "../services/heartbeats";
import honoFactory from "../services/honoFactory";
import { getDevicesWithReports } from "../services/reports";
import { REPORTS_PREVIEW_LIMIT } from "../ui/api";
import { homePage } from "../ui/pages/home";
import { renderPage } from "./renderPage";

const app = honoFactory.createApp().get("/", async (c) => {
  const db = c.get("db");

  const [statuses, deviceReports] = await Promise.all([
    getDeviceStatuses(db),
    getDevicesWithReports(db, REPORTS_PREVIEW_LIMIT),
  ]);

  return renderPage(c, homePage, { statuses, deviceReports });
});

export default app;
