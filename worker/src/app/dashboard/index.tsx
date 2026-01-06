/* eslint-disable @typescript-eslint/no-unnecessary-condition */
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
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
            rel="stylesheet"
            integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
            crossorigin="anonymous"
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
