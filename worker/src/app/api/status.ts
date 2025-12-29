import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Context } from "hono";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";

import * as schema from "../../db/schema";

const status = new Hono<{ Bindings: CloudflareBindings }>();

status
  .use(
    "*",
    basicAuth({
      verifyUser: (
        username,
        password,
        c: Context<{ Bindings: CloudflareBindings }>,
      ) => {
        return (
          username === c.env.BASIC_AUTH_USERNAME &&
          password === c.env.BASIC_AUTH_PASSWORD
        );
      },
    }),
  )
  .get("/:location", async (c) => {
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
    const timeDiffMs = currentTime.getTime() - latestLogTime.getTime();
    const oneMinuteMs = 60 * 1000;
    const fiveMinutesMs = 5 * 60 * 1000;

    // 5分以上ログがない場合はerror
    if (timeDiffMs > fiveMinutesMs) {
      return c.json({
        location: locationName,
        status: "error",
        message: "No logs in the last 5 minutes",
        lastLogAt: latestLog.createdAt,
        timeSinceLastLogMs: timeDiffMs,
      });
    }

    // 1分以上ログがない場合はwarn
    if (timeDiffMs > oneMinuteMs) {
      return c.json({
        location: locationName,
        status: "warn",
        message: "No logs in the last minute",
        lastLogAt: latestLog.createdAt,
        timeSinceLastLogMs: timeDiffMs,
      });
    }

    // 1分以内にログがある場合はok
    return c.json({
      location: locationName,
      status: "ok",
      lastLogAt: latestLog.createdAt,
      timeSinceLastLogMs: timeDiffMs,
    });
  });

export default status;
