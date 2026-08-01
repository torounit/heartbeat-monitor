import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";
import type { status } from "../types";
import type { Device } from "./devices";
import { getDevices } from "./devices";
import { getHeartbeatStatus } from "./heartbeats";

type DB = DrizzleD1Database<typeof schema>;

/**
 * 画面が表示に使うレポートの列だけを持つ形。
 * ReportList はトップと詳細の両方でこれを受け取る。
 */
export interface ReportItem {
  id: number;
  status: status;
  createdAt: string;
}

/**
 * 全デバイスとそのレポートを取得する。
 * limit はデバイスごとに適用される（drizzle が相関サブクエリで包むため）。
 * ダッシュボードのサーバーサイドレンダリングと GET /api/devices/reports の唯一の実装。
 */
export async function getDevicesWithReports(db: DB, limit?: number) {
  return db.query.devices.findMany({
    with: {
      reports: {
        orderBy: [desc(schema.reports.createdAt)],
        limit,
      },
    },
  });
}

export type DeviceWithReports = Awaited<
  ReturnType<typeof getDevicesWithReports>
>[number];

/**
 * 指定デバイスのレポートを新しい順に返す。
 * 詳細ページのサーバーサイドレンダリングと GET /api/reports/:device の唯一のクエリ。
 * with: { device: true } は API のレスポンス形状を保つために維持する。
 */
export async function getDeviceReportRows(db: DB, deviceId: number) {
  return db.query.reports.findMany({
    where: eq(schema.reports.deviceId, deviceId),
    orderBy: [desc(schema.reports.createdAt)],
    with: {
      device: true,
    },
  });
}

/**
 * 表示に使う列だけに落とす。
 * HTML に埋め込む初期データを膨らませないためのサーバーサイドレンダリング専用。
 */
export function toReportItems(rows: readonly ReportItem[]): ReportItem[] {
  return rows.map(({ id, status, createdAt }) => ({ id, status, createdAt }));
}

/**
 * 最新のレポートを取得
 */
export async function getLatestReport(
  db: DB,
  deviceId: number,
): Promise<{ status: status } | undefined> {
  return db.query.reports.findFirst({
    where: eq(schema.reports.deviceId, deviceId),
    orderBy: [desc(schema.reports.createdAt)],
    columns: {
      status: true,
    },
  });
}

export type StatusChangeCallback = (params: {
  device: Device;
  newStatus: status;
}) => Promise<void> | void;

/**
 * ステータス変更があった場合のみレポートを保存
 */
export async function saveReportIfStatusChanged(
  db: DB,
  device: Device,
  currentStatus: status,
  callback?: StatusChangeCallback,
): Promise<boolean> {
  const latestReport = await getLatestReport(db, device.id);
  // ステータスが変更された場合のみ保存
  if (latestReport?.status !== currentStatus) {
    const now = new Date().toISOString();
    await db.insert(schema.reports).values({
      deviceId: device.id,
      status: currentStatus,
      createdAt: now,
    });

    if (callback) {
      await callback({ device, newStatus: currentStatus });
    }

    return true;
  }

  return false;
}

export async function updateAllDevicesReports(
  db: DB,
  callback?: StatusChangeCallback,
) {
  const devices = await getDevices(db);
  // 各deviceのステータスをチェックし、変更があればreportsに保存
  await Promise.all(
    devices.map(async (device) => {
      const status = await getHeartbeatStatus(db, device.name);
      if (status) {
        const saved = await saveReportIfStatusChanged(
          db,
          device,
          status.status,
          callback,
        );
        if (saved) {
          console.log(`Status changed for ${device.name}: ${status.status}`);
        }
      }
    }),
  );
}
