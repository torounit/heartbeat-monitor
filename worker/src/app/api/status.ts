import type * as schema from "../../db/schema";
import honoFactory, { authMiddleware } from "../../services/honoFactory";
import { getLocationByName, getLocations } from "../../services/locations";
import { getLatestLogByLocationId } from "../../services/logs";

interface StatusInfo {
  location: string;
  status: "ok" | "warn" | "error" | "pending";
  message?: string;
  lastLogAt?: string;
  timeSinceLastLogSeconds?: number;
}

/**
 * ログの時刻差分からステータスを判定
 */
function determineStatus(
  locationName: string,
  latestLog: typeof schema.logs.$inferSelect | undefined | null,
): StatusInfo {
  if (!latestLog) {
    return {
      location: locationName,
      status: "pending",
      message: "No logs recorded yet",
    };
  }

  const latestLogTime = new Date(latestLog.createdAt);
  const currentTime = new Date();
  const timeDiffSeconds = Math.floor(
    (currentTime.getTime() - latestLogTime.getTime()) / 1000,
  );
  const oneMinuteSeconds = 60;
  const fiveMinutesSeconds = 5 * 60;

  // 5分以上ログがない場合はerror
  if (timeDiffSeconds > fiveMinutesSeconds) {
    return {
      location: locationName,
      status: "error",
      message: "No logs in the last 5 minutes",
      lastLogAt: latestLog.createdAt,
      timeSinceLastLogSeconds: timeDiffSeconds,
    };
  }

  // 1分以上ログがない場合はwarn
  if (timeDiffSeconds > oneMinuteSeconds) {
    return {
      location: locationName,
      status: "warn",
      message: "No logs in the last minute",
      lastLogAt: latestLog.createdAt,
      timeSinceLastLogSeconds: timeDiffSeconds,
    };
  }

  // 1分以内にログがある場合はok
  return {
    location: locationName,
    status: "ok",
    lastLogAt: latestLog.createdAt,
    timeSinceLastLogSeconds: timeDiffSeconds,
  };
}

const status = honoFactory.createApp();

status
  .use("*", authMiddleware)
  .get("/", async (c) => {
    const db = c.get("db");

    // 全てのlocationを取得
    const locations = await getLocations(db);

    // 各locationのステータスを取得
    const statuses = await Promise.all(
      locations.map(async (location) => {
        const latestLog = await getLatestLogByLocationId(db, location.id);
        return determineStatus(location.name, latestLog ?? null);
      }),
    );

    return c.json(statuses);
  })
  .get("/:location", async (c) => {
    const locationName = c.req.param("location");
    const db = c.get("db");

    const location = await getLocationByName(db, locationName);

    if (!location) {
      return c.json({ error: "Location Not Found" }, 404);
    }

    const latestLog = await getLatestLogByLocationId(db, location.id);

    return c.json(determineStatus(locationName, latestLog ?? null));
  });

export default status;
