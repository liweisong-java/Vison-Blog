import { describe, expect, it } from "vitest";
import { buildPostBundle, buildWechatArticle } from "../src/markdown";

describe("buildPostBundle", () => {
  it("rewrites SiYuan asset paths into local MDX asset paths", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-1",
        title: "From Notes to Site",
        slug: "from-notes-to-site",
        category: "tech",
        excerpt: "How a SiYuan note becomes a deployed editorial article.",
        featured: true,
        publishedAt: "2026-05-10",
        tags: ["astro", "siyuan"],
        cover: "assets/cover-hero.png"
      },
      markdown: "## Intro\n\n![Shot](assets/image-demo.png)\n"
    });

    expect(bundle.filePath).toBe("from-notes-to-site/index.mdx");
    expect(bundle.body).toContain("slug: from-notes-to-site");
    expect(bundle.body).toContain("![Shot](./image-demo.png)");
    expect(bundle.body).toContain("cover: ./cover-hero.png");
    expect(bundle.assets).toEqual([
      { sourcePath: "assets/image-demo.png", fileName: "image-demo.png" },
      { sourcePath: "assets/cover-hero.png", fileName: "cover-hero.png" }
    ]);
  });

  it("strips the original SiYuan frontmatter before writing the MDX bundle", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-1",
        title: "From Notes to Site",
        slug: "from-notes-to-site",
        category: "tech",
        excerpt: "How a SiYuan note becomes a deployed editorial article.",
        featured: true,
        publishedAt: "2026-05-10",
        tags: ["astro", "siyuan"]
      },
      markdown: `---
title: 原始标题
date: 2026-05-10T12:00:00+08:00
---

# 正文标题

正文内容
`
    });

    expect(bundle.body).toContain("title: From Notes to Site");
    expect(bundle.body).toContain("# 正文标题");
    expect(bundle.body).toContain("正文内容");
    expect(bundle.body).not.toContain("原始标题");
    expect(bundle.body).not.toContain("\nlastmod:");
    expect(bundle.body).not.toContain("\ndate:");
  });

  it("strips duplicated leading title headings that match the note title", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-1",
        title: "AI 使用心得：把模型真正接进日常工作",
        slug: "ai-usage-notes",
        category: "tech",
        excerpt: "把大模型真正接进工作流之后，我对协作方式的一些一线体会。",
        featured: true,
        publishedAt: "2026-05-11",
        tags: ["ai", "workflow"]
      },
      markdown: `---
title: AI 使用心得：把模型真正接进日常工作
date: 2026-05-11T12:42:35+08:00
---

# AI 使用心得：把模型真正接进日常工作

# AI 使用心得：把模型真正接进日常工作

正文第一段
`
    });

    expect(bundle.body).toContain("title: AI 使用心得：把模型真正接进日常工作");
    expect(bundle.body).toContain("正文第一段");
    expect(bundle.body).not.toContain("\n# AI 使用心得：把模型真正接进日常工作");
  });

  it("strips trailing zero-width characters from the published mdx body", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-1",
        title: "AI 使用心得：把模型真正接进日常工作",
        slug: "ai-usage-notes",
        category: "tech",
        excerpt: "把大模型真正接进工作流之后，我对协作方式的一些一线体会。",
        featured: true,
        publishedAt: "2026-05-11",
        tags: ["ai", "workflow"]
      },
      markdown: `# AI 使用心得：把模型真正接进日常工作

正文第一段

\u200d
`
    });

    expect(bundle.body).toContain("正文第一段");
    expect(bundle.body).not.toContain("\u200d");
  });

  it("builds a wechat-friendly markdown export", async () => {
    const article = await buildWechatArticle({
      note: {
        id: "doc-tech-1",
        title: "From Notes to Site",
        slug: "from-notes-to-site",
        category: "tech",
        excerpt: "How a SiYuan note becomes a deployed editorial article.",
        featured: true,
        publishedAt: "2026-05-10",
        tags: ["astro", "siyuan"],
        wechatReady: true
      },
      markdown: "## Intro\n\n![Shot](assets/image-demo.png)\n\nA practical walkthrough."
    });

    expect(article.filePath).toBe("from-notes-to-site.md");
    expect(article.body).toContain("# From Notes to Site");
    expect(article.body).toContain("A practical walkthrough.");
    expect(article.body).not.toContain("assets/image-demo.png");
  });

  it("builds a wechat export without repeating the article title", async () => {
    const article = await buildWechatArticle({
      note: {
        id: "doc-tech-1",
        title: "AI 使用心得：把模型真正接进日常工作",
        slug: "ai-usage-notes",
        category: "tech",
        excerpt: "把大模型真正接进工作流之后，我对协作方式的一些一线体会。",
        featured: true,
        publishedAt: "2026-05-11",
        tags: ["ai", "workflow"],
        wechatReady: true
      },
      markdown: `---
title: AI 使用心得：把模型真正接进日常工作
date: 2026-05-11T12:42:35+08:00
---

# AI 使用心得：把模型真正接进日常工作

# AI 使用心得：把模型真正接进日常工作

正文第一段
`
    });

    expect(article.body).toContain("# AI 使用心得：把模型真正接进日常工作");
    expect(article.body).toContain("正文第一段");
    expect(article.body.match(/^# AI 使用心得：把模型真正接进日常工作$/gm)).toHaveLength(1);
  });

  it("strips trailing zero-width characters from the wechat export", async () => {
    const article = await buildWechatArticle({
      note: {
        id: "doc-tech-1",
        title: "AI 使用心得：把模型真正接进日常工作",
        slug: "ai-usage-notes",
        category: "tech",
        excerpt: "把大模型真正接进工作流之后，我对协作方式的一些一线体会。",
        featured: true,
        publishedAt: "2026-05-11",
        tags: ["ai", "workflow"],
        wechatReady: true
      },
      markdown: `# AI 使用心得：把模型真正接进日常工作

正文第一段

\u200d
`
    });

    expect(article.body).toContain("正文第一段");
    expect(article.body).not.toContain("\u200d");
  });
});
