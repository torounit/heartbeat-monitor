import { client } from "../../api";
import ElapsedTime from "../../components/ElapsedTime";
import ReportList from "../../components/ReportList";
import StatusBadge from "../../components/StatusBadge";
import type { DeviceDetailData } from "../../initialData";
import { usePolling } from "../../polling";
import { encodeDeviceName, formatDateTime } from "../../utils";

export async function fetchDeviceDetail(
  deviceName: string,
): Promise<DeviceDetailData> {
  // hono の RPC クライアントはパスパラメータをエンコードしないので自前で行う
  const param = { device: encodeDeviceName(deviceName) };

  const [statusRes, reportsRes] = await Promise.all([
    client.api.status[":device"].$get({ param }),
    client.api.reports[":device"].$get({ param }),
  ]);

  // 存在確認はサーバールートで済んでいるので、ここでの失敗は通信障害か直前の削除
  if (!statusRes.ok || !reportsRes.ok) {
    throw new Error("Failed to fetch device detail");
  }

  const [status, reports] = await Promise.all([
    statusRes.json(),
    reportsRes.json(),
  ]);

  return { status, reports };
}

type DeviceDetailProps = DeviceDetailData & { deviceName: string };

function Detail({ deviceName, status, reports }: DeviceDetailProps) {
  const live = usePolling({ status, reports }, () =>
    fetchDeviceDetail(deviceName),
  );

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-xl font-semibold wrap-break-word sm:text-2xl">
          {live.status.device}
        </h2>
        <StatusBadge status={live.status.status} />
      </div>

      <div class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
        <div class="stat">
          <div class="stat-title">最終ログ</div>
          <div class="stat-value text-lg sm:text-2xl">
            {formatDateTime(live.status.lastLogAt)}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">経過時間</div>
          <div class="stat-value text-lg sm:text-2xl">
            <ElapsedTime seconds={live.status.timeSinceLastLogSeconds} />
          </div>
        </div>
      </div>

      <section class="space-y-3">
        <h3 class="text-lg font-semibold">ステータス履歴</h3>
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <ReportList reports={live.reports} />
          </div>
        </div>
      </section>
    </div>
  );
}

function DeviceDetail({ deviceName, status, reports }: DeviceDetailProps) {
  return (
    <div class="space-y-4">
      <div class="breadcrumbs text-sm">
        <ul>
          <li>
            <a href="/">ダッシュボード</a>
          </li>
          <li>{deviceName}</li>
        </ul>
      </div>

      <Detail deviceName={deviceName} status={status} reports={reports} />
    </div>
  );
}

export default DeviceDetail;
