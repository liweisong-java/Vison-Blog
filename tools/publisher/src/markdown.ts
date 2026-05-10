import matter from "gray-matter";
import type { PublishedNote } from "./types.js";

const assetPattern = /assets\/[A-Za-z0-9._/-]+/g;

export async function buildPostBundle({
  note,
  markdown
}: {
  note: PublishedNote;
  markdown: string;
}) {
  const uniqueAssets = [...new Set(markdown.match(assetPattern) ?? [])];
  const assets = uniqueAssets.map((sourcePath) => ({
    sourcePath,
    fileName: sourcePath.split("/").at(-1) ?? sourcePath
  }));

  let rewrittenMarkdown = markdown;
  for (const asset of assets) {
    rewrittenMarkdown = rewrittenMarkdown.replaceAll(asset.sourcePath, `./${asset.fileName}`);
  }

  const body = matter.stringify(rewrittenMarkdown, {
    title: note.title,
    slug: note.slug,
    publishedAt: note.publishedAt,
    excerpt: note.excerpt,
    category: note.category,
    tags: note.tags,
    featured: note.featured,
    publish: true,
    sourceId: note.id
  });

  return {
    slug: note.slug,
    filePath: `${note.slug}/index.mdx`,
    body,
    assets
  };
}
