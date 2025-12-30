import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";

type DB = DrizzleD1Database<typeof schema>;

export type Log = typeof schema.logs.$inferSelect;

// 指定されたlocationの最新ログを返す（存在しない場合はundefined）
export async function getLatestLogByLocationId(
  db: DB,
  locationId: number,
): Promise<Log | undefined> {
  return db.query.logs.findFirst({
    where: eq(schema.logs.locationId, locationId),
    orderBy: [desc(schema.logs.createdAt)],
  });
}
