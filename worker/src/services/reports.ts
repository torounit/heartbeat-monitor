import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";
import type { status } from "../types";
import { getHeartbeatStatus } from "./heartbeats";
import type { Location } from "./locations";
import { getLocations } from "./locations";

type DB = DrizzleD1Database<typeof schema>;

/**
 * 最新のレポートを取得
 */
export async function getLatestReport(
  db: DB,
  locationId: number,
): Promise<{ status: status } | undefined> {
  return db.query.reports.findFirst({
    where: eq(schema.reports.locationId, locationId),
    orderBy: [desc(schema.reports.createdAt)],
    columns: {
      status: true,
    },
  });
}

export type StatusChangeCallback = (params: {
  location: Location;
  newStatus: status;
}) => Promise<void> | void;

/**
 * ステータス変更があった場合のみレポートを保存
 */
export async function saveReportIfStatusChanged(
  db: DB,
  location: Location,
  currentStatus: status,
  callback?: StatusChangeCallback,
): Promise<boolean> {
  const latestReport = await getLatestReport(db, location.id);
  // ステータスが変更された場合のみ保存
  if (latestReport?.status !== currentStatus) {
    const now = new Date().toISOString();
    await db.insert(schema.reports).values({
      locationId: location.id,
      status: currentStatus,
      createdAt: now,
    });

    if (callback) {
      await callback({ location, newStatus: currentStatus });
    }

    return true;
  }

  return false;
}

export async function updateAllLocationsReports(
  db: DB,
  callback?: StatusChangeCallback,
) {
  const locations = await getLocations(db);
  // 各locationのステータスをチェックし、変更があればreportsに保存
  await Promise.all(
    locations.map(async (location) => {
      const status = await getHeartbeatStatus(db, location.name);
      if (status) {
        const saved = await saveReportIfStatusChanged(
          db,
          location,
          status.status,
          callback,
        );
        if (saved) {
          console.log(`Status changed for ${location.name}: ${status.status}`);
        }
      }
    }),
  );
}
