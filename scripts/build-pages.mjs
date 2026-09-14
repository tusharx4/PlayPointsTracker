/**
 * Build a deployable GitHub Pages site into out/.
 * Usage: node scripts/build-pages.mjs
 * Optional: NEXT_PUBLIC_BASE_PATH=/my-repo (empty for a root/custom-domain site).
 *
 * Pages has no Node.js or PostgreSQL runtime. Build from an isolated copy without
 * server-only API/DB modules, leaving the real source and normal build untouched.
 * No .env files or secrets are copied. Temporary files are removed even on failure.
 */
import { cp, mkdir, rm, access, symlink, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { resolvePagesBasePath } from "./pages-path.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const staging = path.join(root, ".pages-build");
const output = path.join(root, "out");
const basePath = resolvePagesBasePath();
const appRoot = `${basePath}/`;
const exists = (file) => access(file).then(() => true, () => false);

async function build() {
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });

  const serverOnly = new Set([path.join(root, "src", "app", "api"), path.join(root, "src", "db")]);
  await cp(path.join(root, "src"), path.join(staging, "src"), {
    recursive: true,
    filter: (source) => !serverOnly.has(source),
  });
  await cp(path.join(root, "public"), path.join(staging, "public"), { recursive: true });

  for (const file of ["package.json", "package-lock.json", "next.config.ts", "postcss.config.mjs", "tsconfig.json"]) {
    if (await exists(path.join(root, file))) {
      await cp(path.join(root, file), path.join(staging, file));
    }
  }
  await symlink(path.join(root, "node_modules"), path.join(staging, "node_modules"), process.platform === "win32" ? "junction" : "dir");

  const env = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    PLAY_POINTS_STATIC_EXPORT: "1",
    NEXT_PUBLIC_BASE_PATH: basePath,
  };
  delete env.DATABASE_URL;

  console.log(`\nBuilding GitHub Pages site at ${appRoot} (no server/database required)…\n`);
  // Webpack resolves the shared node_modules symlink without requiring a second
  // dependency install or making the staging folder a Turbopack workspace root.
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"], {
      cwd: staging,
      env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Static build failed (${signal ?? code}). Nothing was deployed.`));
    });
  });

  const exported = path.join(staging, "out");
  await access(path.join(exported, "index.html"));
  await rm(output, { recursive: true, force: true });
  await cp(exported, output, { recursive: true });
  await writeFile(path.join(output, ".nojekyll"), "");

  // Give every deployment its own shell cache, including after a logo/JS update.
  const html = await readFile(path.join(output, "index.html"), "utf8");
  const workerPath = path.join(output, "sw.js");
  const worker = await readFile(workerPath, "utf8");
  const revision = createHash("sha256").update(html).update(worker).digest("hex").slice(0, 16);
  await writeFile(workerPath, worker.replace("__PLAY_POINTS_BUILD__", revision));

  // Recover old clean links such as /repo/history?account=123 on a static host.
  // HashRouter's canonical URL is /repo/#/history?account=123.
  const recovery = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Opening Play Points</title></head><body><p>Opening Play Points… <a href="${appRoot}">Open dashboard</a></p><script>(function(){var root=${JSON.stringify(appRoot)};var p=location.pathname.indexOf(root)===0?location.pathname.slice(root.length).replace(/\\/+$/,""):"";var route=["accounts","history","analytics","settings"].includes(p)?"/"+p:"/";location.replace(root+"#"+route+location.search);})();</script></body></html>`;
  await writeFile(path.join(output, "404.html"), recovery);
  for (const route of ["accounts", "history", "analytics", "settings"]) {
    await mkdir(path.join(output, route), { recursive: true });
    await writeFile(path.join(output, route, "index.html"), recovery);
  }
  console.log(`\n✓ Static site ready in out/ — publish the contents at ${appRoot}\n`);
}

try {
  await build();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await rm(staging, { recursive: true, force: true });
}
