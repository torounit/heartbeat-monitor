import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";

type DB = DrizzleD1Database<typeof schema>;

export type Location = typeof schema.locations.$inferSelect;

// 全てのlocationを取得
export async function getLocations(db: DB): Promise<Location[]> {
  return db.query.locations.findMany();
}

// IDからlocationを取得（見つからない場合はundefined）
export async function getLocationById(
  db: DB,
  id: number,
): Promise<Location | undefined> {
  return db.query.locations.findFirst({
    where: eq(schema.locations.id, id),
  });
}

// 名前からlocationを取得（見つからない場合はundefined）
export async function getLocationByName(
  db: DB,
  name: string,
): Promise<Location | undefined> {
  return db.query.locations.findFirst({
    where: eq(schema.locations.name, name),
  });
}
