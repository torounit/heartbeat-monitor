import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "../db/schema";

type DB = DrizzleD1Database<typeof schema>;

export type Device = typeof schema.devices.$inferSelect;

// 全てのdeviceを取得
export async function getDevices(db: DB): Promise<Device[]> {
  return db.query.devices.findMany();
}

// IDからdeviceを取得（見つからない場合はundefined）
export async function getDeviceById(
  db: DB,
  id: number,
): Promise<Device | undefined> {
  return db.query.devices.findFirst({
    where: eq(schema.devices.id, id),
  });
}

// 名前からdeviceを取得（見つからない場合はundefined）
export async function getDeviceByName(
  db: DB,
  name: string,
): Promise<Device | undefined> {
  return db.query.devices.findFirst({
    where: eq(schema.devices.name, name),
  });
}
