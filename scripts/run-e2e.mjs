import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
const database = process.env.E2E_DATABASE_URL;
if (!database)
  throw new Error("Set E2E_DATABASE_URL to an isolated PostgreSQL database ending in _e2e.");
const url = new URL(database);
if (
  !["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname) ||
  !/^\/[a-zA-Z0-9_]+_e2e$/.test(url.pathname)
)
  throw new Error(
    "E2E requires a local database ending in _e2e; developer databases are forbidden.",
  );
const env = {
  ...process.env,
  DATABASE_URL: database,
  NODE_ENV: "production",
  API_PORT: "3101",
  API_CORS_ORIGIN: "http://localhost:3100",
  WEB_APP_ORIGIN: "http://localhost:3100",
  TALKYTOWN_API_URL: "http://localhost:3101",
  DEMO_AUTH_ENABLED: "true",
  DEMO_USER_EMAIL: `e2e-${randomUUID()}@talkytown.local`,
  DEMO_USER_ALIAS: "TFM Browser Tutor",
  JWT_SECRET: "isolated-browser-only-secret-at-least-32-characters",
  AI_CLOUD_API_KEY: "",
  AI_LOCAL_API_KEY: "",
};
function run(args) {
  const entry = process.env.npm_execpath;
  if (!entry) throw new Error("Run this script through pnpm e2e.");
  const result = spawnSync(process.execPath, [entry, ...args], {
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status !== 0)
    throw new Error(`E2E command failed (${result.status}): ${args.join(" ")}`);
}
let seeded = false;
try {
  run(["db:migrate"]);
  run(["--filter", "@talkytown/api", "exec", "tsx", "test/helpers/browser-fixtures.ts", "create"]);
  seeded = true;
  if (process.env.E2E_SKIP_BUILD !== "1") run(["build"]);
  run(["exec", "playwright", "test", ...process.argv.slice(2)]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (seeded) {
    try {
      run([
        "--filter",
        "@talkytown/api",
        "exec",
        "tsx",
        "test/helpers/browser-fixtures.ts",
        "cleanup",
      ]);
    } catch {
      process.exitCode = 1;
    }
  }
}
