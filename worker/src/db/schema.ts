import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const usersTable = sqliteTable("logs", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: text()
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

});
