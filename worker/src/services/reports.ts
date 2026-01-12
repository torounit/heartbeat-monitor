import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";
import type { status } from "../types";
import { getHeartbeatStatus } from "./heartbeats";
import type { Device } from "./devices";
import { getDevices } from "./devices";

type DB = DrizzleD1Database<typeof schema>;

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
