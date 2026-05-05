export const baseConfig = {
  format: ["esm"],
  target: "node20",
  bundle: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  minify: true, // keep for production
  shims: false, // important: disable for stability
  noExternal: ["@repo/shared", "@repo/database"],
  outDir: "dist",
};
