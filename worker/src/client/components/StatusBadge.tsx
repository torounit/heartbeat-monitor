import type { status } from "../../types";

/**
 * Tailwind v4 はソース中のリテラルしかクラス名として検出しないため、
 * `badge-${status}` のような組み立ては禁止。ここが唯一のマップ。
 * 色は services/discord.ts の STATUS_COLORS と揃えている。
 */
const STATUS_STYLES: Record<status, { badge: string; accent: string }> = {
  ok: { badge: "badge-success", accent: "border-l-success" },
  warn: { badge: "badge-warning", accent: "border-l-warning" },
  error: { badge: "badge-error", accent: "border-l-error" },
  pending: { badge: "badge-neutral", accent: "border-l-neutral" },
};

export function statusAccentClass(value: status): string {
  return STATUS_STYLES[value].accent;
}

function StatusBadge({ status: value }: { status: status }) {
  return (
    <span class={`badge badge-sm ${STATUS_STYLES[value].badge}`}>{value}</span>
  );
}

export default StatusBadge;
