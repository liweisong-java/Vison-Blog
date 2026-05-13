import matter from "gray-matter";
import { cleanTitle, buildArticleSlug, buildTags, formatTimestamp, inferCategory, sentenceHead, splitIntoParagraphs } from "./text.js";
import { getPlatformLabel } from "./platform.js";
import type { ComposedArticle, Transcript, VideoMetadata } from "./types.js";

function buildTakeaways(paragraphs: string[]) {
  return paragraphs.slice(0, 4).map((paragraph) => sentenceHead(paragraph, 72));
}

function buildTranscriptDetails(transcript: Transcript) {
  const lines = transcript.segments.slice(0, 120).map((segment) => `- [${formatTimestamp(segment.start)}] ${segment.text}`);
  return [
    '<details class="blog-fold">',
    "<summary>原始 transcript</summary>",
    "",
    ...lines,
    "",
    "</details>"
  ].join("\n");
}

export function composeVideoArticle({
  metadata,
  transcript,
  slugOverride,
  now = () => new Date().toISOString()
}: {
  metadata: VideoMetadata;
  transcript: Transcript;
  slugOverride?: string;
  now?: () => string;
}): ComposedArticle {
  const title = cleanTitle(metadata.title) || metadata.title;
  const slug =
    slugOverride ??
    buildArticleSlug({
      title,
      platform: metadata.platform,
      videoId: metadata.id
    });
  const baseText = `${metadata.title}\n${metadata.description ?? ""}\n${transcript.text}`.trim();
  const paragraphs = splitIntoParagraphs(transcript.text, 220);
  const takeaways = buildTakeaways(paragraphs);
  const excerpt = sentenceHead(paragraphs[0] ?? transcript.text, 120);
  const category = inferCategory(baseText);
  const tags = buildTags({
    platform: metadata.platform,
    uploader: metadata.uploader,
    text: baseText
  });
  const sections = paragraphs.map((paragraph, index) => `### 话题 ${index + 1}\n\n${paragraph}`);
  const publishedAt = metadata.publishedAt ?? now().slice(0, 10);

  const body = matter.stringify(
    [
      "> 这篇文章根据公开视频内容自动整理而成，保留原始观点，并按博客阅读方式重新编排。",
      "",
      "## 一句话概览",
      "",
      excerpt,
      "",
      "## 核心要点",
      "",
      ...takeaways.map((item) => `- ${item}`),
      "",
      "## 视频信息",
      "",
      `- 平台：${getPlatformLabel(metadata.platform)}`,
      metadata.uploader ? `- 作者：${metadata.uploader}` : "",
      metadata.publishedAt ? `- 发布时间：${metadata.publishedAt}` : "",
      `- 原链接：${metadata.webpageUrl}`,
      `- 整理方式：${transcript.source === "subtitle" ? "字幕整理" : "语音转写整理"}`,
      "",
      "## 正文整理",
      "",
      ...sections,
      "",
      buildTranscriptDetails(transcript),
      "",
      "## 说明",
      "",
      "这篇文章来自公开视频内容整理，不代表对原视频的逐字逐句还原。若你更关心上下文，请回到原视频继续观看。"
    ]
      .filter(Boolean)
      .join("\n"),
    {
      title,
      slug,
      publishedAt,
      excerpt,
      category,
      tags,
      featured: false,
      publish: true,
      canonicalUrl: metadata.webpageUrl,
      wechatReady: false
    }
  );

  return {
    slug,
    title,
    body,
    canonicalUrl: metadata.webpageUrl
  };
}
