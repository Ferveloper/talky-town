import { defineConfig } from "vitest/config";
import { nestMetadataPlugin } from "./vitest-transform";
export default defineConfig({
  plugins: [nestMetadataPlugin()],
  test: {
    environment: "node",
    include: ["test/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    exclude: ["test/domain-database.spec.ts", "test/**/*.database-spec.ts"],
    env: {
      JWT_SECRET: "talkytown-deterministic-test-secret-32-characters",
      NODE_ENV: "test",
      AI_CLOUD_API_KEY: "",
      AI_LOCAL_API_KEY: "",
    },
  },
});
