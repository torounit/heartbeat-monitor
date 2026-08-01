import { hc } from "hono/client";

import type { AppType } from "../app";
import type { DeviceStatus } from "../services/heartbeats";
import type { DeviceWithReports } from "../services/reports";

export const client = hc<AppType>("/");

/** トップページの Reports に出すデバイスあたりの件数。SSR ルートも同じ値を使う。 */
export const REPORTS_PREVIEW_LIMIT = 5;

// 戻り値に services の型を注釈することで、API のレスポンスと画面が扱う形が
// ずれた時点でコンパイルエラーになる（型の供給源ではなくドリフト検知器として使う）。
export async function fetchStatus(): Promise<DeviceStatus[]> {
  const res = await client.api.status.$get();
  return res.json();
}

export async function fetchDeviceReports(): Promise<DeviceWithReports[]> {
  const res = await client.api.devices.reports.$get({
    query: { limit: String(REPORTS_PREVIEW_LIMIT) },
  });
  return res.json();
}
