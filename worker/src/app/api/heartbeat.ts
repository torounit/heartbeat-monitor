import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db/schema";
import honoFactory from "../../services/honoFactory";

const heartbeat = honoFactory
  .createApp()
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        device: z.string().optional(),
        location: z.string().optional(), // 後方互換性のため残す
      }),
    ),
    async (c) => {
      const data = c.req.valid("json");
      // deviceとlocationの両方をサポート（後方互換性）
      const deviceName = data.device ?? data.location;

      if (!deviceName) {
        return c.json({ status: "Device or Location name required" }, 400);
      }

      const db = c.get("db");
      const device = await db.query.devices.findFirst({
        where: eq(schema.devices.name, deviceName),
      });

      if (!device) {
        return c.json({ status: "Device Not Found" }, 404);
      }
      await db.insert(schema.heartbeats).values({
        deviceId: device.id,
      });

      return c.json({ status: "Heartbeat Logged" }, 201);
    },
  );

export default heartbeat;
