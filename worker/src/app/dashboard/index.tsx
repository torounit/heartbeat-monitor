import type { FC } from "hono/jsx";
import honoFactory, { authMiddleware } from "../../services/honoFactory";

const app = honoFactory.createApp();

app.use("*", authMiddleware);

const Dashboard: FC = () => {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link
          rel="stylesheet"
          href="https://cdn.simplecss.org/simple.min.css"
        />
        <title>Heartbeat Monitor Dashboard</title>
      </head>
      {import.meta.env.PROD ? (
        <script type="module" src="/static/client/index.js" />
      ) : (
        <script type="module" src="/src/client/index.tsx" />
      )}
      <div id="root"></div>
    </html>
  );
};

app.get("/", (c) => {
  return c.html(<Dashboard />);
});

export default app;
