import { eq } from "drizzle-orm";
import * as schema from "../../db/schema";
import honoFactory, { authMiddleware } from "../../services/honoFactory";

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
  latestLog: (typeof schema.logs.$inferSelect) | undefined | null,
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
    const locations = await db.query.locations.findMany();

    // 各locationのステータスを取得
    const statuses = await Promise.all(
      locations.map(async (location) => {
        // 最新のログを取得
        const latestLog = await db.query.logs.findFirst({
          where: eq(schema.logs.locationId, location.id),
          orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        });

        return determineStatus(location.name, latestLog);
      }),
    );

    return c.json(statuses);
  })
  .get("/:location", async (c) => {
    const locationName = c.req.param("location");
    const db = c.get("db");

    // locationを取得
    const location = await db.query.locations.findFirst({
      where: eq(schema.locations.name, locationName),
    });

    if (!location) {
      return c.json({ error: "Location Not Found" }, 404);
    }

    // 最新のログを取得
    const latestLog = await db.query.logs.findFirst({
      where: eq(schema.logs.locationId, location.id),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });

    return c.json(determineStatus(locationName, latestLog));
  });

export default status;



