import type { status } from "../../types";
import { formatDateTime } from "../utils";
import StatusBadge from "./StatusBadge";

/**
 * /api/devices/reports と /api/reports/:device のどちらの行も
 * 構造的にこれを満たすので、トップと詳細で同じコンポーネントを使える。
 */
export interface ReportItem {
  id: number;
  status: status;
  createdAt: string;
}

function ReportList({ reports }: { reports: ReportItem[] }) {
  if (reports.length === 0) {
    return (
      <p class="py-2 text-sm text-base-content/60">まだ記録がありません</p>
    );
  }

  return (
    <ul class="divide-y divide-base-300">
      {reports.map((report) => (
        <li
          key={report.id}
          class="flex items-center justify-between gap-3 py-2"
        >
          <span class="text-sm text-base-content/80">
            {formatDateTime(report.createdAt)}
          </span>
          <StatusBadge status={report.status} />
        </li>
      ))}
    </ul>
  );
}

export default ReportList;
