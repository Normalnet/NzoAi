// Produces a Vercel Build Output API (v3) bundle:
//   .vercel/output/static            -> Vite SPA build
//   .vercel/output/functions/api.func -> single bundled Node function for /api/*
//   .vercel/output/config.json       -> routing (API -> function, everything else -> SPA)
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, ".vercel", "output");
const funcDir = path.join(out, "functions", "api.func");

rmSync(out, { recursive: true, force: true });

// 1. Frontend
execSync("pnpm --filter @nzoai/web build", { stdio: "inherit", cwd: root });
cpSync(path.join(root, "apps", "web", "dist"), path.join(out, "static"), { recursive: true });

// 2. API function (fully bundled so path aliases and ESM/CJS quirks are resolved at build time)
mkdirSync(funcDir, { recursive: true });
await build({
  entryPoints: [path.join(root, "apps", "web", "src", "vercel-handler.ts")],
  outfile: path.join(funcDir, "index.mjs"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  tsconfig: path.join(root, "tsconfig.json"),
  external: ["pg-native"],
  logLevel: "info",
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
  },
});

writeFileSync(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      maxDuration: 60,
    },
    null,
    2
  )
);

// 3. Routing
writeFileSync(
  path.join(out, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "^/api/?(.*)$", dest: "/api?__path=$1" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2
  )
);

console.log("[vercel-build] Build Output API bundle ready at .vercel/output");
