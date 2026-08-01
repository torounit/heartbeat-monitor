import type { Child } from "hono/jsx";
import { render } from "hono/jsx/dom";

/**
 * サーバーサイドレンダリングするページ1枚の定義。
 *
 * サーバー（app/renderPage.tsx）とクライアント（client.tsx）がこの同じ定義を
 * 読むので、ページを増やしてもエントリポイントには手を入れなくて済む。
 */
export interface PageDefinition<P> {
  /** #root の data-page に埋める識別子。ui/pages/ からの相対パスに合わせる */
  name: string;
  /** data-initial から読んだ値が自分のページの props かを判定する */
  isProps: (value: unknown) => value is P;
  /** props から画面を作る。サーバーとブラウザで同じ結果になること */
  render: (props: P) => Child;
}

/**
 * 型引数を消したページ。
 * client.tsx は具体的な props 型を知らずに、name で引いて mount するだけで済む。
 */
export interface MountablePage {
  name: string;
  mount: (root: HTMLElement, data: unknown) => void;
}

export interface Page<P> extends PageDefinition<P>, MountablePage {}

export function definePage<P>(definition: PageDefinition<P>): Page<P> {
  return {
    ...definition,
    mount(root, data) {
      if (!definition.isProps(data)) {
        // デプロイ中の版ずれや古いキャッシュで起きうる。描画をやめて
        // サーバーが返した HTML を残すほうが、空白にするより正しい。
        console.warn(`initial data がページ "${definition.name}" と一致しない`);
        return;
      }
      // P はこのクロージャの中では具体型なので、ユニオンの呼び出しにならない
      render(definition.render(data), root);
    },
  };
}
