declare module "cloudflare:test" {
  interface ProvidedEnv extends Cloudflare.Env {
    TEST_MIGRATIONS: import("@cloudflare/vitest-pool-workers/config").D1Migration[];
  }
}
