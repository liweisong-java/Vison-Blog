import {z} from "zod";

function countReadableUnits(value: string) {
  return (value.match(/[\p{Script=Han}]|[A-Za-z0-9]+/gu) ?? []).length;
}

export const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  publishedAt: z.coerce.date(),
  excerpt: z
    .string()
    .max(220)
    .refine((value) => countReadableUnits(value) >= 4, "excerpt must contain enough readable content"),
    category: z.enum(["tech", "life"]).optional(),
  tags: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  publish: z.boolean().default(true),
  sourceId: z.string().min(1).optional(),
  cover: z.string().optional(),
  canonicalUrl: z.url().optional(),
  wechatReady: z.boolean().default(false)
});

export function sortPublishedPosts<T extends { data: { publishedAt: Date } }>(posts: T[]) {
  return [...posts].sort(
    (left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime()
  );
}

export function getAllTags<T extends { data: { tags: string[] } }>(posts: T[]) {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort((left, right) =>
    left.localeCompare(right)
  );
}

export function getTagSummaries<T extends { data: { tags: string[] } }>(posts: T[]) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => left.tag.localeCompare(right.tag));
}

export function splitFeaturedPosts<T extends { data: { featured: boolean } }>(posts: T[]) {
  return [posts.filter((post) => post.data.featured), posts.filter((post) => !post.data.featured)] as const;
}

export function getArchiveGroups<T extends { data: { publishedAt: Date } }>(posts: T[]) {
  const groups = new Map<string, T[]>();
  for (const post of sortPublishedPosts(posts)) {
    const year = String(post.data.publishedAt.getFullYear());
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups.entries()];
}

export function getRelatedPosts<T extends { id: string; data: { tags: string[] } }>(
  currentPost: T,
  posts: T[]
) {
  return posts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => ({
      post,
      score: post.data.tags.filter((tag) => currentPost.data.tags.includes(tag)).length
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.post);
}

export function getArticleLead(excerpt: string | undefined, body: string | undefined) {
    if (excerpt?.trim()) {
        return excerpt.trim();
    }

    if (!body?.trim()) {
        return "";
    }

    const chunks = body
        .split(/\n\s*\n/g)
        .map((chunk) => ({
            raw: chunk.trim(),
            text: chunk
                .replace(/^#{1,6}\s+/gm, "")
                .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
                .replace(/\[[^\]]+\]\([^)]+\)/g, "")
                .replace(/[*_`>#-]/g, " ")
                .replace(/\s+/g, " ")
                .trim()
        }))
        .filter((chunk) => chunk.text)
        .filter((chunk) => !/^#{1,6}\s/.test(chunk.raw))
        .map((chunk) => chunk.text);

    return chunks[0] ?? "";
}

function normalizeInlineText(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

function stripLeadingTitle(title: string, excerpt: string) {
    const normalizedTitle = normalizeInlineText(title);
    let normalizedExcerpt = normalizeInlineText(excerpt);

    if (!normalizedTitle || !normalizedExcerpt.startsWith(normalizedTitle)) {
        return normalizedExcerpt;
    }

    normalizedExcerpt = normalizedExcerpt.slice(normalizedTitle.length).trimStart();
    return normalizedExcerpt.replace(/^[：:，,。.\-—\s]+/, "").trimStart();
}

function stripGeneratedSummaryPrefix(excerpt: string) {
    return excerpt.replace(/^(摘要|导语|概述)\s*[：:]?\s*/u, "").trimStart();
}

function trimToCompleteSentence(excerpt: string) {
    const match = excerpt.match(/^(.+?[。！？!?])/u);
    if (match?.[1]) {
        return match[1].trim();
    }

    return excerpt.trim();
}

function getBodyLead(body: string | undefined) {
    if (!body?.trim()) {
        return "";
    }

    const chunks = body
        .split(/\n\s*\n/g)
        .map((chunk) => ({
            raw: chunk.trim(),
            text: chunk
                .replace(/^#{1,6}\s+/gm, "")
                .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
                .replace(/\[[^\]]+\]\([^)]+\)/g, "")
                .replace(/[*_`>#-]/g, " ")
                .replace(/\s+/g, " ")
                .trim()
        }))
        .filter((chunk) => chunk.text)
        .filter((chunk) => !/^#{1,6}\s/.test(chunk.raw))
        .map((chunk) => chunk.text);

    return chunks[0] ?? "";
}

export function getExcerptPreview(
    title: string,
    excerpt: string | undefined,
    body: string | undefined
) {
    const normalizedTitle = normalizeInlineText(title);
    const normalizedExcerpt = excerpt?.trim();

    if (!normalizedExcerpt) {
        return getBodyLead(body);
    }

    let preview = stripLeadingTitle(normalizedTitle, normalizedExcerpt);
    preview = stripGeneratedSummaryPrefix(preview);
    preview = trimToCompleteSentence(preview);

    if (!preview) {
        return getBodyLead(body);
    }

    if (preview.length < 40) {
        const bodyLead = getBodyLead(body);
        if (bodyLead) {
            return bodyLead;
        }
    }

    return preview;
}

type ArticleHeading = {
    depth: number;
    slug: string;
    text: string;
};

type GroupedArticleHeading = {
    slug: string;
    text: string;
    children: Array<{
        slug: string;
        text: string;
    }>;
};

export function groupArticleHeadings(headings: ArticleHeading[]): GroupedArticleHeading[] {
    const groups: GroupedArticleHeading[] = [];
    let currentGroup: GroupedArticleHeading | undefined;

    for (const heading of headings) {
        if (heading.depth === 2) {
            currentGroup = {slug: heading.slug, text: heading.text, children: []};
            groups.push(currentGroup);
            continue;
        }

        if (heading.depth === 3 && currentGroup) {
            currentGroup.children.push({
                slug: heading.slug,
                text: heading.text
            });
        }
    }

    return groups;
}

export function getReadingTime(content: string) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function getSearchResults<
  T extends {
    data: {
      title: string;
      excerpt: string;
      tags: string[];
      publishedAt: Date;
    };
  }
>(posts: T[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return posts;
  }

  return posts
    .map((post) => {
      const title = post.data.title.toLowerCase();
      const excerpt = post.data.excerpt.toLowerCase();
      const tags = post.data.tags.map((tag) => tag.toLowerCase());

      let score = 0;
      if (title.includes(normalizedQuery)) score += 5;
      if (tags.some((tag) => tag.includes(normalizedQuery))) score += 3;
      if (excerpt.includes(normalizedQuery)) score += 1;

      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.post.data.publishedAt.getTime() - left.post.data.publishedAt.getTime();
    })
    .map((item) => item.post);
}
