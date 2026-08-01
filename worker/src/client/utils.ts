const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * 日時文字列を表示用に整形する。
 * pending なデバイスは lastLogAt が空文字なので "—" を返す。
 */
export function formatDateTime(value: string | undefined): string {
  if (!value) {
    return "—";
  }
  // 旧マイグレーションの CURRENT_TIMESTAMP は "YYYY-MM-DD HH:MM:SS" 形式
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return dateTimeFormat.format(date);
}

/** 経過秒数を「◯分前」のような相対表現にする。 */
export function formatElapsed(seconds: number | undefined): string {
  if (seconds === undefined) {
    return "—";
  }
  if (seconds < 60) {
    return `${String(seconds)}秒前`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${String(minutes)}分前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${String(hours)}時間前`;
  }
  return `${String(Math.floor(hours / 24))}日前`;
}

/**
 * デバイス名をURLセグメントとして安全な形にする。
 * hono の RPC クライアントはパスパラメータをエンコードせずに埋め込むため、
 * リンク生成でも API 呼び出しでも必ずこれを通すこと。
 */
export function encodeDeviceName(name: string): string {
  return encodeURIComponent(name);
}

export function deviceHref(name: string): string {
  return `/devices/${encodeDeviceName(name)}`;
}
