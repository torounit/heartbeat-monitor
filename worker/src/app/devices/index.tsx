import { getDeviceByName } from "../../services/devices";
import { enrichStatus, getHeartbeatStatus } from "../../services/heartbeats";
import honoFactory from "../../services/honoFactory";
import { getDeviceReportRows, toReportItems } from "../../services/reports";
import DeviceDetail from "../../ui/DeviceDetail";
import type { DeviceDetailData } from "../../ui/initialData";

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

  const initial: DeviceDetailData = {
    status: enrichStatus(baseStatus),
    reports: toReportItems(reportRows),
  };

  // 中身をサーバーで描画したうえで、同じデータを data 属性で渡す。
  // クライアントの初回描画がこの HTML と一致するので差し替えが目に見えない。
  return c.render(
    <div
      id="root"
      data-device={device.name}
      data-initial={JSON.stringify(initial)}
    >
      <DeviceDetail deviceName={device.name} {...initial} />
    </div>,
    { title: device.name },
  );
});

export default app;
