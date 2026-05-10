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
  sourceId: z.string().min(1),
  cover: z.string().optional()
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
