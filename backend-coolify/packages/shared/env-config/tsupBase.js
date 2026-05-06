// import { makeAround } from "tsup"; // Not strictly needed, but showing context

export const baseConfig = {
  format: ["esm"],
  target: "node20",
  bundle: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  minify: true,
  // 🚀 THE FIX: Enable shims to bridge the gap between CJS and ESM
  shims: true,
  noExternal: [/(.*)/],
  outDir: "dist",
  // 🚀 ADD THIS: Injects a require helper into the top of your ESM file
  banner: {
    js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    `,
  },
};
