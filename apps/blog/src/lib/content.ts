import { z } from "zod";

export const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  publishedAt: z.coerce.date(),
  excerpt: z.string().min(24).max(220),
  category: z.enum(["tech", "life"]),
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

export function filterPostsByCategory<T extends { data: { category: "tech" | "life" } }>(
  posts: T[],
  category: "tech" | "life"
) {
  return posts.filter((post) => post.data.category === category);
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
