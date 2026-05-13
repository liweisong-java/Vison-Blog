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

  it("keeps ordinary markdown structure intact when no Siyuan-specific block is detected", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-plain",
        title: "普通技术笔记",
        slug: "plain-note",
        category: "tech",
        excerpt: "普通段落、列表、表格、代码块不应该被兼容层改坏。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["plain"]
      },
      markdown: `# 普通技术笔记

## 小节

- 列表项
- 第二项

> 引用段落

\`\`\`ts
console.log("hello")
\`\`\`
`
    });

    expect(bundle.body).toContain("## 小节");
    expect(bundle.body).toContain("- 列表项");
    expect(bundle.body).toContain("> 引用段落");
    expect(bundle.body).toContain("```ts");
  });

  it("normalizes a collapsible Siyuan block into details/summary markup", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-fold",
        title: "折叠块示例",
        slug: "fold-example",
        category: "tech",
        excerpt: "折叠块应该稳定变成博客里的语义折叠区。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["fold"]
      },
      markdown: `::: fold 为什么这样做
这里是折叠内容
:::`
    });

    expect(bundle.body).toContain("<details");
    expect(bundle.body).toContain("<summary>为什么这样做</summary>");
    expect(bundle.body).toContain("这里是折叠内容");
  });

  it("normalizes a callout-like Siyuan block into a callout component", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-callout",
        title: "提示块示例",
        slug: "callout-example",
        category: "tech",
        excerpt: "提示块应该转成统一的 callout 语义。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["callout"]
      },
      markdown: `::: tip
这是一个提示块
:::`
    });

    expect(bundle.body).toContain('<Callout type="tip">');
    expect(bundle.body).toContain("这是一个提示块");
  });

  it("normalizes a quote-like Siyuan block into a quote component", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-quote",
        title: "引用块示例",
        slug: "quote-example",
        category: "tech",
        excerpt: "引用块应该转成统一的引用语义。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["quote"]
      },
      markdown: `::: quote 王阳明
知行合一
:::`
    });

    expect(bundle.body).toContain("<QuoteBlock");
    expect(bundle.body).toContain('source="王阳明"');
    expect(bundle.body).toContain("知行合一");
  });

  it("normalizes a simple embed block into an embed card component", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-embed",
        title: "嵌入块示例",
        slug: "embed-example",
        category: "tech",
        excerpt: "嵌入块应该转成稳定的嵌入卡语义。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["embed"]
      },
      markdown: `::: embed block-ref
这里是引用进来的片段内容
:::`
    });

    expect(bundle.body).toContain('<EmbedCard kind="block-ref">');
    expect(bundle.body).toContain("这里是引用进来的片段内容");
  });

  it("normalizes a simple columns block into a columns component", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-columns",
        title: "分栏示例",
        slug: "columns-example",
        category: "tech",
        excerpt: "分栏结构应该稳定转成博客内部的语义分栏。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["columns"]
      },
      markdown: `::: columns
::: column
左侧内容
:::
::: column
右侧内容
:::
:::`
    });

    expect(bundle.body).toContain("<Columns>");
    expect(bundle.body).toContain("左侧内容");
    expect(bundle.body).toContain("右侧内容");
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
