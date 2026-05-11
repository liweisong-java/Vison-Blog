import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncPublishedNotes } from "../src/commands/sync";

vi.mock("../src/fs", async () => {
  const actual = await vi.importActual<typeof import("../src/fs")>("../src/fs");
  return {
    ...actual,
    copyAssetFiles: vi.fn().mockResolvedValue(undefined)
  };
});

const baseConfig = {
  notebookId: "demo",
  siyuanWorkspaceDir: "/tmp/SiYuan",
  contentRoot: "/tmp/content",
  attrs: {
    publish: "blog-pub",
    category: "blog-cat",
    excerpt: "blog-excerpt",
    featured: "blog-top",
    slug: "blog-slug",
    tags: "blog-tags",
    publishedAt: "blog-date"
    ,
    cover: "blog-cover",
    canonicalUrl: "blog-canonical"
  }
} as const;

describe("syncPublishedNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns written slugs and removed slugs", async () => {
    const commitAndPush = vi.fn().mockResolvedValue({ committed: true });
    const triggerDeploy = vi.fn();
    const result = await syncPublishedNotes({
      dryRun: true,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "tech",
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-top": "true",
          "blog-slug": "from-notes-to-site",
          "blog-tags": "astro,siyuan",
          "blog-date": "2026-05-10"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\n![Shot](assets/image-demo.png)\n"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([
        { slug: "old-draft", sourceId: "old-draft-id", directory: "/tmp/content/old-draft" }
      ]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush,
      triggerDeploy
    });

    expect(result.written).toEqual(["from-notes-to-site"]);
    expect(result.removed).toEqual(["old-draft"]);
    expect(result.invalid).toEqual([]);
    expect(result.committed).toBe(false);
    expect(commitAndPush).not.toHaveBeenCalled();
    expect(triggerDeploy).not.toHaveBeenCalled();
  });

  it("does not remove seed content that is not managed by the publisher yet", async () => {
    const result = await syncPublishedNotes({
      dryRun: true,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([]),
        getBlockAttrs: vi.fn(),
        exportMarkdown: vi.fn()
      },
      collectContentEntries: vi.fn().mockResolvedValue([
        { slug: "from-notes-to-site", directory: "/tmp/content/from-notes-to-site" },
        { slug: "weekend-walk", directory: "/tmp/content/weekend-walk" }
      ]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn(),
      triggerDeploy: vi.fn()
    });

    expect(result.removed).toEqual([]);
  });

  it("fills slug, excerpt, and published date from the note when attrs are missing", async () => {
    const writeBundle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-life-1",
            content: "周末 散步",
            hpath: "/Blog/周末 散步",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "life",
          "blog-tags": "journal"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Morning light\n\nThe same note can become a polished article with almost no extra metadata."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(result.written).toEqual(["zhou-mo-san-bu"]);
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        filePath: "zhou-mo-san-bu/index.mdx",
        body: expect.stringContaining("publishedAt: '2026-05-10'")
      })
    );
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        body: expect.stringContaining("The same note can become a polished article")
      })
    );
  });

  it("maps cover and canonical metadata into the generated post bundle", async () => {
    const writeBundle = vi.fn();

    await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "tech",
          "blog-slug": "from-notes-to-site",
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-date": "2026-05-10",
          "blog-cover": "assets/hero-cover.png",
          "blog-canonical": "https://mp.weixin.qq.com/s/example"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\nA practical walkthrough for publishing from notes."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      writeWechatArticle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        body: expect.stringContaining("canonicalUrl: 'https://mp.weixin.qq.com/s/example'")
      })
    );
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        body: expect.stringContaining("cover: ./hero-cover.png")
      })
    );
  });

  it("reports invalid published notes with clear reasons", async () => {
    await expect(
      syncPublishedNotes({
        dryRun: false,
        config: baseConfig,
        client: {
          queryDocuments: vi.fn().mockResolvedValue([
            {
              id: "doc-invalid-1",
              content: "Broken Note",
              hpath: "/Blog/Broken Note",
              updated: "20260510120000"
            }
          ]),
          getBlockAttrs: vi.fn().mockResolvedValue({
            "blog-pub": "true",
            "blog-cat": "travel"
          }),
          exportMarkdown: vi.fn().mockResolvedValue({
            content: "too short"
          })
        },
        collectContentEntries: vi.fn().mockResolvedValue([]),
        writeBundle: vi.fn(),
        removeManagedPost: vi.fn(),
        runBlogChecks: vi.fn(),
        commitAndPush: vi.fn(),
        triggerDeploy: vi.fn()
      })
    ).rejects.toThrow(/Broken Note/);

    await expect(
      syncPublishedNotes({
        dryRun: false,
        config: baseConfig,
        client: {
          queryDocuments: vi.fn().mockResolvedValue([
            {
              id: "doc-invalid-1",
              content: "Broken Note",
              hpath: "/Blog/Broken Note",
              updated: "20260510120000"
            }
          ]),
          getBlockAttrs: vi.fn().mockResolvedValue({
            "blog-pub": "true",
            "blog-cat": "travel"
          }),
          exportMarkdown: vi.fn().mockResolvedValue({
            content: "too short"
          })
        },
        collectContentEntries: vi.fn().mockResolvedValue([]),
        writeBundle: vi.fn(),
        removeManagedPost: vi.fn(),
        runBlogChecks: vi.fn(),
        commitAndPush: vi.fn(),
        triggerDeploy: vi.fn()
      })
    ).rejects.toThrow(/category must be tech or life/i);
  });

  it("prevents slug collisions with existing content", async () => {
    await expect(
      syncPublishedNotes({
        dryRun: false,
        config: baseConfig,
        client: {
          queryDocuments: vi.fn().mockResolvedValue([
            {
              id: "doc-tech-2",
              content: "Existing Title",
              hpath: "/Blog/Existing Title",
              updated: "20260510120000"
            }
          ]),
          getBlockAttrs: vi.fn().mockResolvedValue({
            "blog-pub": "true",
            "blog-cat": "tech"
          }),
          exportMarkdown: vi.fn().mockResolvedValue({
            content: "## Intro\n\nThis note is long enough to form a generated excerpt for collision testing."
          })
        },
        collectContentEntries: vi.fn().mockResolvedValue([
          { slug: "existing-title", sourceId: "manual-post", directory: "/tmp/content/existing-title" }
        ]),
        writeBundle: vi.fn(),
        removeManagedPost: vi.fn(),
        runBlogChecks: vi.fn(),
        commitAndPush: vi.fn(),
        triggerDeploy: vi.fn()
      })
    ).rejects.toThrow(/existing-title/);
  });

  it("prevents overwriting a manual repo post that has no sourceId", async () => {
    await expect(
      syncPublishedNotes({
        dryRun: false,
        config: baseConfig,
        client: {
          queryDocuments: vi.fn().mockResolvedValue([
            {
              id: "doc-tech-2",
              content: "Manual Entry",
              hpath: "/Blog/Manual Entry",
              updated: "20260510120000"
            }
          ]),
          getBlockAttrs: vi.fn().mockResolvedValue({
            "blog-pub": "true",
            "blog-cat": "tech"
          }),
          exportMarkdown: vi.fn().mockResolvedValue({
            content: "## Intro\n\nThis note is long enough to form a generated excerpt for manual collision testing."
          })
        },
        collectContentEntries: vi.fn().mockResolvedValue([
          { slug: "manual-entry", directory: "/tmp/content/manual-entry" }
        ]),
        writeBundle: vi.fn(),
        removeManagedPost: vi.fn(),
        runBlogChecks: vi.fn(),
        commitAndPush: vi.fn(),
        triggerDeploy: vi.fn()
      })
    ).rejects.toThrow(/manual-entry/);
  });

  it("triggers the deploy hook only after a real content commit", async () => {
    const triggerDeploy = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "tech",
          "blog-slug": "from-notes-to-site",
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-date": "2026-05-10"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\nThis article has enough body content to keep the generated bundle valid."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: true, stagedFiles: ["apps/blog/src/content/posts/from-notes-to-site/index.mdx"] }),
      triggerDeploy
    });

    expect(result.committed).toBe(true);
    expect(result.deployed).toBe(true);
    expect(triggerDeploy).toHaveBeenCalledWith(
      expect.objectContaining({
        written: ["from-notes-to-site"],
        removed: []
      })
    );
  });

  it("exports a wechat-friendly copy when configured and enabled for the note", async () => {
    const writeWechatArticle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: {
        ...baseConfig,
        wechatExportDir: "/tmp/wechat"
      },
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "tech",
          "blog-slug": "from-notes-to-site",
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-date": "2026-05-10"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\n![Shot](assets/image-demo.png)\n\nA practical walkthrough for publishing from notes."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle: vi.fn(),
      writeWechatArticle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: true, stagedFiles: ["exports/wechat/from-notes-to-site.md"] }),
      triggerDeploy: vi.fn()
    });

    expect(writeWechatArticle).toHaveBeenCalledWith(
      "/tmp/wechat",
      expect.objectContaining({
        slug: "from-notes-to-site",
        title: "From Notes to Site"
      })
    );
    expect(writeWechatArticle).toHaveBeenCalledWith(
      "/tmp/wechat",
      expect.objectContaining({
        body: expect.stringContaining("From Notes to Site")
      })
    );
    expect(result.wechatExported).toEqual(["from-notes-to-site"]);
  });

  it("removes stale wechat exports when a note is unpublished or its slug changes", async () => {
    const removeWechatArticle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: {
        ...baseConfig,
        wechatExportDir: "/tmp/wechat"
      },
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "tech",
          "blog-slug": "from-notes-to-site-v2",
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-date": "2026-05-10"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\nA practical walkthrough for publishing from notes."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([
        {
          slug: "from-notes-to-site",
          sourceId: "doc-tech-1",
          directory: "/tmp/content/from-notes-to-site"
        },
        {
          slug: "retired-post",
          sourceId: "doc-retired",
          directory: "/tmp/content/retired-post"
        }
      ]),
      writeBundle: vi.fn(),
      writeWechatArticle: vi.fn(),
      removeWechatArticle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: true, stagedFiles: ["exports/wechat/from-notes-to-site-v2.md"] }),
      triggerDeploy: vi.fn()
    });

    expect(removeWechatArticle).toHaveBeenCalledWith("/tmp/wechat", "from-notes-to-site");
    expect(removeWechatArticle).toHaveBeenCalledWith("/tmp/wechat", "retired-post");
    expect(result.wechatRemoved).toEqual(["from-notes-to-site", "retired-post"]);
  });

  it("uses the configured wechatReady attr and removes stale exports when a note opts out", async () => {
    const writeWechatArticle = vi.fn();
    const removeWechatArticle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: {
        ...baseConfig,
        wechatExportDir: "/tmp/wechat",
        attrs: {
          ...baseConfig.attrs,
          wechatReady: "blog-wechat"
        }
      },
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "tech",
          "blog-slug": "from-notes-to-site",
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-date": "2026-05-10",
          "blog-wechat": "false"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\nA practical walkthrough for publishing from notes."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([
        {
          slug: "from-notes-to-site",
          sourceId: "doc-tech-1",
          directory: "/tmp/content/from-notes-to-site"
        }
      ]),
      writeBundle: vi.fn(),
      writeWechatArticle,
      removeWechatArticle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(writeWechatArticle).not.toHaveBeenCalled();
    expect(removeWechatArticle).toHaveBeenCalledWith("/tmp/wechat", "from-notes-to-site");
    expect(result.wechatExported).toEqual([]);
    expect(result.wechatRemoved).toEqual(["from-notes-to-site"]);
  });

  it("removes the previous managed slug when a note slug changes", async () => {
    const removeManagedPost = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "true",
          "blog-cat": "tech",
          "blog-slug": "from-notes-to-site-v2",
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-date": "2026-05-10"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\nThis article has enough body content to keep the generated bundle valid."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([
        {
          slug: "from-notes-to-site",
          sourceId: "doc-tech-1",
          directory: "/tmp/content/from-notes-to-site"
        }
      ]),
      writeBundle: vi.fn(),
      removeManagedPost,
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: true, stagedFiles: ["apps/blog/src/content/posts/from-notes-to-site-v2/index.mdx"] }),
      triggerDeploy: vi.fn()
    });

    expect(result.removed).toEqual(["from-notes-to-site"]);
    expect(removeManagedPost).toHaveBeenCalledWith("/tmp/content", "from-notes-to-site");
  });
});
