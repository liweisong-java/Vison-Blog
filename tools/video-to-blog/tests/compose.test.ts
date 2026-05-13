import { describe, expect, it } from "vitest";
import { composeVideoArticle } from "../src/compose";

describe("composeVideoArticle", () => {
  it("creates an mdx article compatible with the blog frontmatter schema", () => {
    const article = composeVideoArticle({
      metadata: {
        id: "abc123",
        title: "从视频到博客的自动整理",
        webpageUrl: "https://www.youtube.com/watch?v=abc123",
        platform: "youtube",
        uploader: "Vison",
        publishedAt: "2026-05-14",
        subtitles: [],
        automaticSubtitles: []
      },
      transcript: {
        source: "subtitle",
        language: "zh",
        text: "今天我们来聊，如何把视频里的信息整理成一篇适合阅读的博客。重点不是逐字稿，而是提炼结构和核心观点。",
        segments: [
          {
            start: 0,
            end: 5,
            text: "今天我们来聊，如何把视频里的信息整理成一篇适合阅读的博客。"
          },
          {
            start: 5,
            end: 10,
            text: "重点不是逐字稿，而是提炼结构和核心观点。"
          }
        ]
      },
      now: () => "2026-05-14T00:00:00.000Z"
    });

    expect(article.slug).toBe("youtube-abc123");
    expect(article.body).toContain("title: 从视频到博客的自动整理");
    expect(article.body).toContain("canonicalUrl: 'https://www.youtube.com/watch?v=abc123'");
    expect(article.body).toContain("## 核心要点");
    expect(article.body).toContain("原始 transcript");
  });
});
