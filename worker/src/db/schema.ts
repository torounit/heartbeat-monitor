import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

export const locations = sqliteTable("locations", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
});

export const logs = sqliteTable("logs", {
  id: int().primaryKey({ autoIncrement: true }),
  locationId: int("location_id")
    .references(() => locations.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  location: one(locations, {
    fields: [logs.locationId],
    references: [locations.id],
  }),
}));
