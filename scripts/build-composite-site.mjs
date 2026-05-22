import {cp, mkdir, readdir, rm, writeFile} from "node:fs/promises";
import {dirname, join, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultQuartzDir = resolve(workspaceRoot, "apps/quartz/public");
const defaultAstroDir = resolve(workspaceRoot, "apps/blog/dist");
const defaultOutDir = resolve(workspaceRoot, "site-dist");

const privateRoutes = ["about", "archive", "desk", "secret-dashboard"];
const astroAssetDirs = ["_astro"];

async function pathExists(path) {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureParent(path) {
  await mkdir(dirname(path), {recursive: true});
}

async function copyRoute(route, fromRoot, toRoot) {
  const source = join(fromRoot, route);
  const target = join(toRoot, route);
  await rm(target, {recursive: true, force: true});
  await mkdir(dirname(target), {recursive: true});
  await cp(source, target, {recursive: true});
}

async function copyOptionalPath(pathName, fromRoot, toRoot) {
  const source = join(fromRoot, pathName);
  const target = join(toRoot, pathName);

  try {
    await rm(target, {recursive: true, force: true});
    await mkdir(dirname(target), {recursive: true});
    await cp(source, target, {recursive: true});
  } catch {
    // Ignore optional assets that do not exist in the Astro output.
  }
}

function createRedirectHtml(targetPath) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>跳转中</title>
    <meta http-equiv="refresh" content="0; url=${targetPath}" />
    <link rel="canonical" href="${targetPath}" />
  </head>
  <body>
    <p>正在跳转到 <a href="${targetPath}">${targetPath}</a>。</p>
  </body>
</html>
`;
}

async function collectQuartzPostSlugs(quartzDir) {
  const entries = await readdir(quartzDir, {withFileTypes: true});
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => !["tags", "static"].includes(slug));
}

/**
 * @typedef {{
 *   quartzDir?: string;
 *   astroDir?: string;
 *   outDir?: string;
 *   redirectSlugs?: string[];
 * }} BuildCompositeSiteOptions
 */

/**
 * @param {BuildCompositeSiteOptions} options
 */
export async function buildCompositeSite({
  quartzDir = defaultQuartzDir,
  astroDir = defaultAstroDir,
  outDir = defaultOutDir,
  redirectSlugs
} = {}) {
  const resolvedQuartzDir = resolve(quartzDir);
  const resolvedAstroDir = resolve(astroDir);
  const resolvedOutDir = resolve(outDir);

  await rm(resolvedOutDir, {recursive: true, force: true});
  await mkdir(resolvedOutDir, {recursive: true});
  await cp(resolvedQuartzDir, resolvedOutDir, {recursive: true});

  for (const route of privateRoutes) {
    await copyRoute(route, resolvedAstroDir, resolvedOutDir);
  }

  for (const assetDir of astroAssetDirs) {
    await copyOptionalPath(assetDir, resolvedAstroDir, resolvedOutDir);
  }

  const slugs = redirectSlugs ?? (await collectQuartzPostSlugs(resolvedQuartzDir));
  for (const slug of slugs) {
    const targetDir = join(resolvedOutDir, "posts", slug);
    await mkdir(targetDir, {recursive: true});
    await writeFile(join(targetDir, "index.html"), createRedirectHtml(`/${slug}/`), "utf8");
  }

  return {
    outDir: resolvedOutDir,
    quartzDir: resolvedQuartzDir,
    astroDir: resolvedAstroDir,
    redirectCount: slugs.length,
    copiedRoutes: [...privateRoutes]
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await buildCompositeSite();
  console.log(JSON.stringify({
    ...result,
    quartzDir: relative(workspaceRoot, result.quartzDir),
    astroDir: relative(workspaceRoot, result.astroDir),
    outDir: relative(workspaceRoot, result.outDir)
  }, null, 2));
}
