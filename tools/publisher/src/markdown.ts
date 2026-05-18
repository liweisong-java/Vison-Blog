import matter from "gray-matter";
import type {PublishedNote} from "./types.js";
import {normalizeSiyuanStructures} from "./markdown-normalizers.js";

const assetPattern = /assets\/[A-Za-z0-9._/-]+/g;
const assetValuePattern = /^assets\/[A-Za-z0-9._/-]+$/;

function stripSourceFrontmatter(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---\s*/, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripInvisibleCharacters(markdown: string) {
  return markdown.replace(/[\u200B-\u200D\uFEFF]/g, "");
}

const allowedMdxTagPattern =
  /<\/?(?:Callout|QuoteBlock|EmbedCard|Columns|details|summary|div|u|sub|sup|br)\b[^>]*\/?>/g;

function escapeUnsafeMdxText(markdown: string) {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeFence = !inCodeFence;
      output.push(line);
      continue;
    }

    if (inCodeFence) {
      output.push(line);
      continue;
    }

    const placeholders: string[] = [];
    const protectedLine = line.replace(allowedMdxTagPattern, (match) => {
      const token = `__MDX_SAFE_TAG_${placeholders.length}__`;
      placeholders.push(match);
      return token;
    });

    const escapedLine = protectedLine
      .replace(/</g, "&lt;")
      .replace(/\{/g, "&#123;")
      .replace(/\}/g, "&#125;");

    output.push(
      placeholders.reduce(
        (current, tag, index) => current.replace(`__MDX_SAFE_TAG_${index}__`, tag),
        escapedLine
      )
    );
  }

  return output.join("\n");
}

function stripLeadingTitleHeadings(markdown: string, title: string) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    return markdown.trimStart();
  }

  const titleHeadingPattern = new RegExp(
    `^(?:[\\u200B-\\u200D\\uFEFF\\s]*#\\s+${escapeRegExp(normalizedTitle)}\\s*\\n+)+`,
    "u"
  );

  return markdown.trimStart().replace(titleHeadingPattern, "");
}

function normalizeMarkdownBody(markdown: string, title: string) {
  return stripInvisibleCharacters(stripLeadingTitleHeadings(stripSourceFrontmatter(markdown), title)).trim();
}

function rewriteAssetPaths(markdown: string) {
  const sourceBody = normalizeMarkdownBody(markdown, "");
  const uniqueAssets = [...new Set(markdown.match(assetPattern) ?? [])];
  const assets = uniqueAssets.map((sourcePath) => ({
    sourcePath,
    fileName: sourcePath.split("/").at(-1) ?? sourcePath
  }));

  let rewrittenMarkdown = sourceBody;
  for (const asset of assets) {
    rewrittenMarkdown = rewrittenMarkdown.replaceAll(asset.sourcePath, `./${asset.fileName}`);
  }

  return {
    assets,
    rewrittenMarkdown
  };
}

export async function buildPostBundle({
  note,
  markdown
}: {
  note: PublishedNote;
  markdown: string;
}) {
  const normalizedMarkdown = normalizeMarkdownBody(markdown, note.title);
  const semanticMarkdown = normalizeSiyuanStructures(normalizedMarkdown);
  const escapedMarkdown = escapeUnsafeMdxText(semanticMarkdown);
  const { assets, rewrittenMarkdown } = rewriteAssetPaths(escapedMarkdown);
  const coverAssetPath = note.cover?.trim();
  if (
    coverAssetPath &&
    assetValuePattern.test(coverAssetPath) &&
    !assets.some((asset) => asset.sourcePath === coverAssetPath)
  ) {
    assets.push({
      sourcePath: coverAssetPath,
      fileName: coverAssetPath.split("/").at(-1) ?? coverAssetPath
    });
  }

  const frontmatter: Record<string, unknown> = {
    title: note.title,
    slug: note.slug,
    publishedAt: note.publishedAt,
    excerpt: note.excerpt,
    tags: note.tags,
    featured: note.featured,
    publish: true,
    sourceId: note.id
  };

  if (note.cover) {
    const coverAsset = assets.find((asset) => asset.sourcePath === note.cover);
    frontmatter.cover = coverAsset ? `./${coverAsset.fileName}` : note.cover;
  }

  if (note.canonicalUrl) {
    frontmatter.canonicalUrl = note.canonicalUrl;
  }

  if (typeof note.wechatReady === "boolean") {
    frontmatter.wechatReady = note.wechatReady;
  }

  const body = matter.stringify(rewrittenMarkdown, frontmatter);

  return {
    slug: note.slug,
    filePath: `${note.slug}/index.mdx`,
    body,
    assets
  };
}

export async function buildWechatArticle({
  note,
  markdown
}: {
  note: PublishedNote;
  markdown: string;
}) {
  const body = normalizeSiyuanStructures(normalizeMarkdownBody(markdown, note.title), "plain")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .trim();

  return {
    slug: note.slug,
    title: note.title,
    filePath: `${note.slug}.md`,
    body: `# ${note.title}\n\n> ${note.excerpt}\n\n${body}\n`
  };
}
