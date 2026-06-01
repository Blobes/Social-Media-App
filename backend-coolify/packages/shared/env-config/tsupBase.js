export const baseConfig = {
  format: ["cjs"],
  target: "node20",
  bundle: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  minify: true,
  shims: true,
  noExternal: ["@repo/shared", "@repo/database"],
  external: [],
  outDir: "dist",
};
