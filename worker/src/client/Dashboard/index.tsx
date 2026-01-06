import { hc } from "hono/client";
import type { InferResponseType } from "hono/client";
import { useState, useEffect } from "hono/jsx";
import type { AppType } from "../../app";

function Status() {
  const client = hc<AppType>("/");

  const [status, setStatus] =
    useState<InferResponseType<typeof client.api.status.$get>>();

  const fetchStatus = async () => {
    try {
      const res = await client.api.status.$get();
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  return (
    <>
      <h2>Status</h2>
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
          {status?.map((s) => (
            <tr key={s.location}>
              <td>{s.location}</td>
              <td>{s.status}</td>
              <td>{new Date(s.lastLogAt).toLocaleString()}</td>
              <td>{s.timeSinceLastLogSeconds ?? "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Dashboard() {
  const fetchStatus = async () => {
    const client = hc<AppType>("/");

    try {
      const res = await client.api.status.$get();
      if (res.ok) {
        const data = await res.json();
        console.log(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  return (
    <>
      <h1>Heartbeat Monitor</h1>
      <Status />
    </>
  );
}

export default Dashboard;
