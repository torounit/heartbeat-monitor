import type { ReportItem } from "../../services/reports";
import { formatDateTime } from "../utils";
import StatusBadge from "./StatusBadge";

/**
 * ReportItem は表示に必要な列だけを持つ形。
 * /api/devices/reports と /api/reports/:device のどちらの行も構造的にこれを
 * 満たすので、トップと詳細で同じコンポーネントを使える。
 */
function ReportList({ reports }: { reports: readonly ReportItem[] }) {
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
