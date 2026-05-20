{
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@repo/core": ["packages/core/src/index.ts"]
    }
  },
  "include": [
    "packages/core/src/types/theme.d.ts",
    "packages/core/src/types/global.d.ts",
    "**/*.js",
    "**/*.ts",
    "**/*.tsx",
    "next-env.d.ts",
    "next.config.js",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
