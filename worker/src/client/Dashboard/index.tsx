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
      return "table-success";
    case "error":
      return "table-danger";
    case "warn":
      return "table-warning";
    default:
      return "table-light";
  }
}

function Status({
  statusPromise,
}: {
  statusPromise: Promise<InferResponseType<typeof client.api.status.$get>>;
}) {
  const status = use(statusPromise);
  return (
    <table class="table">
      <thead>
        <tr>
          <th>名称</th>
          <th>ステータス</th>
          <th>最終ログ日時</th>
          <th>最終ログからの経過時間（秒）</th>
        </tr>
      </thead>
      <tbody>
        {status.map((s) => (
          <tr key={s.location} class={getStatusClass(s.status)}>
            <td>{s.location}</td>
            <td>{s.status}</td>
            <td>{new Date(s.lastLogAt).toLocaleString()}</td>
            <td>{s.timeSinceLastLogSeconds ?? "N/A"}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
    <div>
      {locations.map(({ name, reports }) => (
        <div key={name} class="mb-4">
          <h3>{name}</h3>
          <table class="table">
            <thead>
              <tr>
                <th>日時</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} class={getStatusClass(report.status)}>
                  <td>{new Date(report.createdAt).toLocaleString()}</td>
                  <td>{report.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  return (
    <div class="container mt-4 mb-4">
      <h1 class="mb-4">Heartbeat Monitor</h1>
      <h2>Status</h2>
      <Suspense fallback={<p>Loading...</p>}>
        <Status statusPromise={fetchStatus()} />
      </Suspense>

      <h2 class="mt-5">Reports</h2>
      <Suspense fallback={<p>Loading...</p>}>
        <Reports locationReportsPromise={fetchReports()} />
      </Suspense>
    </div>
  );
}

export default Dashboard;
