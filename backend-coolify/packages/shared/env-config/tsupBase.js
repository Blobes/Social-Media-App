export const baseConfig = {
  format: ["esm"],
  target: "node20",
  bundle: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  minify: true,
  shims: true,
  // 🚀 ONLY bundle internal workspace packages
  noExternal: ["@repo/shared", "@repo/database"],
  // 🚀 Let npm packages stay as external imports
  external: [],
  outDir: "dist",
};
