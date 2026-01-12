import type { status } from "../types";
import type { Device } from "./devices";

const STATUS_COLORS = {
  ok: 0x00ff00,
  warn: 0xffff00,
  error: 0xff0000,
  pending: 0x808080,
} as const;

/**
 * Discord Webhookにステータス変更通知を送信
 */
export async function sendStatusChangeNotification(
  webhookUrl: string,
  device: Device,
  newStatus: status,
): Promise<void> {
  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      embeds: [
        {
          title: "Heartbeat Monitor - Status Update",
          description: `Device "${device.name}" status changed to ${newStatus}`,
          color: STATUS_COLORS[newStatus],
          fields: [
            {
              name: "Device",
              value: device.name,
              inline: true,
            },
            {
              name: "Status",
              value: newStatus,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
}
