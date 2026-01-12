import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { heartbeatConfig } from "../config";
import * as schema from "../db/schema";
import type { status } from "../types";
import { getDeviceByName } from "./devices";

type DB = DrizzleD1Database<typeof schema>;

export type Heartbeat = typeof schema.heartbeats.$inferSelect;

// 指定されたdeviceの最新ハートビートを返す（存在しない場合はundefined）
export async function getLatestHeartbeatByDeviceId(
  db: DB,
  deviceId: number,
): Promise<Heartbeat | undefined> {
  return db.query.heartbeats.findFirst({
    where: eq(schema.heartbeats.deviceId, deviceId),
    orderBy: [desc(schema.heartbeats.createdAt)],
  });
}

export interface HeartbeatStatus {
  device: string;
  status: status;
  lastLogAt: string;
}

export async function getHeartbeatStatus(
  db: DB,
  deviceName: string,
): Promise<HeartbeatStatus | undefined> {
  const device = await getDeviceByName(db, deviceName);
  if (!device) return undefined;

  const latest = await getLatestHeartbeatByDeviceId(db, device.id);

  if (!latest) {
    return {
      device: deviceName,
      status: "pending",
      lastLogAt: "",
    };
  }

  const latestTime = new Date(latest.createdAt);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - latestTime.getTime()) / 1000);

  if (diffSeconds > heartbeatConfig.errorThresholdMinutes * 60) {
    return {
      device: deviceName,
      status: "error",
      lastLogAt: latest.createdAt,
    };
  }

  if (diffSeconds > heartbeatConfig.warnThresholdMinutes * 60) {
    return {
      device: deviceName,
      status: "warn",
      lastLogAt: latest.createdAt,
    };
  }

  return {
    device: deviceName,
    status: "ok",
    lastLogAt: latest.createdAt,
  };
}
