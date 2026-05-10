import { describe, expect, it } from "vitest";
import { postSchema, getAllTags, sortPublishedPosts } from "../src/lib/content";

describe("post schema", () => {
  it("accepts valid tech and life posts", () => {
    expect(
      postSchema.safeParse({
        title: "From Notes to Site",
        slug: "from-notes-to-site",
        publishedAt: "2026-05-10",
        excerpt: "How a SiYuan note becomes a deployed editorial article.",
        category: "tech",
        tags: ["astro", "siyuan"],
        featured: true,
        publish: true,
        sourceId: "doc-tech-1"
      }).success
    ).toBe(true);

    expect(
      postSchema.safeParse({
        title: "Weekend Walk",
        slug: "weekend-walk",
        publishedAt: "2026-05-09",
        excerpt: "A slower dispatch from a quiet Shanghai morning.",
        category: "life",
        tags: ["journal"],
        featured: false,
        publish: true,
        sourceId: "doc-life-1"
      }).success
    ).toBe(true);
  });
});

describe("content helpers", () => {
  it("sorts newest posts first", () => {
    const posts = [
      { data: { publishedAt: new Date("2026-05-09") } },
      { data: { publishedAt: new Date("2026-05-10") } }
    ];

    expect(sortPublishedPosts(posts as never)[0].data.publishedAt.toISOString()).toContain("2026-05-10");
  });

  it("groups unique tags", () => {
    const tags = getAllTags([
      { data: { tags: ["astro", "siyuan"] } },
      { data: { tags: ["journal", "astro"] } }
    ] as never);

    expect(tags).toEqual(["astro", "journal", "siyuan"]);
  });
});
