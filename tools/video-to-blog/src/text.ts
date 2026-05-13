import type { SupportedVideoPlatform } from "./types.js";

const techKeywordPattern =
  /(ai|人工智能|技术|开发|代码|编程|java|javascript|typescript|node|astro|vercel|prompt|workflow|工作流|接口|数据库|前端|后端|算法|部署|调试|性能|系统|工程|docker|云|模型)/iu;

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatTimestamp(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const hh = String(Math.floor(whole / 3600)).padStart(2, "0");
  const mm = String(Math.floor((whole % 3600) / 60)).padStart(2, "0");
  const ss = String(whole % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function inferCategory(text: string) {
  return techKeywordPattern.test(text) ? "tech" : "life";
}

export function buildArticleSlug({
  title,
  platform,
  videoId
}: {
  title: string;
  platform: SupportedVideoPlatform;
  videoId: string;
}) {
  const base = slugify(title);
  if (base) {
    return base;
  }

  return `${platform}-${videoId.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`;
}

export function cleanTitle(title: string) {
  return title
    .replace(/\s+/g, " ")
    .replace(/[【\[][^【\]]*(完整版|官方|中字|双语|视频|访谈|直播回放)[】\]]/g, "")
    .trim();
}

export function splitIntoParagraphs(text: string, targetLength = 180) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？!?])/u)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!sentences.length) {
    return [];
  }

  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > targetLength && current) {
      paragraphs.push(current.trim());
      current = sentence;
    } else {
      current += `${current ? " " : ""}${sentence}`;
    }
  }

  if (current.trim()) {
    paragraphs.push(current.trim());
  }

  return paragraphs;
}

export function sentenceHead(text: string, limit = 56) {
  const candidate = text.split(/(?<=[。！？!?])/u)[0]?.trim() ?? text.trim();
  return candidate.length > limit ? `${candidate.slice(0, limit).trim()}…` : candidate;
}

export function buildTags({
  platform,
  uploader,
  text
}: {
  platform: SupportedVideoPlatform;
  uploader?: string;
  text: string;
}) {
  const tags = new Set<string>();
  tags.add("视频整理");
  tags.add(platform === "bilibili" ? "Bilibili" : platform === "youtube" ? "YouTube" : "抖音");

  if (uploader?.trim()) {
    tags.add(uploader.trim());
  }

  const keywordMap: Array<[RegExp, string]> = [
    [/(ai|人工智能|模型|llm|agent)/iu, "AI"],
    [/(workflow|工作流|自动化)/iu, "自动化"],
    [/(java|typescript|javascript|node)/iu, "开发"],
    [/(docker|部署|服务器|运维)/iu, "部署"]
  ];

  for (const [pattern, tag] of keywordMap) {
    if (pattern.test(text)) {
      tags.add(tag);
    }
  }

  return [...tags].slice(0, 6);
}
