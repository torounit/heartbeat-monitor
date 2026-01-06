import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { heartbeatConfig } from "../config";
import * as schema from "../db/schema";
import type { status } from "../types";
import { getLocationByName } from "./locations";

type DB = DrizzleD1Database<typeof schema>;

export type Heartbeat = typeof schema.heartbeats.$inferSelect;

// 指定されたlocationの最新ハートビートを返す（存在しない場合はundefined）
export async function getLatestHeartbeatByLocationId(
  db: DB,
  locationId: number,
): Promise<Heartbeat | undefined> {
  return db.query.heartbeats.findFirst({
    where: eq(schema.heartbeats.locationId, locationId),
    orderBy: [desc(schema.heartbeats.createdAt)],
  });
}

export interface HeartbeatStatus {
  location: string;
  status: status;
  lastLogAt: string;
}

export async function getHeartbeatStatus(
  db: DB,
  locationName: string,
): Promise<HeartbeatStatus | undefined> {
  const location = await getLocationByName(db, locationName);
  if (!location) return undefined;

  const latest = await getLatestHeartbeatByLocationId(db, location.id);

  if (!latest) {
    return {
      location: locationName,
      status: "pending",
      lastLogAt: "",
    };
  }

  const latestTime = new Date(latest.createdAt);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - latestTime.getTime()) / 1000);

  if (diffSeconds > heartbeatConfig.errorThresholdMinutes * 60) {
    return {
      location: locationName,
      status: "error",
      lastLogAt: latest.createdAt,
    };
  }

  if (diffSeconds > heartbeatConfig.warnThresholdMinutes * 60) {
    return {
      location: locationName,
      status: "warn",
      lastLogAt: latest.createdAt,
    };
  }

  return {
    location: locationName,
    status: "ok",
    lastLogAt: latest.createdAt,
  };
}
