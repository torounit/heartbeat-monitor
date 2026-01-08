import { getHeartbeatStatus } from "../../services/heartbeats";
import honoFactory from "../../services/honoFactory";
import { getLocationByName, getLocations } from "../../services/locations";

interface StatusInfo {
  location: string;
  status: "ok" | "warn" | "error" | "pending";
  lastLogAt: string;
  timeSinceLastLogSeconds?: number;
}

function enrichStatus(baseStatus: {
  location: string;
  status: "ok" | "warn" | "error" | "pending";
  lastLogAt: string;
}): StatusInfo {
  const { location, status, lastLogAt } = baseStatus;

  if (status === "pending") {
    return {
      location,
      status,
      lastLogAt,
    };
  }

  // timeSinceLastLogSecondsを計算
  const latestTime = new Date(lastLogAt);
  const now = new Date();
  const timeSinceLastLogSeconds = Math.floor(
    (now.getTime() - latestTime.getTime()) / 1000,
  );

  return {
    location,
    status,
    lastLogAt,
    timeSinceLastLogSeconds,
  };
}

const status = honoFactory
  .createApp()
  .get("/", async (c) => {
    const db = c.get("db");

    const locations = await getLocations(db);
    const statuses = (
      await Promise.all(
        locations.map((location) => getHeartbeatStatus(db, location.name)),
      )
    )
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(enrichStatus);

    return c.json(statuses);
  })
  .get("/:location", async (c) => {
    const locationName = c.req.param("location");
    const db = c.get("db");

    const location = await getLocationByName(db, locationName);
    if (!location) {
      return c.json({ error: "Location Not Found" }, 404);
    }

    const baseStatus = await getHeartbeatStatus(db, locationName);
    if (!baseStatus) {
      return c.json({ error: "Status Not Available" }, 500);
    }

    return c.json(enrichStatus(baseStatus));
  });

export default status;
