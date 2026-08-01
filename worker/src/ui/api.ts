import type { InferResponseType } from "hono/client";
import { hc } from "hono/client";

import type { AppType } from "../app";

export const client = hc<AppType>("/");

// `, 200` を明示しないと :device 系のレスポンス型に 404/500 の { error } が混ざる
export type DeviceStatus = InferResponseType<
  typeof client.api.status.$get,
  200
>[number];

export type DeviceWithReports = InferResponseType<
  typeof client.api.devices.reports.$get,
  200
>[number];
