import { access, mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanupLegacyArticleBackups, findExistingVideoArticle, withManagedArticleTransaction } from "../src/publish";

describe("withManagedArticleTransaction", () => {
  it("does not leave a backup directory inside managed content while the task runs", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-publish-"));
    const contentRoot = join(root, "apps/blog/src/content/posts");
    const articleDir = join(contentRoot, "existing-article");

    await mkdir(articleDir, { recursive: true });
    await mkdir(join(root, ".superpowers/video-to-blog"), { recursive: true });
    await writeFile(join(articleDir, "index.mdx"), "---\ntitle: Before\nslug: existing-article\n---\n原始内容\n", "utf8");

    await withManagedArticleTransaction({
      runtime: {
        workspaceRoot: root,
        toolRoot: join(root, "tools/video-to-blog"),
        envPath: join(root, "tools/video-to-blog/.env"),
        configPath: join(root, "tools/video-to-blog/video-to-blog.config.json"),
        stateRoot: join(root, ".superpowers/video-to-blog"),
        queuePath: join(root, ".superpowers/video-to-blog/queue.json"),
        jobsRoot: join(root, ".superpowers/video-to-blog/jobs"),
        manifestPath: join(root, ".superpowers/video-to-blog/manifest.json"),
        tempRoot: join(root, ".superpowers/video-to-blog/tmp"),
        repoLockPath: join(root, ".superpowers/locks/repo.lock")
      },
      article: {
        slug: "existing-article",
        title: "After",
        canonicalUrl: "https://example.com/video",
        body: "---\ntitle: After\nslug: existing-article\n---\n新内容\n"
      },
      task: async ({ markPersisted }) => {
        const entries = await readdir(contentRoot);
        expect(entries).not.toContain("existing-article.bak-video-to-blog");
        markPersisted();
        return "ok";
      }
    });

    const article = await readFile(join(articleDir, "index.mdx"), "utf8");
    expect(article).toContain("title: After");
  });

  it("cleans up legacy backup directories and ignores them during article lookup", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-publish-"));
    const contentRoot = join(root, "apps/blog/src/content/posts");
    const articleDir = join(contentRoot, "kept-article");
    const legacyBackupDir = join(contentRoot, "kept-article.bak-video-to-blog");

    await mkdir(articleDir, { recursive: true });
    await mkdir(legacyBackupDir, { recursive: true });
    await writeFile(
      join(articleDir, "index.mdx"),
      "---\ntitle: Keep\nslug: kept-article\ncanonicalUrl: https://example.com/video\n---\n正式内容\n",
      "utf8"
    );
    await writeFile(
      join(legacyBackupDir, "index.mdx"),
      "---\ntitle: Backup\nslug: kept-article\ncanonicalUrl: https://example.com/video\n---\n备份内容\n",
      "utf8"
    );

    const existing = await findExistingVideoArticle(contentRoot, "https://example.com/video");
    expect(existing?.slug).toBe("kept-article");
    expect(existing?.filePath).toBe(join(articleDir, "index.mdx"));

    const removed = await cleanupLegacyArticleBackups(contentRoot);
    expect(removed).toEqual([legacyBackupDir]);
    await expect(access(legacyBackupDir)).rejects.toBeDefined();
  });
});
