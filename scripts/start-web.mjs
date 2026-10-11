import { createRequire } from "node:module";
import { spawn } from "node:child_process";
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "start", "--port", "3000"],
  { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" }, windowsHide: true },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
