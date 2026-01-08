/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
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
      <body>{children}</body>
    </html>
  );
});
