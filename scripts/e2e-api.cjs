const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const apiRequire = createRequire(resolve("apps/api/package.json"));
const { ApiExceptionFilter } = apiRequire("./dist/common/api-exception.filter");
const original = ApiExceptionFilter.prototype.catch;
ApiExceptionFilter.prototype.catch = function (error, host) {
  if (!(error instanceof apiRequire("@nestjs/common").HttpException))
    console.error(
      "E2E API diagnostic",
      error?.constructor?.name,
      error?.code,
      error?.meta?.error,
      error?.stack
        ?.split("\n")
        .filter((line) => line.trim().startsWith("at "))
        .join("\n"),
    );
  return original.call(this, error, host);
};
apiRequire("./dist/main");
