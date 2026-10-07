import ts from "typescript";
/** Vitest's default esbuild transform omits the metadata Nest DTOs/injection need. */
export function nestMetadataPlugin() {
  return {
    name: "nest-typescript-metadata",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!id.endsWith(".ts") || id.includes("/node_modules/") || id.includes("\\node_modules\\"))
        return;
      const result = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true,
          sourceMap: true,
        },
      });
      return { code: result.outputText, map: result.sourceMapText };
    },
  };
}
