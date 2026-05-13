import matter from "gray-matter";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncPublishedNotes } from "../src/commands/sync";
import { createInitialPublisherState } from "../src/publisher-state.js";

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

  it("does not block the whole sync when a short Chinese note needs a concise excerpt", async () => {
    const result = await syncPublishedNotes({
      dryRun: true,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-short-1",
            content: "这是一个博客",
            hpath: "/这是一个博客",
            updated: "20260511170947"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "这是一个博客"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([
        { slug: "ai-usage-notes", sourceId: "20260511124235-6ixd4qy", directory: "/tmp/content/ai-usage-notes" }
      ]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn(),
      triggerDeploy: vi.fn()
    });

    expect(result.invalid).toEqual([]);
    expect(result.written).toEqual(["post-short-1"]);
    expect(result.removed).toEqual(["ai-usage-notes"]);
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

  it("falls back to a generated excerpt when an old custom excerpt is too short", async () => {
    const writeBundle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "20260511124027-9cky1bo",
            content: "天道・五台山论道",
            hpath: "/天道・五台山论道",
            updated: "20260511141118"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "custom-blog-pub": "true",
          "custom-blog-cat": "life",
          "custom-blog-slug": "on-dao-notes",
          "custom-blog-excerpt": "天道⚡️五台山论道"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "这是一篇关于五台山论道的长文记录，包含完整背景、释义和对话整理，足够生成可靠摘要。"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(result.written).toEqual(["on-dao-notes"]);
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        body: expect.stringContaining("这是一篇关于五台山论道的长文记录")
      })
    );
  });

  it("cleans zero-width characters from a generated excerpt before writing the bundle", async () => {
    const writeBundle = vi.fn();

    await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-zero-width-1",
            content: "这是一个博客",
            hpath: "/这是一个博客",
            updated: "20260511170947"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "这是一个博客\u200d 你好\u200b"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    const writtenBundle = writeBundle.mock.calls[0]?.[1] as { body: string };
    const parsed = matter(writtenBundle.body);

    expect(parsed.data.excerpt).toBe("这是一个博客 你好");
    expect(parsed.data.excerpt).not.toContain("\u200d");
    expect(parsed.data.excerpt).not.toContain("\u200b");
  });

  it("falls back to the note title when a generated excerpt is mostly symbol noise", async () => {
    const writeBundle = vi.fn();

    await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-symbol-noise-1",
            content: "这是第二个博客",
            hpath: "/这是第二个博客",
            updated: "20260513142030"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "√√√√√√√√"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    const writtenBundle = writeBundle.mock.calls[0]?.[1] as { body: string };
    const parsed = matter(writtenBundle.body);

    expect(parsed.data.excerpt).toBe("这是第二个博客");
    expect(parsed.data.excerpt).not.toContain("√");
  });

  it("publishes notebook notes by default and falls back to a safe generated slug for Chinese titles", async () => {
    const writeBundle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "20260511124027-9cky1bo",
            content: "天道・五台山论道",
            hpath: "/天道・五台山论道",
            updated: "20260511141118"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "这是一篇关于五台山论道的长文记录，包含完整背景、释义和对话整理，足够生成可靠摘要。"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(result.written).toEqual(["post-9cky1bo"]);
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        filePath: "post-9cky1bo/index.mdx",
        body: expect.stringContaining("category: life")
      })
    );
  });

  it("supports both configured attrs and custom-prefixed attrs from SiYuan", async () => {
    const writeBundle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "20260511124027-9cky1bo",
            content: "天道・五台山论道",
            hpath: "/生活/天道・五台山论道",
            updated: "20260511141118"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "custom-blog-pub": "true",
          "custom-blog-cat": "life",
          "custom-blog-slug": "on-dao-notes",
          "custom-blog-excerpt": "天道与五台山论道的一次完整整理。",
          "custom-blog-date": "2026-04-11",
          "custom-blog-tags": "life,notes",
          "custom-blog-top": "false",
          "custom-blog-wechat": "true"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "这是一篇关于五台山论道的长文记录，包含完整背景、释义和对话整理。"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(result.written).toEqual(["on-dao-notes"]);
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        filePath: "on-dao-notes/index.mdx",
        body: expect.stringContaining("publishedAt: '2026-04-11'")
      })
    );
  });

  it("infers a tech category from the title and body when the category attr is missing", async () => {
    const writeBundle = vi.fn();

    await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-auto-1",
            content: "AI 工作流复盘",
            hpath: "/AI 工作流复盘",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "这篇笔记记录了 AI、提示词、代码协作和发布工作流，适合作为技术文章发布。"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        body: expect.stringContaining("category: tech")
      })
    );
  });

  it("keeps the existing managed slug when the note is republished without a slug attr", async () => {
    const writeBundle = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "AI 使用心得：把模型真正接进日常工作",
            hpath: "/AI 使用心得：把模型真正接进日常工作",
            updated: "20260511124539"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "这篇文章记录了 AI 在真实代码协作、文档起草和工作流复盘里的长期使用感受。"
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([
        {
          slug: "ai-usage-notes",
          sourceId: "doc-tech-1",
          directory: "/tmp/content/ai-usage-notes"
        }
      ]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(result.written).toEqual(["ai-usage-notes"]);
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        filePath: "ai-usage-notes/index.mdx"
      })
    );
  });

  it("skips draft-like notes even when no publish attr is present", async () => {
    const exportMarkdown = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: true,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-draft-1",
            content: "草稿：还没写完",
            hpath: "/草稿/还没写完",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn(),
      triggerDeploy: vi.fn()
    });

    expect(result.written).toEqual([]);
    expect(exportMarkdown).not.toHaveBeenCalled();
  });

  it("lets an explicit false publish attr opt a note out of publishing", async () => {
    const exportMarkdown = vi.fn();

    const result = await syncPublishedNotes({
      dryRun: true,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-hidden-1",
            content: "不对外发布的内部记录",
            hpath: "/不对外发布的内部记录",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "blog-pub": "false"
        }),
        exportMarkdown
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn(),
      triggerDeploy: vi.fn()
    });

    expect(result.written).toEqual([]);
    expect(exportMarkdown).not.toHaveBeenCalled();
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

  it("writes a valid bundle when a note contains Siyuan-specific semantic blocks", async () => {
    const writeBundle = vi.fn();

    await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-semantic",
            content: "思源结构示例",
            hpath: "/思源结构示例",
            updated: "20260513120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: `::: tip
提示内容
:::

::: fold 细节
折叠内容
:::`
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        body: expect.stringContaining("<Callout")
      })
    );
    expect(writeBundle).toHaveBeenCalledWith(
      "/tmp/content",
      expect.objectContaining({
        body: expect.stringContaining("<details")
      })
    );
  });

  it("generates a clean excerpt from Siyuan semantic blocks and IAL markers", async () => {
    const writeBundle = vi.fn();

    await syncPublishedNotes({
      dryRun: false,
      config: baseConfig,
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-excerpt-clean",
            content: "思源摘要清洗示例",
            hpath: "/思源摘要清洗示例",
            updated: "20260513120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({}),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: `{{{col
第一列这部分解释如何把 AI 工作流真正接进日常开发。

第二列补充测试、部署和复盘要点。
}}}
{: style="color: red;"}`
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle,
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: false }),
      triggerDeploy: vi.fn()
    });

    const writtenBundle = writeBundle.mock.calls[0]?.[1] as { body: string };
    const parsed = matter(writtenBundle.body);

    expect(parsed.data.excerpt).toContain("第一列这部分解释如何把 AI 工作流真正接进日常开发");
    expect(parsed.data.excerpt).toContain("第二列补充测试、部署和复盘要点");
    expect(parsed.data.excerpt).not.toContain("{{{col");
    expect(parsed.data.excerpt).not.toContain("{:");
    expect(parsed.data.excerpt).not.toContain("<Columns>");
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

  it("updates the publisher dashboard state after a successful sync", async () => {
    const writeState = vi.fn();

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
          "blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "blog-top": "true",
          "blog-slug": "from-notes-to-site",
          "blog-tags": "astro,siyuan",
          "blog-date": "2026-05-10"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\nA practical walkthrough for publishing from notes."
        })
      },
      collectContentEntries: vi.fn().mockResolvedValue([]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn().mockResolvedValue({ committed: true }),
      triggerDeploy: vi.fn(),
      publisherState: {
        readState: vi.fn().mockResolvedValue(createInitialPublisherState()),
        writeState,
        now: () => "2026-05-12T12:00:00.000Z"
      }
    });

    expect(writeState).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "healthy",
        lastSuccessAt: "2026-05-12T12:00:00.000Z",
        pendingCount: 0
      })
    );
  });

  it("updates the publisher dashboard state after a failed sync", async () => {
    const writeState = vi.fn();

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
        triggerDeploy: vi.fn(),
        publisherState: {
          readState: vi.fn().mockResolvedValue(createInitialPublisherState()),
          writeState,
          now: () => "2026-05-12T12:10:00.000Z"
        }
      })
    ).rejects.toThrow(/Broken Note/);

    expect(writeState).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        lastFailureAt: "2026-05-12T12:10:00.000Z",
        pendingCount: 1
      })
    );
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
