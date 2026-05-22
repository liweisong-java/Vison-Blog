import {mkdtemp, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {afterEach, describe, expect, it} from "vitest";

const tempRoots: string[] = [];

afterEach(async () => {
  for (const root of tempRoots.splice(0)) {
    await import("node:fs/promises").then(({ rm }) =>
      rm(root, { recursive: true, force: true })
    );
  }
});

describe("private dashboard generator", () => {
  it("creates content metrics from repo-like post files", async () => {
    const root = await mkdtemp(join(tmpdir(), "vision-dashboard-"));
    tempRoots.push(root);

    const postA = join(root, "tech-note.md");
    const postB = join(root, "life-note.mdx");

    await writeFile(
      postA,
      `---
title: 技术笔记
slug: tech-note
publishedAt: '2026-05-10'
category: tech
tags:
  - astro
  - ai
publish: true
---
这是一篇技术笔记，主要记录 Astro 与 AI 工作流的接入过程。`,
      "utf8"
    );

    await writeFile(
      postB,
      `---
title: 生活笔记
slug: life-note
publishedAt: '2026-04-01'
category: life
tags:
  - journal
publish: true
---
周末散步回来，顺手写下一点生活观察。`,
      "utf8"
    );

    const { buildContentDashboard } = await import("../../../scripts/generate-private-dashboard.mjs");
    const result = await buildContentDashboard([postA, postB], new Date("2026-05-12T12:00:00.000Z"));

    expect(result.totalPosts).toBe(2);
    expect(result.topTags[0]).toEqual({ tag: "ai", count: 1 });
      expect(result.totalWords).toBeGreaterThan(0);
  });
});
