import { sql, relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
});

export const heartbeats = sqliteTable("heartbeats", {
  id: int().primaryKey({ autoIncrement: true }),
  locationId: int("location_id")
    .references(() => locations.id, {
      onDelete: "cascade",
    })
    .notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
});

export const locationsRelations = relations(locations, ({ many }) => ({
  heartbeats: many(heartbeats),
}));

export const heartbeatsRelations = relations(heartbeats, ({ one }) => ({
  location: one(locations, {
    fields: [heartbeats.locationId],
    references: [locations.id],
  }),
}));
