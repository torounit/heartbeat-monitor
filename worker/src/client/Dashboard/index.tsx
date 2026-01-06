import type { InferResponseType } from "hono/client";
import { hc } from "hono/client";
import { Suspense, use } from "hono/jsx/dom";
import type { AppType } from "../../app";

const client = hc<AppType>("/");

async function fetchStatus() {
  const res = await client.api.status.$get();
  return res.json();
}

function Status({
  statusPromise,
}: {
  statusPromise: Promise<InferResponseType<typeof client.api.status.$get>>;
}) {
  const status = use(statusPromise);
  return (
    <table>
      <thead>
        <tr>
          <th>Location</th>
          <th>Status</th>
          <th>Last Log At</th>
          <th>Time Since Last Log (seconds)</th>
        </tr>
      </thead>
      <tbody>
        {status.map((s) => (
          <tr key={s.location}>
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

function Dashboard() {
  return (
    <>
      <h1>Heartbeat Monitor</h1>
      <h2>Status</h2>
      <Suspense fallback={<p>Loading...</p>}>
        <Status statusPromise={fetchStatus()} />
      </Suspense>
    </>
  );
}

export default Dashboard;
