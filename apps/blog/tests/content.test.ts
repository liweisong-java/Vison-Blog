import { describe, expect, it } from "vitest";
import {
  getAllTags,
  getSearchResults,
  getTagSummaries,
  getReadingTime,
  postSchema,
  sortPublishedPosts
} from "../src/lib/content";

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
        sourceId: "doc-life-1",
        wechatReady: true
      }).success
    ).toBe(true);
  });

  it("accepts optional distribution metadata", () => {
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
        sourceId: "doc-tech-1",
        canonicalUrl: "https://example.com/original-post",
        cover: "./cover.jpg",
        wechatReady: false
      }).success
    ).toBe(true);
  });

  it("accepts manual posts without a publisher sourceId", () => {
    expect(
      postSchema.safeParse({
        title: "Manual Entry",
        slug: "manual-entry",
        publishedAt: "2026-05-11",
        excerpt: "A hand-written article that lives in the repo without coming from SiYuan sync.",
        category: "tech",
        tags: ["manual"],
        featured: false,
        publish: true
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

  it("estimates reading time with a one minute floor", () => {
    expect(getReadingTime("Short note")).toBe(1);
    expect(getReadingTime("word ".repeat(900))).toBe(5);
  });

  it("summarizes tags with counts", () => {
    const summaries = getTagSummaries([
      { data: { tags: ["astro", "siyuan"] } },
      { data: { tags: ["journal", "astro"] } }
    ] as never);

    expect(summaries).toEqual([
      { tag: "astro", count: 2 },
      { tag: "journal", count: 1 },
      { tag: "siyuan", count: 1 }
    ]);
  });

  it("returns search results ranked by title, tags, and excerpt relevance", () => {
    const posts = [
      {
        data: {
          title: "From Notes to Site",
          excerpt: "How a SiYuan note becomes a deployed editorial article.",
          tags: ["astro", "siyuan"],
          slug: "from-notes-to-site",
          publishedAt: new Date("2026-05-10")
        }
      },
      {
        data: {
          title: "Weekend Walk",
          excerpt: "A slower dispatch from a quiet Shanghai morning.",
          tags: ["journal"],
          slug: "weekend-walk",
          publishedAt: new Date("2026-05-09")
        }
      }
    ];

    const results = getSearchResults(
      posts,
      "siyuan"
    );

    expect(results).toHaveLength(1);
    expect(results[0].data.slug).toBe("from-notes-to-site");
  });
});
