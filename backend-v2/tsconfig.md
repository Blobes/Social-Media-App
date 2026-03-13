{
  "compilerOptions": {
    "target": "ES2022",
    "rootDir": "./src",
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@/*": ["*"]
    },
    "module": "esnext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "lib": ["ES2020"],
    "skipLibCheck": true
  },
  "typeRoots": ["node_modules/@types", "./src/@types"],
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
