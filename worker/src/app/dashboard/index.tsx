import { getDeviceStatuses } from "../../services/heartbeats";
import honoFactory from "../../services/honoFactory";
import { getDevicesWithReports } from "../../services/reports";
import { REPORTS_PREVIEW_LIMIT } from "../../ui/api";
import Dashboard from "../../ui/Dashboard";
import type { DashboardData } from "../../ui/initialData";

const app = honoFactory.createApp().get("/", async (c) => {
  const db = c.get("db");

  const [statuses, deviceReports] = await Promise.all([
    getDeviceStatuses(db),
    getDevicesWithReports(db, REPORTS_PREVIEW_LIMIT),
  ]);

  const initial: DashboardData = { statuses, deviceReports };

  // 中身をサーバーで描画したうえで、同じデータを data 属性で渡す。
  // クライアントの初回描画がこの HTML と一致するので差し替えが目に見えない。
  return c.render(
    <div id="root" data-initial={JSON.stringify(initial)}>
      <Dashboard {...initial} />
    </div>,
  );
});

export default app;
