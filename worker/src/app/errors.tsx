import type { ErrorHandler } from "hono";

import type { Env } from "../types";

function ServerError({ path }: { path: string }) {
  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold sm:text-2xl">エラーが発生しました</h2>
      <p class="text-base-content/70">
        データの取得に失敗しました。時間をおいて再度お試しください。
      </p>
      <div class="flex flex-wrap gap-2">
        {/* JS なしでも機能するよう、ボタンではなく同一パスへのリンクにする */}
        <a href={path} class="btn btn-primary btn-sm">
          再読み込み
        </a>
        <a href="/" class="btn btn-ghost btn-sm">
          ダッシュボードへ戻る
        </a>
      </div>
    </div>
  );
}

/**
 * 未捕捉の例外を HTML で返す。
 * 既定では hono がプレーンテキストの 500 を返すため、D1 の障害時に
 * 画面がレイアウトごと崩れていた。
 */
export const errorHandler: ErrorHandler<Env> = (err, c) => {
  console.error(err);
  c.status(500);
  return c.render(<ServerError path={c.req.path} />, {
    title: "エラーが発生しました",
  });
};
