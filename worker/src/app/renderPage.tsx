import type { Context } from "hono";

import type { Env } from "../types";
import type { Page } from "../ui/definePage";

/**
 * サーバーサイドレンダリングするページ共通の殻。
 *
 * 中身をサーバーで描画したうえで、同じデータを data 属性で渡す。
 * クライアントの初回描画がこの HTML と一致するので差し替えが目に見えない。
 */
export function renderPage<P>(
  c: Context<Env>,
  page: Page<P>,
  props: P,
  options?: { title?: string },
): Response {
  return c.render(
    <div id="root" data-page={page.name} data-initial={JSON.stringify(props)}>
      {page.render(props)}
    </div>,
    options,
  );
}
