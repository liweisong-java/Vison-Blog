import {describe, expect, it} from "vitest";
import {buildPostBundle, buildVaultPostBundle, buildWechatArticle} from "../src/markdown";

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
      expect(bundle.body).not.toContain("\ncategory:");
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

  it("normalizes Siyuan super block column syntax into a columns component", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-super-columns",
        title: "超级块分栏示例",
        slug: "super-columns-example",
        category: "tech",
        excerpt: "思源超级块分栏应被转换成博客内部语义分栏。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["super-block"]
      },
      markdown: `{{{col
第一列内容

第二列内容
}}}`
    });

    expect(bundle.body).toContain("<Columns>");
    expect(bundle.body).toContain("第一列内容");
    expect(bundle.body).toContain("第二列内容");
  });

  it("strips standalone and inline IAL attribute markers from the published mdx body", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-ial",
        title: "IAL 清洗示例",
        slug: "ial-example",
        category: "tech",
        excerpt: "思源导出的属性标记不应原样出现在博客正文里。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["ial"]
      },
      markdown: `这一段后面跟着样式属性{: style="color: red;"}

> 引用内容
{: style="background-color: var(--b3-theme-primary-light);"}
`
    });

    expect(bundle.body).toContain("这一段后面跟着样式属性");
    expect(bundle.body).toContain("> 引用内容");
    expect(bundle.body).not.toContain('{: style="color: red;"}');
    expect(bundle.body).not.toContain('{: style="background-color: var(--b3-theme-primary-light);"}');
  });

  it("normalizes Siyuan inline html marks into stable markdown content", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-inline-marks",
        title: "内联标记示例",
        slug: "inline-marks-example",
        category: "tech",
        excerpt: "思源导出的内联 HTML 标记应被收敛成稳定的博客内容。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["inline-marks"]
      },
      markdown:
        '请查看 <span data-type="a" data-href="assets/guide.pdf">操作说明</span>，并执行 <span data-type="code">pnpm dev</span>，关注 <span data-type="strong">关键步骤</span>。<br /><span data-type="em">别漏掉环境变量</span>'
    });

    expect(bundle.body).toContain("[操作说明](./guide.pdf)");
    expect(bundle.body).toContain("`pnpm dev`");
    expect(bundle.body).toContain("**关键步骤**");
    expect(bundle.body).toContain("*别漏掉环境变量*");
    expect(bundle.body).toContain("<br />");
    expect(bundle.body).not.toContain("data-type=");
    expect(bundle.assets).toContainEqual({
      sourcePath: "assets/guide.pdf",
      fileName: "guide.pdf"
    });
  });

  it("escapes raw angle-bracket markers in ordinary text so generated mdx still builds", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-angle-marker",
        title: "Prompt 注入备忘",
        slug: "prompt-injection-notes",
        category: "tech",
        excerpt: "普通正文里的特殊标记不应该把 MDX 构建打挂。",
        featured: false,
        publishedAt: "2026-05-15",
        tags: ["security", "prompt"]
      },
      markdown:
        "Transformer 对末尾信息更敏感，攻击者会插入特殊标记（如<<END>>）诱导模型忽略前文规则。"
    });

    expect(bundle.body).toContain("&lt;&lt;END>>");
    expect(bundle.body).not.toContain("（如<<END>>）");
  });

  it("escapes raw brace markers in ordinary text so generated mdx still builds", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-brace-marker",
        title: "规则模板备忘",
        slug: "brace-marker-notes",
        category: "tech",
        excerpt: "普通正文里的花括号不能把 MDX 解析打断。",
        featured: false,
        publishedAt: "2026-05-15",
        tags: ["security", "regex"]
      },
      markdown:
        "constraint_rules = {\n    \"时间\": r\"\\d{4}年\\d{1,2}月(?:\\d{1,2}日)?|合同有效期\\d+年\",\n}"
    });

    expect(bundle.body).toContain("constraint_rules = &#123;");
    expect(bundle.body).toContain("\\d&#123;4&#125;");
  });

  it("escapes raw generic angle-bracket type syntax in ordinary text while preserving allowed mdx tags", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-generic-syntax",
        title: "泛型语法备忘",
        slug: "generic-syntax-notes",
        category: "tech",
        excerpt: "普通正文里的泛型语法不能被 MDX 当成标签。",
        featured: false,
        publishedAt: "2026-05-15",
        tags: ["java"]
      },
      markdown:
        'Java 示例：List<String> users = new ArrayList<String>();\n\n<u>保留这一段强调</u>'
    });

    expect(bundle.body).toContain("List&lt;String> users = new ArrayList&lt;String>();");
    expect(bundle.body).toContain("<u>保留这一段强调</u>");
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

  it("builds a wechat export from Siyuan semantic blocks without leaking mdx-only syntax", async () => {
    const article = await buildWechatArticle({
      note: {
        id: "doc-tech-wechat-semantic",
        title: "公众号同步示例",
        slug: "wechat-semantic-example",
        category: "tech",
        excerpt: "思源结构在公众号导出里也应保持可读。",
        featured: false,
        publishedAt: "2026-05-13",
        tags: ["wechat", "semantic"],
        wechatReady: true
      },
      markdown: `::: tip
把提示内容同步给公众号。
:::

{{{col
第一部分重点说明。

第二部分补充细节。
}}}

参考资料：<span data-type="a" data-href="https://example.com/docs">官方文档</span>`
    });

    expect(article.body).toContain("把提示内容同步给公众号。");
    expect(article.body).toContain("第一部分重点说明。");
    expect(article.body).toContain("第二部分补充细节。");
    expect(article.body).toContain("[官方文档](https://example.com/docs)");
    expect(article.body).not.toContain("<Callout");
    expect(article.body).not.toContain("<Columns>");
    expect(article.body).not.toContain("::: tip");
    expect(article.body).not.toContain("{{{col");
    expect(article.body).not.toContain("data-type=");
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

describe("buildVaultPostBundle", () => {
  it("rewrites SiYuan blocks into Quartz-friendly markdown and writes index.md", async () => {
    const bundle = await buildVaultPostBundle({
      note: {
        id: "doc-tech-1",
        title: "From Notes to Site",
        slug: "from-notes-to-site",
        excerpt: "How a SiYuan note becomes a deployed editorial article.",
        featured: true,
        publishedAt: "2026-05-10",
        tags: ["astro", "siyuan"],
        cover: "assets/cover-hero.png"
      },
      markdown: `::: tip
这是一段提示内容
:::

::: fold 为什么这样做
这里是折叠内容
:::

![Shot](assets/image-demo.png)
`
    });

    expect(bundle.filePath).toBe("from-notes-to-site/index.md");
    expect(bundle.body).toContain("title: From Notes to Site");
    expect(bundle.body).toContain("description: How a SiYuan note becomes a deployed editorial article.");
    expect(bundle.body).toContain("> [!tip]");
    expect(bundle.body).toContain("> 这是一段提示内容");
    expect(bundle.body).toContain("> [!note]- 为什么这样做");
    expect(bundle.body).toContain("![Shot](./image-demo.png)");
    expect(bundle.body).toContain("cover: ./cover-hero.png");
    expect(bundle.assets).toEqual([
      { sourcePath: "assets/image-demo.png", fileName: "image-demo.png" },
      { sourcePath: "assets/cover-hero.png", fileName: "cover-hero.png" }
    ]);
  });
});
