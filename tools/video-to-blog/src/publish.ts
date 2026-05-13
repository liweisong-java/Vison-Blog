import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import matter from "gray-matter";
import { withRepoLock } from "./repo-lock.js";
import type { ComposedArticle, VideoMetadata, VideoToBlogRuntime } from "./types.js";
import { readManifest, writeManifest } from "./state.js";

export async function writeVideoArticle(contentRoot: string, article: ComposedArticle) {
  const target = join(contentRoot, article.slug, "index.mdx");
  const tempTarget = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(tempTarget, article.body, "utf8");
  await rename(tempTarget, target);
  return target;
}

export async function findExistingVideoArticle(contentRoot: string, canonicalUrl: string) {
  try {
    const entries = await readdirRecursive(contentRoot);
    for (const filePath of entries.filter((entry) => entry.endsWith("/index.mdx"))) {
      const parsed = matter(await readFile(filePath, "utf8"));
      if (parsed.data.canonicalUrl === canonicalUrl) {
        return {
          slug: String(parsed.data.slug ?? filePath.split("/").at(-2)),
          filePath
        };
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function readdirRecursive(root: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const result: string[] = [];

  async function visit(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else {
        result.push(absolute);
      }
    }
  }

  await visit(root);
  return result;
}

export async function withManagedArticleTransaction<T>({
  runtime,
  article,
  task
}: {
  runtime: VideoToBlogRuntime;
  article: ComposedArticle;
  task: (context: { articlePath: string; markPersisted: () => void }) => Promise<T>;
}) {
  const articleDir = join(runtime.workspaceRoot, "apps/blog/src/content/posts", article.slug);
  const articlePath = join(articleDir, "index.mdx");
  const backupDir = `${articleDir}.bak-video-to-blog`;

  return withRepoLock(runtime.repoLockPath, async () => {
    let persisted = false;

    try {
      await rm(backupDir, { recursive: true, force: true });
      await cp(articleDir, backupDir, { recursive: true });
    } catch {
      // no existing managed article yet
    }

    await writeVideoArticle(join(runtime.workspaceRoot, "apps/blog/src/content/posts"), article);

    try {
      const result = await task({
        articlePath,
        markPersisted: () => {
          persisted = true;
        }
      });
      await rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
      return result;
    } catch (error) {
      if (persisted) {
        await rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
        throw error;
      }

      try {
        await rm(articleDir, { recursive: true, force: true }).catch(() => undefined);
        await cp(backupDir, articleDir, { recursive: true }).catch(() => undefined);
        await rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
      } catch {
        await rm(articleDir, { recursive: true, force: true }).catch(() => undefined);
      }
      throw error;
    }
  });
}

export async function updatePublishedManifest({
  runtime,
  metadata,
  slug,
  now
}: {
  runtime: VideoToBlogRuntime;
  metadata: VideoMetadata;
  slug: string;
  now: string;
}) {
  const manifest = await readManifest(runtime.manifestPath);
  const nextVideos = manifest.videos.filter((entry) => entry.url !== metadata.webpageUrl);
  nextVideos.push({
    url: metadata.webpageUrl,
    slug,
    updatedAt: now
  });
  await writeManifest(runtime.manifestPath, { videos: nextVideos });
}
