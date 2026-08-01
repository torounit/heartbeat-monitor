import { useEffect, useState } from "hono/jsx/dom";

import { formatElapsed } from "../utils";

/**
 * 経過時間を1秒ごとに更新して表示する。
 *
 * サーバーが算出した秒数を基点に、マウントからの実時間を足して求める。
 * lastLogAt から端末の時計で直接計算すると時計ずれがそのまま表示に出るため、
 * サーバー基準の値からの差分だけをクライアントで進める。
 *
 * useState は Object.is で差分を判定するので、表示文字列が変わらない限り
 * 再描画は発生しない（「200日前」のような値では実質何も起きない）。
 */
function ElapsedTime({ seconds }: { seconds: number | undefined }) {
  const [label, setLabel] = useState(() => formatElapsed(seconds));

  useEffect(() => {
    if (seconds === undefined) {
      return;
    }

    const baseSeconds = seconds;
    const mountedAt = Date.now();

    const timer = setInterval(() => {
      // 毎回実時間から求め直すため、スリープ復帰後もずれない
      const elapsed = baseSeconds + Math.floor((Date.now() - mountedAt) / 1000);
      setLabel(formatElapsed(elapsed));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [seconds]);

  return <span>{label}</span>;
}

export default ElapsedTime;
