import { getDeviceByName } from "../../services/devices";
import { enrichStatus, getHeartbeatStatus } from "../../services/heartbeats";
import honoFactory from "../../services/honoFactory";
import { getDeviceReportRows, toReportItems } from "../../services/reports";
import { deviceDetailsPage } from "../../ui/pages/devices/details";
import { renderPage } from "../renderPage";

function NotFound({ name }: { name: string }) {
  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold sm:text-2xl">
        デバイスが見つかりません
      </h2>
      <p class="text-base-content/70 wrap-break-word">
        「{name}」は登録されていません。
      </p>
      <a href="/" class="btn btn-primary btn-sm">
        ダッシュボードへ戻る
      </a>
    </div>
  );
}

const app = honoFactory.createApp().get("/:device", async (c) => {
  // hono がパスパラメータをデコード済みで返す
  const deviceName = c.req.param("device");
  const db = c.get("db");

  const device = await getDeviceByName(db, deviceName);
  if (!device) {
    c.status(404);
    return c.render(<NotFound name={deviceName} />, {
      title: "デバイスが見つかりません",
    });
  }

  const [baseStatus, reportRows] = await Promise.all([
    getHeartbeatStatus(db, device.name),
    getDeviceReportRows(db, device.id),
  ]);
  if (!baseStatus) {
    return c.render(<NotFound name={deviceName} />, {
      title: "デバイスが見つかりません",
    });
  }

  return renderPage(
    c,
    deviceDetailsPage,
    {
      status: enrichStatus(baseStatus),
      reports: toReportItems(reportRows),
    },
    { title: device.name },
  );
});

export default app;
