import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { heartbeatConfig } from "../config";
import * as schema from "../db/schema";
import type { status } from "../types";
import type { Device } from "./devices";

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

/**
 * 画面と API が共有するデバイスの状態。
 * サーバーサイドレンダリングとクライアントのポーリングが同じ形を扱うため、
 * ここが唯一の定義になる。
 */
export interface DeviceStatus {
  device: string;
  status: status;
  lastLogAt: string;
  /** pending は基準時刻が無いので省略される */
  timeSinceLastLogSeconds?: number;
}

/** デバイスと、その最新ハートビート1件 */
type DeviceWithLatestHeartbeat = Device & { heartbeats: Heartbeat[] };

/**
 * 最新ハートビートからステータスを判定する。
 * 閾値判定の唯一の実装。クエリを持たない純粋関数なので、
 * 一括取得と単体取得のどちらからも同じ結果になる。
 */
export function resolveDeviceStatus(
  device: Device,
  latest: Heartbeat | undefined,
): DeviceStatus {
  const { name } = device;

  if (!latest) {
    return { device: name, status: "pending", lastLogAt: "" };
  }

  const timeSinceLastLogSeconds = Math.floor(
    (Date.now() - new Date(latest.createdAt).getTime()) / 1000,
  );

  const value: status =
    timeSinceLastLogSeconds > heartbeatConfig.errorThresholdMinutes * 60
      ? "error"
      : timeSinceLastLogSeconds > heartbeatConfig.warnThresholdMinutes * 60
        ? "warn"
        : "ok";

  return {
    device: name,
    status: value,
    lastLogAt: latest.createdAt,
    timeSinceLastLogSeconds,
  };
}

/**
 * 全デバイスと最新ハートビート1件を1クエリで取得する。
 * drizzle が相関サブクエリで包むため limit はデバイスごとに適用される。
 */
export async function getDevicesWithLatestHeartbeat(
  db: DB,
): Promise<DeviceWithLatestHeartbeat[]> {
  return db.query.devices.findMany({
    with: {
      heartbeats: {
        orderBy: [desc(schema.heartbeats.createdAt)],
        limit: 1,
      },
    },
  });
}

/**
 * 全デバイスの状態を返す。
 * ダッシュボードのサーバーサイドレンダリングと GET /api/status の唯一の実装。
 * 実装が分かれると出力がずれ、クライアントへの引き継ぎ時に表示がちらつく。
 */
export async function getDeviceStatuses(db: DB): Promise<DeviceStatus[]> {
  const devices = await getDevicesWithLatestHeartbeat(db);
  return devices.map(({ heartbeats, ...device }) =>
    resolveDeviceStatus(device, heartbeats.at(0)),
  );
}

/** 単体版。デバイスが存在しない場合は undefined */
export async function getDeviceStatus(
  db: DB,
  deviceName: string,
): Promise<DeviceStatus | undefined> {
  const found = await db.query.devices.findFirst({
    where: eq(schema.devices.name, deviceName),
    with: {
      heartbeats: {
        orderBy: [desc(schema.heartbeats.createdAt)],
        limit: 1,
      },
    },
  });
  if (!found) {
    return undefined;
  }

  const { heartbeats, ...device } = found;
  return resolveDeviceStatus(device, heartbeats.at(0));
}
