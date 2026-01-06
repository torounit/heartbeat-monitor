import { hc } from "hono/client";
import { useEffect } from "hono/jsx";
import type { AppType } from "../../app";

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

  return <h1>Heartbeat Monitor Dashboard</h1>;
}

export default Dashboard;
