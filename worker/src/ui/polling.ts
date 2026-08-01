import { useEffect, useRef, useState } from "hono/jsx/dom";

/**
 * 再取得の間隔。
 * サーバー側の cron が1分間隔でステータスを評価するため、
 * それより短くしても新しい情報は増えないが、閾値（warn 2分 / error 5分）を
 * またいだことに気づくまでの遅れを抑えるため 30 秒にしている。
 */
export const POLL_INTERVAL_MS = 30_000;

/**
 * 初回に取得済みのデータを起点に、一定間隔で再取得して最新化する。
 *
 * 初回ロードは呼び出し側の `use()` + `<Suspense>` が担当し、
 * このフックは2回目以降だけを受け持つ。
 *
 * - タブが非表示の間は取得しない。表示に戻った時点で即座に最新化する
 * - 再取得の失敗は握りつぶし、直前に取得できた値を表示し続ける
 *   （一時的な通信断で画面が壊れるのを避けるため）
 */
export function usePolling<T>(
  initialData: T,
  fetcher: () => Promise<T>,
  intervalMs: number = POLL_INTERVAL_MS,
): T {
  const [data, setData] = useState(initialData);

  // fetcher は描画のたびに作り直される場合があるため、
  // effect の依存に入れずに ref 経由で最新のものを参照する
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;

    const refetch = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      const currentFetcher = fetcherRef.current;
      if (!currentFetcher) {
        return;
      }
      currentFetcher()
        .then((next) => {
          if (!cancelled) {
            setData(next);
          }
        })
        .catch(() => {
          // 直前の値を保持したまま次の間隔を待つ
        });
    };

    const timer = setInterval(refetch, intervalMs);
    document.addEventListener("visibilitychange", refetch);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refetch);
    };
  }, [intervalMs]);

  return data;
}
