// const dts = require("vite-plugin-dts");

module.exports = {
  cacheDir: ".vite",

  resolve: { alias: { "@src": __dirname + "/src" } },

  test: { cache: { dir: ".vitest" } },

  build: {
    outDir: "lib",
    sourcemap: true,

    lib: {
      entry: "src/Library.ts",
      name: "xstateFetcher",
      formats: ["es", "cjs", "umd", "iife"],
    },

    rollupOptions: {
      external: ["xstate"],
      output: { globals: { xstate: "xstate" } },
    },
  },

  // plugins: [
  //   dts({
  //     tsConfigFilePath: "tsconfig.build.json",
  //     rollupTypes: true,
  //     noEmitOnError: true,
  //     skipDiagnostics: false,
  //     logDiagnostics: true,
  //   }),
  // ],
};
