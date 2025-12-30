import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";
import type { status } from "../types";
import { getHeartbeatStatus } from "./heartbeats";
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

/**
 * ステータス変更があった場合のみレポートを保存
 */
export async function saveReportIfStatusChanged(
  db: DB,
  locationId: number,
  currentStatus: status,
): Promise<boolean> {
  const latestReport = await getLatestReport(db, locationId);

  // ステータスが変更された場合のみ保存
  if (latestReport?.status !== currentStatus) {
    const now = new Date().toISOString();
    await db.insert(schema.reports).values({
      locationId,
      status: currentStatus,
      createdAt: now,
    });
    return true;
  }

  return false;
}

export async function updateAllLocationsReports(db: DB) {
  const locations = await getLocations(db);
  // 各locationのステータスをチェックし、変更があればreportsに保存
  await Promise.all(
    locations.map(async (location) => {
      const status = await getHeartbeatStatus(db, location.name);
      if (status) {
        const saved = await saveReportIfStatusChanged(
          db,
          location.id,
          status.status,
        );
        if (saved) {
          console.log(`Status changed for ${location.name}: ${status.status}`);
        }
      }
    }),
  );
}
