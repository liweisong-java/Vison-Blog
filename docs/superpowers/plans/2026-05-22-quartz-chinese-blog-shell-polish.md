# Quartz 中文博客壳二次打磨实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Quartz 公开站首页与文章页更接近中文个人博客，而不是知识库/文档站。

**Architecture:** 保留现有思源内容同步、Quartz 构建与 Astro 私有页链路，只调整 Quartz 的公开页布局组件、内容头部编排和样式覆盖层。通过 UI 合同测试锁住关键排版约束，再用本地构建与浏览器预览验证桌面端和移动端观感。

**Tech Stack:** Quartz 4、Preact、SCSS、Vitest、pnpm、in-app browser

---

### Task 1: 锁定新的首页与文章页排版约束

**Files:**
- Modify: `apps/quartz/tests/ui-contracts.test.ts`
- Test: `apps/quartz/tests/ui-contracts.test.ts`

- [ ] **Step 1: 写出新的失败测试**

```ts
it("keeps article pages free from breadcrumb and tag chrome", async () => {
  const layout = await readFile(resolve(process.cwd(), "quartz.layout.ts"), "utf8")

  expect(layout).not.toContain("Component.Breadcrumbs({")
  expect(layout).not.toContain("Component.TagList()")
})

it("keeps the public shell from using docs-style highlighted internal links or boxed article chrome", async () => {
  const customScss = await readFile(resolve(process.cwd(), "quartz/styles/custom.scss"), "utf8")

  expect(customScss).toContain(".center article.article-shell a.internal:not(.tag-link)")
  expect(customScss).toContain("background-color: transparent")
  expect(customScss).toContain(".center article.article-shell {")
  expect(customScss).toContain("border: 0")
})
```

- [ ] **Step 2: 运行测试，确认先失败**

Run: `pnpm --filter quartz test -- tests/ui-contracts.test.ts`
Expected: FAIL，因为当前 `quartz.layout.ts` 仍包含 `Breadcrumbs` / `TagList`，且 `custom.scss` 还没有新的阅读样式覆盖。

- [ ] **Step 3: 再补首页列表的契约**

```ts
it("keeps the home feed closer to a blog index than a wrapped tool list", async () => {
  const homeFeedStyle = await readFile(resolve(process.cwd(), "quartz/components/styles/homeFeed.scss"), "utf8")

  expect(homeFeedStyle).toContain("white-space: nowrap")
  expect(homeFeedStyle).toContain("text-overflow: ellipsis")
})
```

- [ ] **Step 4: 再次运行测试，确认失败原因正确**

Run: `pnpm --filter quartz test -- tests/ui-contracts.test.ts`
Expected: FAIL，因为当前首页标题还是两行夹断样式。

- [ ] **Step 5: 提交前检查计划与实现边界一致**

```bash
git diff -- docs/superpowers/specs/2026-05-22-quartz-chinese-blog-shell-design.md docs/superpowers/plans/2026-05-22-quartz-chinese-blog-shell-polish.md
```

Expected: 只体现本轮“公开页壳二次打磨”的范围，没有跑到同步链路或部署链路。

### Task 2: 精简文章页头部与正文阅读壳

**Files:**
- Modify: `apps/quartz/quartz.layout.ts`
- Modify: `apps/quartz/quartz/styles/custom.scss`
- Test: `apps/quartz/tests/ui-contracts.test.ts`

- [ ] **Step 1: 最小化文章页头部组件**

```ts
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
  ],
  left: [],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
  ],
}
```

- [ ] **Step 2: 让正文从“卡片”回到“阅读稿面”**

```scss
.center article.article-shell {
  border: 0;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
}

.center article.article-shell a.internal:not(.tag-link) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  line-height: inherit;
}
```

- [ ] **Step 3: 弱化目录组件的文档站感**

```scss
.article-toc-shell {
  top: 6.4rem;
  border: 0;
  background: transparent;
  border-radius: 0;
  padding: 0;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm --filter quartz test -- tests/ui-contracts.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/quartz/quartz.layout.ts apps/quartz/quartz/styles/custom.scss apps/quartz/tests/ui-contracts.test.ts
git commit -m "refactor: 精简 Quartz 文章页阅读壳"
```

### Task 3: 把首页列表调成中文博客流

**Files:**
- Modify: `apps/quartz/quartz/components/HomeFeed.tsx`
- Modify: `apps/quartz/quartz/components/styles/homeFeed.scss`
- Modify: `content/vault/posts/index.md`
- Test: `apps/quartz/tests/ui-contracts.test.ts`

- [ ] **Step 1: 保持首页只呈现必要文案**

```md
---
title: 伟松的博客
description: 一些正在公开发生的记录。
---

# 伟松的博客

一些正在公开发生的记录。
```

- [ ] **Step 2: 让首页引导语更像博客索引而不是工具区**

```tsx
<header class="home-shell__intro">
  <p class="home-shell__eyebrow">最近更新</p>
</header>
```

- [ ] **Step 3: 调整列表为单行标题 + 轻量日期**

```scss
.home-feed-title {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media all and (max-width: 800px) {
  .home-feed-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
  }
}
```

- [ ] **Step 4: 运行 Quartz UI 测试**

Run: `pnpm --filter quartz test -- tests/ui-contracts.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add apps/quartz/quartz/components/HomeFeed.tsx apps/quartz/quartz/components/styles/homeFeed.scss content/vault/posts/index.md apps/quartz/tests/ui-contracts.test.ts
git commit -m "feat: 调整 Quartz 首页为中文博客流"
```

### Task 4: 构建与真实预览验收

**Files:**
- Verify: `apps/quartz/public`
- Verify: `site-dist`

- [ ] **Step 1: 运行完整测试**

Run: `pnpm test`
Expected: 所有 workspace 测试通过。

- [ ] **Step 2: 运行构建**

Run: `pnpm build`
Expected: `apps/quartz/public` 与 `site-dist` 更新成功。

- [ ] **Step 3: 本地预览首页与文章页**

Run: `python3 -m http.server 4311`
Expected: 可以访问 `http://127.0.0.1:4311/` 与 `http://127.0.0.1:4311/on-dao-notes/`。

- [ ] **Step 4: 浏览器验收桌面端与移动端**

```text
检查项：
1. 首页标题与列表不再出现整块浅色高亮。
2. 桌面端文章页正文不再包在重卡片里。
3. 目录存在但不抢正文注意力。
4. 移动端首页列表仍能识别为可点击条目。
```

- [ ] **Step 5: 汇总并按需要推送**

```bash
git status --short
git push origin master
```

Expected: 工作树干净，当前修改已推送。
