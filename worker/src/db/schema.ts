import { sql, relations } from "drizzle-orm";
import { int, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import type { status } from "../types";

export const devices = sqliteTable("devices", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
});

export const heartbeats = sqliteTable(
  "heartbeats",
  {
    id: int().primaryKey({ autoIncrement: true }),
    deviceId: int("device_id")
      .references(() => devices.id, {
        onDelete: "cascade",
      })
      .notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
  },
  (table) => [
    index("heartbeats_device_id_created_at_idx").on(
      table.deviceId,
      table.createdAt,
    ),
  ],
);

export const reports = sqliteTable(
  "reports",
  {
    id: int().primaryKey({ autoIncrement: true }),
    deviceId: int("device_id")
      .references(() => devices.id, {
        onDelete: "cascade",
      })
      .notNull(),
    status: text("status").notNull().$type<status>(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("reports_device_id_created_at_idx").on(
      table.deviceId,
      table.createdAt,
    ),
  ],
);

export const devicesRelations = relations(devices, ({ many }) => ({
  heartbeats: many(heartbeats),
  reports: many(reports),
}));

export const heartbeatsRelations = relations(heartbeats, ({ one }) => ({
  device: one(devices, {
    fields: [heartbeats.deviceId],
    references: [devices.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  device: one(devices, {
    fields: [reports.deviceId],
    references: [devices.id],
  }),
}));
