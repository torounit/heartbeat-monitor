import type { status } from "../types";
import type { Location } from "./locations";

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
  location: Location,
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
          description: `Location "${location.name}" status changed to ${newStatus}`,
          color: STATUS_COLORS[newStatus],
          fields: [
            {
              name: "Location",
              value: location.name,
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
