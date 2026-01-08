import build from "@hono/vite-build/node";
import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "client")
    return {
      plugins: [tailwindcss()],
      esbuild: {
        jsxImportSource: "hono/jsx/dom", // Optimized for hono/jsx/dom
      },
      build: {
        rollupOptions: {
          input: ["./src/client.tsx", "./src/style.css"],
          output: {
            entryFileNames: "static/client.js",
            assetFileNames: "assets/[name].[ext]",
          },
        },
      },
    };

  return {
    plugins: [
      tailwindcss(),
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
