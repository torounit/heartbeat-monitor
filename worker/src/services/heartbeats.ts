import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { heartbeatConfig } from "../config";
import * as schema from "../db/schema";
import type { status } from "../types";
import { getDeviceByName, getDevices } from "./devices";

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

/**
 * 画面と API が共有するデバイスの状態。
 * サーバーサイドレンダリングとクライアントのポーリングが同じ形を扱うため、
 * ここが唯一の定義になる。
 */
export interface DeviceStatus {
  device: string;
  status: status;
  lastLogAt: string;
  timeSinceLastLogSeconds?: number;
}

/** 最終ログからの経過秒数を足す。pending は基準時刻が無いので省略する。 */
export function enrichStatus(baseStatus: HeartbeatStatus): DeviceStatus {
  const { device, status, lastLogAt } = baseStatus;

  if (status === "pending") {
    return {
      device,
      status,
      lastLogAt,
    };
  }

  const latestTime = new Date(lastLogAt);
  const now = new Date();
  const timeSinceLastLogSeconds = Math.floor(
    (now.getTime() - latestTime.getTime()) / 1000,
  );

  return {
    device,
    status,
    lastLogAt,
    timeSinceLastLogSeconds,
  };
}

/**
 * 全デバイスの状態を返す。
 * ダッシュボードのサーバーサイドレンダリングと GET /api/status の唯一の実装。
 * 実装が分かれると出力がずれ、クライアントへの引き継ぎ時に表示がちらつく。
 */
export async function getDeviceStatuses(db: DB): Promise<DeviceStatus[]> {
  const devices = await getDevices(db);
  return (
    await Promise.all(
      devices.map((device) => getHeartbeatStatus(db, device.name)),
    )
  )
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map(enrichStatus);
}
