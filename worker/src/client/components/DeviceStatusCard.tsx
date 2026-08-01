import type { DeviceStatus } from "../api";
import { deviceHref, formatDateTime, formatElapsed } from "../utils";
import StatusBadge, { statusAccentClass } from "./StatusBadge";

function DeviceStatusCard({ status }: { status: DeviceStatus }) {
  return (
    <a
      href={deviceHref(status.device)}
      class={`card border border-base-300 border-l-4 bg-base-100 shadow-sm transition hover:shadow-md ${statusAccentClass(status.status)}`}
    >
      <div class="card-body gap-3 p-4">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-semibold wrap-break-word">{status.device}</h3>
          <StatusBadge status={status.status} />
        </div>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt class="text-base-content/60">最終ログ</dt>
          <dd class="text-right">{formatDateTime(status.lastLogAt)}</dd>
          <dt class="text-base-content/60">経過</dt>
          <dd class="text-right">
            {formatElapsed(status.timeSinceLastLogSeconds)}
          </dd>
        </dl>
      </div>
    </a>
  );
}

export default DeviceStatusCard;
