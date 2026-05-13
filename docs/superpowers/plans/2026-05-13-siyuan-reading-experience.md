# 思源友好型博客发布与阅读体验改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让思源中的常见写法和第一批重点特色结构能稳定发布到博客，同时把博客文章页和列表页升级成更适合中文长文阅读的思源式体验。

**Architecture:** 先在 `tools/publisher` 中增加“思源结构识别 -> 统一语义转换 -> 稳定降级”的兼容层，把思源导出的 Markdown 统一收口为博客内部语义块；再让 Astro 前端围绕这套语义块和现有普通 Markdown 内容重构文章页、首页、分类页与归档页。整个过程以测试先行，先锁发布器兼容，再锁前端阅读结果，最后跑仓库级校验。

**Tech Stack:** Astro, MDX, TypeScript, CSS, Vitest, Playwright, pnpm

---

## File Structure

- Modify: `tools/publisher/src/markdown.ts`
  - 把当前的“清洗 Markdown”升级为“基础清洗 + 思源语义规范化 + 资源路径重写”。
- Create: `tools/publisher/src/markdown-normalizers.ts`
  - 存放折叠块、提示块、块引用、嵌入块、分栏等结构的规则识别与转换函数。
- Modify: `tools/publisher/tests/markdown.test.ts`
  - 为普通 Markdown 不受影响、思源特色结构稳定转换、复杂结构平稳降级补测试。
- Modify: `tools/publisher/tests/sync.test.ts`
  - 校验兼容层接入同步命令后仍能输出有效 bundle。
- Modify: `apps/blog/src/pages/posts/[slug].astro`
  - 收紧文章页头部结构，并让文章页承接统一语义块。
- Modify: `apps/blog/src/components/ArticleToc.astro`
  - 保留桌面端 `sticky` 目录与移动端折叠目录。
- Modify: `apps/blog/src/components/PostCard.astro`
  - 把卡片信息结构收敛成更像“笔记条目”的列表入口。
- Create: `apps/blog/src/components/mdx/Callout.astro`
  - 渲染发布器生成的 `callout` 语义块。
- Create: `apps/blog/src/components/mdx/QuoteBlock.astro`
  - 渲染统一的引用内容块。
- Create: `apps/blog/src/components/mdx/EmbedCard.astro`
  - 渲染嵌入片段 / 块引用卡。
- Create: `apps/blog/src/components/mdx/Columns.astro`
  - 渲染桌面双栏、移动端堆叠的语义分栏块。
- Modify: `apps/blog/src/pages/index.astro`
  - 首页去掉解释性结构，突出最近文章与分类入口。
- Modify: `apps/blog/src/pages/category/[category].astro`
  - 技术 / 生活页改为简洁文集列表页。
- Modify: `apps/blog/src/pages/archive.astro`
  - 归档页改成时间索引型结构。
- Modify: `apps/blog/src/styles/global.css`
  - 重写文章页、语义块、列表页、归档页和移动端细节样式。
- Modify: `apps/blog/e2e/article.spec.ts`
  - 锁定文章页阅读体验与语义块的可读性。
- Modify: `apps/blog/e2e/home.spec.ts`
  - 锁定首页收敛效果。
- Create: `apps/blog/e2e/listing.spec.ts`
  - 锁定分类页与归档页的索引形态。

## Task 1: 先用测试锁住发布器兼容目标

**Files:**
- Modify: `tools/publisher/tests/markdown.test.ts`
- Modify: `tools/publisher/tests/sync.test.ts`

- [ ] **Step 1: 给普通 Markdown 回归补一个“不误伤”的基线测试**

```ts
it("keeps ordinary markdown structure intact when no SiYuan-specific block is detected", async () => {
  const bundle = await buildPostBundle({
    note: {
      id: "doc-tech-1",
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
```

- [ ] **Step 2: 为折叠块、提示块、块引用、分栏、嵌入块补失败测试**

```ts
it("normalizes a collapsible Siyuan block into details/summary markup", async () => {
  const bundle = await buildPostBundle({
    note: {
      id: "doc-tech-2",
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
      id: "doc-tech-3",
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

it("degrades a complex columns block into a safe stacked layout when needed", async () => {
  const bundle = await buildPostBundle({
    note: {
      id: "doc-tech-4",
      title: "分栏示例",
      slug: "columns-example",
      category: "tech",
      excerpt: "分栏结构应该要么稳定渲染，要么稳定降级。",
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

  expect(bundle.body).toMatch(/<Columns>|<div class="blog-columns"/);
  expect(bundle.body).toContain("左侧内容");
  expect(bundle.body).toContain("右侧内容");
});
```

- [ ] **Step 3: 为同步命令补一个“带思源特色结构也能正常写 bundle”的失败测试**

```ts
it("writes a valid bundle when the note contains Siyuan-specific structures", async () => {
  const writeBundle = vi.fn();

  await syncPublishedNotes({
    dryRun: false,
    config: baseConfig,
    client: {
      queryDocuments: vi.fn().mockResolvedValue([
        {
          id: "doc-tech-9",
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
});
```

- [ ] **Step 4: 运行发布器测试，确认这些兼容测试先失败**

Run: `pnpm --filter publisher test`

Expected: FAIL，提示当前 `buildPostBundle` 还不会把这些思源结构转成博客内部语义。

- [ ] **Step 5: 保持测试改动独立，不提前实现**

```bash
git diff -- tools/publisher/tests/markdown.test.ts tools/publisher/tests/sync.test.ts
```

Expected: 只看到测试增量，没有实现代码改动。

## Task 2: 实现发布器的思源语义兼容层

**Files:**
- Create: `tools/publisher/src/markdown-normalizers.ts`
- Modify: `tools/publisher/src/markdown.ts`

- [ ] **Step 1: 新建规范化模块，拆出基础清洗和结构转换函数**

```ts
export function stripSourceFrontmatter(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---\s*/, "");
}

export function stripInvisibleCharacters(markdown: string) {
  return markdown.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

export function normalizeSiyuanStructures(markdown: string) {
  return [
    normalizeFoldBlocks,
    normalizeCalloutBlocks,
    normalizeQuoteBlocks,
    normalizeEmbedBlocks,
    normalizeColumnsBlocks
  ].reduce((current, transform) => transform(current), markdown);
}
```

- [ ] **Step 2: 先实现折叠块和提示块的最小稳定转换**

```ts
function normalizeFoldBlocks(markdown: string) {
  return markdown.replace(
    /::: fold\s+([^\n]+)\n([\s\S]*?)\n:::/g,
    (_match, title, content) =>
      `<details class="blog-fold">\n<summary>${title.trim()}</summary>\n\n${content.trim()}\n\n</details>`
  );
}

function normalizeCalloutBlocks(markdown: string) {
  return markdown.replace(
    /::: (tip|note|warning|info)\n([\s\S]*?)\n:::/g,
    (_match, type, content) => `<Callout type="${type.trim()}">\n\n${content.trim()}\n\n</Callout>`
  );
}
```

- [ ] **Step 3: 再实现块引用、嵌入块和分栏的统一输出或保守降级**

```ts
function normalizeQuoteBlocks(markdown: string) {
  return markdown.replace(
    /::: quote(?:\s+([^\n]+))?\n([\s\S]*?)\n:::/g,
    (_match, source, content) =>
      `<QuoteBlock${source ? ` source="${source.trim()}"` : ""}>\n\n${content.trim()}\n\n</QuoteBlock>`
  );
}

function normalizeEmbedBlocks(markdown: string) {
  return markdown.replace(
    /::: embed(?:\s+([^\n]+))?\n([\s\S]*?)\n:::/g,
    (_match, kind, content) =>
      `<EmbedCard kind="${(kind || "block-ref").trim()}">\n\n${content.trim()}\n\n</EmbedCard>`
  );
}

function normalizeColumnsBlocks(markdown: string) {
  return markdown.replace(
    /::: columns\n([\s\S]*?)\n:::/g,
    (_match, content) => `<Columns>\n\n${content.trim()}\n\n</Columns>`
  );
}
```

- [ ] **Step 4: 把兼容层接进 `buildPostBundle` 的生成顺序**

```ts
const normalizedMarkdown = normalizeMarkdownBody(markdown, note.title);
const semanticMarkdown = normalizeSiyuanStructures(normalizedMarkdown);
const { assets, rewrittenMarkdown } = rewriteAssetPaths(semanticMarkdown);
```

- [ ] **Step 5: 运行发布器测试，确认兼容层通过**

Run: `pnpm --filter publisher test`

Expected: PASS，普通 Markdown 回归和第一批思源结构兼容测试都通过。

## Task 3: 让博客前端认识新的语义块

**Files:**
- Create: `apps/blog/src/components/mdx/Callout.astro`
- Create: `apps/blog/src/components/mdx/QuoteBlock.astro`
- Create: `apps/blog/src/components/mdx/EmbedCard.astro`
- Create: `apps/blog/src/components/mdx/Columns.astro`
- Modify: `apps/blog/src/pages/posts/[slug].astro`
- Modify: `apps/blog/src/styles/global.css`

- [ ] **Step 1: 新建 `Callout.astro`，承接发布器输出的提示块语义**

```astro
---
const { type = "note" } = Astro.props;
---

<aside class={`mdx-callout mdx-callout--${type}`}>
  <div class="mdx-callout__body">
    <slot />
  </div>
</aside>
```

- [ ] **Step 2: 新建引用块、嵌入卡和分栏组件**

```astro
--- // QuoteBlock.astro
const { source } = Astro.props;
---

<blockquote class="mdx-quote-block">
  <div class="mdx-quote-block__content">
    <slot />
  </div>
  {source && <footer class="mdx-quote-block__source">{source}</footer>}
</blockquote>
```

```astro
--- // EmbedCard.astro
const { kind = "block-ref" } = Astro.props;
---

<section class={`mdx-embed-card mdx-embed-card--${kind}`}>
  <slot />
</section>
```

```astro
--- // Columns.astro
---

<section class="mdx-columns">
  <slot />
</section>
```

- [ ] **Step 3: 让文章页渲染时能消费这些 MDX 语义块**

```astro
import Callout from "../../components/mdx/Callout.astro";
import QuoteBlock from "../../components/mdx/QuoteBlock.astro";
import EmbedCard from "../../components/mdx/EmbedCard.astro";
import Columns from "../../components/mdx/Columns.astro";
```

```astro
const { Content, headings } = await render(post, {
  components: {
    Callout,
    QuoteBlock,
    EmbedCard,
    Columns
  }
});
```

- [ ] **Step 4: 给这些语义块补最小可读样式，并让移动端安全降级**

```css
.mdx-callout,
.mdx-embed-card,
.mdx-quote-block {
  margin: 1.4em 0;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 88%, black);
}

.mdx-columns {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 760px) {
  .mdx-columns {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: 跑博客测试，确认新的 MDX 语义块不会破坏内容渲染**

Run: `pnpm --filter blog test`

Expected: PASS，内容测试和展示层测试通过。

## Task 4: 锁住文章页与列表页的目标体验

**Files:**
- Modify: `apps/blog/e2e/article.spec.ts`
- Modify: `apps/blog/e2e/home.spec.ts`
- Create: `apps/blog/e2e/listing.spec.ts`

- [ ] **Step 1: 改写文章页 e2e，锁住“阅读优先 + 语义块可读”**

```ts
import { expect, test } from "@playwright/test";

test("article page keeps a calm reading-first shell", async ({ page }) => {
  await page.goto("/posts/on-dao-notes/");

  await expect(page.getByRole("heading", { name: "天道・五台山论道" })).toBeVisible();
  await expect(page.locator(".article-summary")).toBeVisible();
  await expect(page.locator(".article-header").getByText("正文", { exact: true })).toHaveCount(0);
  await expect(page.locator(".toc-shell--desktop")).toBeVisible();
});

test("article page renders mdx semantic blocks without breaking the flow", async ({ page }) => {
  await page.goto("/posts/siyuan-compat-sample/");

  await expect(page.locator(".mdx-callout")).toBeVisible();
  await expect(page.locator(".mdx-columns")).toBeVisible();
  await expect(page.locator(".mdx-embed-card")).toBeVisible();
});
```

- [ ] **Step 2: 改写首页 e2e，锁住首页收短后的内容入口形态**

```ts
import { expect, test } from "@playwright/test";

test("homepage leads with content instead of explanation copy", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "伟松的博客" })).toBeVisible();
  await expect(page.getByText(/这里没有刻意区分“输出”和“生活”/i)).toHaveCount(0);
  await expect(page.locator(".home-lead .lead-entry")).toBeVisible();
  await expect(page.locator(".post-list .post-card").first()).toBeVisible();
});
```

- [ ] **Step 3: 新增分类页 / 归档页 e2e，锁住“只保留索引”**

```ts
import { expect, test } from "@playwright/test";

test("category pages render as concise collections", async ({ page }) => {
  await page.goto("/category/life/");

  await expect(page.getByRole("heading", { name: "生活" })).toBeVisible();
  await expect(page.getByText(/慢一点的观察/i)).toHaveCount(0);
  await expect(page.locator(".category-posts .post-card").first()).toBeVisible();
});

test("archive page behaves like a time index", async ({ page }) => {
  await page.goto("/archive/");

  await expect(page.getByRole("heading", { name: "归档" })).toBeVisible();
  await expect(page.getByText(/按年份顺着往下看/i)).toHaveCount(0);
  await expect(page.locator(".archive-year").first()).toBeVisible();
});
```

- [ ] **Step 4: 运行 e2e，确认前端体验目标先被测试锁住**

Run: `pnpm --filter blog e2e -- article.spec.ts home.spec.ts listing.spec.ts`

Expected: FAIL，提示当前模板或样式仍未达到新目标。

- [ ] **Step 5: 提交测试锁定结果**

```bash
git add apps/blog/e2e/article.spec.ts apps/blog/e2e/home.spec.ts apps/blog/e2e/listing.spec.ts
git commit -m "test(blog): 锁定思源友好型阅读与列表体验"
```

Expected: 生成一条只包含前端体验测试的提交。

## Task 5: 重构文章页与列表页结构

**Files:**
- Modify: `apps/blog/src/pages/posts/[slug].astro`
- Modify: `apps/blog/src/components/ArticleToc.astro`
- Modify: `apps/blog/src/components/PostCard.astro`
- Modify: `apps/blog/src/pages/index.astro`
- Modify: `apps/blog/src/pages/category/[category].astro`
- Modify: `apps/blog/src/pages/archive.astro`

- [ ] **Step 1: 收紧文章页页头，只保留文档式起始信息**

```astro
<header class="article-header">
  <div class="article-kicker">
    <span>{categoryLabel}</span>
    <span>{formatDisplayDate(post.data.publishedAt)}</span>
  </div>
  <h1>{post.data.title}</h1>
  {articleLead && <p class="article-summary">{articleLead}</p>}
</header>
```

- [ ] **Step 2: 让目录继续作为轻量导航壳存在**

```astro
{
  headings.length > 0 &&
    (variant === "mobile" ? (
      <details class="toc-shell toc-shell--mobile">
        <summary>本文目录</summary>
        <nav aria-label="目录">
          <ol class="toc-list">...</ol>
        </nav>
      </details>
    ) : (
      <aside class="toc-shell toc-shell--desktop" aria-label="目录">
        <p class="toc-shell__label">目录</p>
        <ol class="toc-list">...</ol>
      </aside>
    ))
}
```

- [ ] **Step 3: 改首页和文章卡片，让站点更像内容索引**

```astro
<section class="home-intro">
  <div class="home-intro__main">
    <h1>{siteConfig.title}</h1>
  </div>
  <div class="home-intro__meta">
    <p>最近更新：{posts[0] ? formatDisplayDate(posts[0].data.publishedAt) : "暂无文章"}</p>
    <p>累计文章：{posts.length} 篇</p>
  </div>
</section>
```

```astro
<article class="post-card" data-category={post.data.category} data-search-card>
  <div class="post-card-meta">
    <span class="post-meta">{categoryLabel}</span>
    <span class="post-meta">{formatDisplayDate(post.data.publishedAt)}</span>
  </div>
  <h3 class="post-card-title"><a href={`/posts/${post.data.slug}/`}>{post.data.title}</a></h3>
  <p class="post-card-excerpt">{post.data.excerpt}</p>
</article>
```

- [ ] **Step 4: 改技术 / 生活页和归档页，彻底移除解释型说明文案**

```astro
<section class="page-intro page-intro--compact">
  <h1>{copy.label}</h1>
  <p class="post-meta">共 {posts.length} 篇</p>
</section>
```

```astro
<section class="page-intro page-intro--compact">
  <h1>归档</h1>
  <p class="post-meta">共 {totalPosts} 篇</p>
</section>
```

- [ ] **Step 5: 跑 e2e，确认页面结构层已经满足目标**

Run: `pnpm --filter blog e2e -- article.spec.ts home.spec.ts listing.spec.ts`

Expected: DOM 结构相关断言通过；如果还有失败，应集中在样式层。

## Task 6: 重写样式并做移动端收口

**Files:**
- Modify: `apps/blog/src/styles/global.css`

- [ ] **Step 1: 先重写文章页外壳和正文节奏**

```css
.article-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding-top: 24px;
}

.article-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 44px;
  align-items: start;
}

.prose {
  font-size: 17px;
  line-break: strict;
}

.prose p,
.prose li {
  line-height: 1.95;
}
```

- [ ] **Step 2: 再补语义块样式，让 callout / quote / embed / columns 都稳定可读**

```css
.mdx-callout,
.mdx-quote-block,
.mdx-embed-card {
  margin: 1.4em 0;
  padding: 18px 20px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 88%, black);
}

.mdx-columns {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

- [ ] **Step 3: 收首页、分类页、归档页的视觉层级**

```css
.category-posts .post-card {
  padding: 22px 0 24px;
}

.archive-list li a {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding-top: 15px;
  border-top: 1px solid var(--line);
}
```

- [ ] **Step 4: 做移动端收口，确保分栏堆叠、代码块滚动、目录降权**

```css
@media (max-width: 980px) {
  .article-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .toc-shell--desktop {
    display: none;
  }

  .toc-shell--mobile {
    display: block;
  }
}

@media (max-width: 760px) {
  .mdx-columns {
    grid-template-columns: 1fr;
  }

  .archive-list li a {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
```

- [ ] **Step 5: 跑 blog e2e，确认桌面端和移动端都稳定**

Run: `pnpm --filter blog e2e`

Expected: PASS

## Task 7: 跑完整校验并整理提交

**Files:**
- Modify: `tools/publisher/src/markdown.ts`
- Create: `tools/publisher/src/markdown-normalizers.ts`
- Modify: `tools/publisher/tests/markdown.test.ts`
- Modify: `tools/publisher/tests/sync.test.ts`
- Create: `apps/blog/src/components/mdx/Callout.astro`
- Create: `apps/blog/src/components/mdx/QuoteBlock.astro`
- Create: `apps/blog/src/components/mdx/EmbedCard.astro`
- Create: `apps/blog/src/components/mdx/Columns.astro`
- Modify: `apps/blog/src/pages/posts/[slug].astro`
- Modify: `apps/blog/src/components/ArticleToc.astro`
- Modify: `apps/blog/src/components/PostCard.astro`
- Modify: `apps/blog/src/pages/index.astro`
- Modify: `apps/blog/src/pages/category/[category].astro`
- Modify: `apps/blog/src/pages/archive.astro`
- Modify: `apps/blog/src/styles/global.css`
- Modify: `apps/blog/e2e/article.spec.ts`
- Modify: `apps/blog/e2e/home.spec.ts`
- Create: `apps/blog/e2e/listing.spec.ts`

- [ ] **Step 1: 跑发布器测试**

Run: `pnpm --filter publisher test`

Expected: PASS

- [ ] **Step 2: 跑博客单元测试**

Run: `pnpm --filter blog test`

Expected: PASS

- [ ] **Step 3: 跑博客端到端测试**

Run: `pnpm --filter blog e2e`

Expected: PASS

- [ ] **Step 4: 跑仓库级检查并做人工回归**

Run: `pnpm check`

Expected: PASS，`astro check` 与 `pnpm --filter publisher build` 都通过。

Run: `pnpm dev`

Expected: 人工至少检查：

- `/`
- `/posts/on-dao-notes/`
- `/category/life/`
- `/archive/`
- 一篇包含折叠块、提示块、嵌入块、分栏的样本文章

- [ ] **Step 5: 提交并推送最终改造**

```bash
git add tools/publisher/src/markdown.ts \
  tools/publisher/src/markdown-normalizers.ts \
  tools/publisher/tests/markdown.test.ts \
  tools/publisher/tests/sync.test.ts \
  apps/blog/src/components/mdx/Callout.astro \
  apps/blog/src/components/mdx/QuoteBlock.astro \
  apps/blog/src/components/mdx/EmbedCard.astro \
  apps/blog/src/components/mdx/Columns.astro \
  apps/blog/src/pages/posts/[slug].astro \
  apps/blog/src/components/ArticleToc.astro \
  apps/blog/src/components/PostCard.astro \
  apps/blog/src/pages/index.astro \
  apps/blog/src/pages/category/[category].astro \
  apps/blog/src/pages/archive.astro \
  apps/blog/src/styles/global.css \
  apps/blog/e2e/article.spec.ts \
  apps/blog/e2e/home.spec.ts \
  apps/blog/e2e/listing.spec.ts
git commit -m "feat(blog): 打通思源语义兼容与中文阅读体验"
git push origin master
```

Expected: 生成一条完整的功能提交并推送到 `master`。
