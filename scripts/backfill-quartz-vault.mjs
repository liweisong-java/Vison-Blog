import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const astroPostsDir = resolve(repoRoot, "apps/blog/src/content/posts");
const vaultPostsDir = resolve(repoRoot, "content/vault/posts");

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function resetManagedTarget() {
  const entries = await readdir(vaultPostsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".gitkeep" || entry.name === "index.md") {
      continue;
    }
    await rm(resolve(vaultPostsDir, entry.name), { recursive: true, force: true });
  }
}

async function backfillPost(slug) {
  const sourcePath = resolve(astroPostsDir, slug, "index.mdx");
  let raw;
  try {
    raw = await readFile(sourcePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
  const targetDir = resolve(vaultPostsDir, slug);
  await ensureDir(targetDir);
  await writeFile(resolve(targetDir, "index.md"), raw.trim() + "\n", "utf8");
  return true;
}

async function main() {
  await ensureDir(vaultPostsDir);
  await resetManagedTarget();

  const entries = await readdir(astroPostsDir, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "zh-CN"));

  let writtenCount = 0;
  for (const slug of slugs) {
    const written = await backfillPost(slug);
    if (written) {
      writtenCount += 1;
    }
  }

  console.log(`Backfilled ${writtenCount} Astro posts into content/vault/posts`);
}

await main();
