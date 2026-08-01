import type { DeviceStatus } from "../services/heartbeats";
import type { DeviceWithReports, ReportItem } from "../services/reports";
import type { status } from "../types";

/**
 * サーバーが #root の data-initial に埋め込む初期データ。
 * クライアントはこれを初回描画に使うため、サーバーの出力と一致し、
 * DOM の差し替えが目に見えなくなる。
 */
export interface DashboardData {
  statuses: DeviceStatus[];
  deviceReports: DeviceWithReports[];
}

export interface DeviceDetailData {
  status: DeviceStatus;
  reports: ReportItem[];
}

// Array.isArray は unknown を any[] に絞ってしまうため、専用のガードを使う
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStatusValue(value: unknown): value is status {
  return (
    value === "ok" ||
    value === "warn" ||
    value === "error" ||
    value === "pending"
  );
}

function isDeviceStatus(value: unknown): value is DeviceStatus {
  if (!isRecord(value)) {
    return false;
  }
  const { device, status, lastLogAt, timeSinceLastLogSeconds } = value;
  return (
    typeof device === "string" &&
    isStatusValue(status) &&
    typeof lastLogAt === "string" &&
    (timeSinceLastLogSeconds === undefined ||
      typeof timeSinceLastLogSeconds === "number")
  );
}

function isReportItem(value: unknown): value is ReportItem {
  if (!isRecord(value)) {
    return false;
  }
  const { id, status, createdAt } = value;
  return (
    typeof id === "number" &&
    isStatusValue(status) &&
    typeof createdAt === "string"
  );
}

function isDeviceWithReports(value: unknown): value is DeviceWithReports {
  if (!isRecord(value)) {
    return false;
  }
  const { id, name, reports } = value;
  return (
    typeof id === "number" &&
    typeof name === "string" &&
    isUnknownArray(reports) &&
    reports.every(isReportItem)
  );
}

export function isDashboardData(value: unknown): value is DashboardData {
  if (!isRecord(value)) {
    return false;
  }
  const { statuses, deviceReports } = value;
  return (
    isUnknownArray(statuses) &&
    statuses.every(isDeviceStatus) &&
    isUnknownArray(deviceReports) &&
    deviceReports.every(isDeviceWithReports)
  );
}

export function isDeviceDetailData(value: unknown): value is DeviceDetailData {
  if (!isRecord(value)) {
    return false;
  }
  const { status, reports } = value;
  return (
    isDeviceStatus(status) &&
    isUnknownArray(reports) &&
    reports.every(isReportItem)
  );
}

/**
 * #root の data-initial を読む。
 * HTML パーサが実体参照を戻すので、そのまま JSON.parse できる。
 */
export function readInitialData(root: HTMLElement): unknown {
  const raw = root.dataset.initial;
  if (raw === undefined) {
    return undefined;
  }
  try {
    // any を明示的に unknown へ受けるのは no-unsafe-assignment の対象外
    const parsed: unknown = JSON.parse(raw);
    return parsed;
  } catch {
    return undefined;
  }
}
