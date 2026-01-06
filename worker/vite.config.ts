import build from "@hono/vite-build/node";
import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "client")
    return {
      esbuild: {
        jsxImportSource: "hono/jsx/dom", // Optimized for hono/jsx/dom
      },
      build: {
        rollupOptions: {
          input: "./src/client/index.tsx",
          output: {
            entryFileNames: "static/client/index.js",
          },
        },
      },
    };

  return {
    plugins: [
      build({
        entry: "src/index.ts",
      }),
      devServer({
        adapter: cloudflareAdapter,
        entry: "src/index.ts",
      }),
    ],
  };
});
