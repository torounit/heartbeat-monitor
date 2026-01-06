/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { FC } from "hono/jsx";
import honoFactory, { authMiddleware } from "../../services/honoFactory";

const app = honoFactory
  .createApp()
  .use("*", authMiddleware)
  .get("/", (c) => {
    return c.html(
      <html lang="ja">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <link
            rel="stylesheet"
            href="https://cdn.simplecss.org/simple.min.css"
          />
          {import.meta.env?.DEV ? (
            <script type="module" src="/src/client.tsx"></script>
          ) : (
            <script type="module" src="/static/client.js"></script>
          )}
        </head>
        <body>
          <div id="root" />
        </body>
      </html>,
    );
  });

export default app;
