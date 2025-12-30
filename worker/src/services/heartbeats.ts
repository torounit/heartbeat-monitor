import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";

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
