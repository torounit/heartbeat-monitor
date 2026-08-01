import { ErrorBoundary, Suspense, use } from "hono/jsx/dom";

import { client } from "../api";
import ErrorState from "../components/ErrorState";
import ReportList from "../components/ReportList";
import StatusBadge from "../components/StatusBadge";
import { encodeDeviceName, formatDateTime, formatElapsed } from "../utils";

async function fetchDeviceDetail(deviceName: string) {
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

function Detail({
  detailPromise,
}: {
  detailPromise: ReturnType<typeof fetchDeviceDetail>;
}) {
  const { status, reports } = use(detailPromise);

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-xl font-semibold wrap-break-word sm:text-2xl">
          {status.device}
        </h2>
        <StatusBadge status={status.status} />
      </div>

      <div class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
        <div class="stat">
          <div class="stat-title">最終ログ</div>
          <div class="stat-value text-lg sm:text-2xl">
            {formatDateTime(status.lastLogAt)}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">経過時間</div>
          <div class="stat-value text-lg sm:text-2xl">
            {formatElapsed(status.timeSinceLastLogSeconds)}
          </div>
        </div>
      </div>

      <section class="space-y-3">
        <h3 class="text-lg font-semibold">ステータス履歴</h3>
        <div class="card border border-base-300 bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <ReportList reports={reports} />
          </div>
        </div>
      </section>
    </div>
  );
}

function DeviceDetail({ deviceName }: { deviceName: string }) {
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

      <ErrorBoundary fallback={<ErrorState />}>
        <Suspense fallback={<p class="text-base-content/60">Loading...</p>}>
          <Detail detailPromise={fetchDeviceDetail(deviceName)} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default DeviceDetail;
