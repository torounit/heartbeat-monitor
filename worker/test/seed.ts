import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../src/db/schema";

const db = drizzle(env.DB, { schema });

// Check if test data already exists
const existingLocations = await db.query.locations.findMany();

// Only insert if no locations exist
if (existingLocations.length === 0) {
  // Insert test data for locations
  const insertedLocations = await db
    .insert(schema.locations)
    .values([
      { name: "Matsumoto Castle" },
      { name: "Matsumoto Performing Arts Center" },
      { name: "Matsumoto City Museum of Art" },
    ])
    .returning();

  // Insert test data for logs
  if (insertedLocations.length > 0) {
    const locationId = insertedLocations[0].id;
    await db.insert(schema.heartbeats).values([
      { locationId, createdAt: "2025-01-01 00:00:00" },
      { locationId, createdAt: "2025-01-02 00:00:00" },
      { locationId, createdAt: "2025-01-03 00:00:00" },
    ]);
  }
}
