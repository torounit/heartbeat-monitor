/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/prefer-function-type -- 宣言マージには interface が必要で、type エイリアスにするとマージされない */
import { jsxRenderer } from "hono/jsx-renderer";

// c.render(node, { title }) を型安全に使えるようにする宣言マージ
declare module "hono" {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response;
  }
}

const SITE_TITLE = "Heartbeat Monitor";

export const renderer = jsxRenderer(({ children, title }) => {
  return (
    <html lang="ja" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title ? `${title} | ${SITE_TITLE}` : SITE_TITLE}</title>
        <link
          href={import.meta.env?.DEV ? `/src/style.css` : `/assets/style.css`}
          rel="stylesheet"
        />
        {import.meta.env?.DEV ? (
          <script type="module" src="/src/client.tsx"></script>
        ) : (
          <script type="module" src="/static/client.js"></script>
        )}
      </head>
      <body class="min-h-dvh bg-base-200 text-base-content">
        <header class="sticky top-0 z-10 bg-base-100 shadow-sm">
          <div class="mx-auto w-full max-w-5xl px-2">
            <a href="/" class="btn btn-ghost px-2 text-lg font-bold">
              {SITE_TITLE}
            </a>
          </div>
        </header>
        <main class="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
});
