import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import { basicAuth } from "hono/basic-auth";

import * as schema from "../../db/schema";
import honoFactory, { authMiddleware } from "../../services/honoFactory";

const status = honoFactory.createApp();

status.use("*", authMiddleware).get("/:location", async (c) => {
  const locationName = c.req.param("location");
  const db = drizzle(c.env.DB, { schema });

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

  // ログが存在しない場合
  if (!latestLog) {
    return c.json({
      location: locationName,
      status: "error",
      message: "No logs found",
    });
  }

  // 最新ログの時刻を取得し、現在時刻と比較
  const latestLogTime = new Date(latestLog.createdAt);
  const currentTime = new Date();
  const timeDiffSeconds = Math.floor(
    (currentTime.getTime() - latestLogTime.getTime()) / 1000,
  );
  const oneMinuteSeconds = 60;
  const fiveMinutesSeconds = 5 * 60;

  // 5分以上ログがない場合はerror
  if (timeDiffSeconds > fiveMinutesSeconds) {
    return c.json({
      location: locationName,
      status: "error",
      message: "No logs in the last 5 minutes",
      lastLogAt: latestLog.createdAt,
      timeSinceLastLogSeconds: timeDiffSeconds,
    });
  }

  // 1分以上ログがない場合はwarn
  if (timeDiffSeconds > oneMinuteSeconds) {
    return c.json({
      location: locationName,
      status: "warn",
      message: "No logs in the last minute",
      lastLogAt: latestLog.createdAt,
      timeSinceLastLogSeconds: timeDiffSeconds,
    });
  }

  // 1分以内にログがある場合はok
  return c.json({
    location: locationName,
    status: "ok",
    lastLogAt: latestLog.createdAt,
    timeSinceLastLogSeconds: timeDiffSeconds,
  });
});

export default status;
