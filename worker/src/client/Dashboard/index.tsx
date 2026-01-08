import type { InferResponseType } from "hono/client";
import { hc } from "hono/client";
import { Suspense, use } from "hono/jsx/dom";
import type { AppType } from "../../app";

const client = hc<AppType>("/");

async function fetchStatus() {
  const res = await client.api.status.$get();
  return res.json();
}

function getStatusClass(status: string): string {
  switch (status) {
    case "ok":
      return "bg-green-100 hover:bg-green-200";
    case "error":
      return "bg-red-100 hover:bg-red-200";
    case "warn":
      return "bg-yellow-100 hover:bg-yellow-200";
    default:
      return "bg-gray-50 hover:bg-gray-100";
  }
}

function Status({
  statusPromise,
}: {
  statusPromise: Promise<InferResponseType<typeof client.api.status.$get>>;
}) {
  const status = use(statusPromise);
  return (
    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
              名称
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
              ステータス
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
              最終ログ日時
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
              最終ログからの経過時間（秒）
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {status.map((s) => (
            <tr key={s.location} class={getStatusClass(s.status)}>
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {s.location}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {s.status}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {new Date(s.lastLogAt).toLocaleString()}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {s.timeSinceLastLogSeconds ?? "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function fetchReports() {
  const res = await client.api.locations.reports.$get();
  return res.json();
}

function Reports({
  locationReportsPromise,
}: {
  locationReportsPromise: Promise<
    InferResponseType<typeof client.api.locations.reports.$get>
  >;
}) {
  const locations = use(locationReportsPromise);
  return (
    <div class="space-y-6">
      {locations.map(({ name, reports }) => (
        <div key={name}>
          <h3 class="mb-3 text-xl font-semibold text-gray-800">{name}</h3>
          <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                    日時
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                {reports.map((report) => (
                  <tr key={report.id} class={getStatusClass(report.status)}>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {report.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="mb-8 text-4xl font-bold text-gray-900">Heartbeat Monitor</h1>

      <section class="mb-12">
        <h2 class="mb-4 text-2xl font-semibold text-gray-800">Status</h2>
        <Suspense fallback={<p class="text-gray-500">Loading...</p>}>
          <Status statusPromise={fetchStatus()} />
        </Suspense>
      </section>

      <section>
        <h2 class="mb-4 text-2xl font-semibold text-gray-800">Reports</h2>
        <Suspense fallback={<p class="text-gray-500">Loading...</p>}>
          <Reports locationReportsPromise={fetchReports()} />
        </Suspense>
      </section>
    </div>
  );
}

export default Dashboard;
