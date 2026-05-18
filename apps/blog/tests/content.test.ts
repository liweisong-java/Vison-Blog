import {describe, expect, it} from "vitest";
import {
    getAllTags,
    getArticleLead,
    getExcerptPreview,
    getReadingTime,
    getSearchResults,
    getTagSummaries,
    groupArticleHeadings,
    postSchema,
    sortPublishedPosts
} from "../src/lib/content";

describe("post schema", () => {
    it("accepts posts whether category is present or omitted", () => {
    expect(
      postSchema.safeParse({
        title: "From Notes to Site",
        slug: "from-notes-to-site",
        publishedAt: "2026-05-10",
        excerpt: "How a SiYuan note becomes a deployed editorial article.",
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
        tags: ["manual"],
        featured: false,
        publish: true
      }).success
    ).toBe(true);
  });

  it("accepts concise Chinese excerpts for short notes", () => {
    expect(
      postSchema.safeParse({
        title: "这是一个博客",
        slug: "this-is-a-blog",
        publishedAt: "2026-05-11",
        excerpt: "这是一个博客",
        tags: [],
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

    it("builds a concise article lead from excerpt or body text", () => {
        expect(getArticleLead("现成摘要", "# 标题\n\n正文")).toBe("现成摘要");
        expect(getArticleLead(undefined, "# 标题\n\n第一段内容。\n\n第二段内容。")).toBe("第一段内容。");
    });

    it("removes duplicated titles from synced excerpts and keeps a complete Chinese sentence", () => {
        expect(
            getExcerptPreview(
                "Agent 的短期记忆、长期记忆与向量记忆：如何让它真正“记住事”",
                "Agent 的短期记忆、长期记忆与向量记忆：如何让它真正“记住事” Agent 之所以能摆脱“单次对话失忆”的困境，实现连贯交互、个性化响应和持续学习，核心在于其记忆系统的合理设计——短期记忆、长期记忆与向量记忆并非孤立存在，而是一套协同工作的体系。很多开发者搭建的 Agent",
                "# 标题\n\nAgent 之所以能摆脱“单次对话失忆”的困境，实现连贯交互、个性化响应和持续学习，核心在于其记忆系统的合理设计——短期记忆、长期记忆与向量记忆并非孤立存在，而是一套协同工作的体系。"
            )
        ).toBe(
            "Agent 之所以能摆脱“单次对话失忆”的困境，实现连贯交互、个性化响应和持续学习，核心在于其记忆系统的合理设计——短期记忆、长期记忆与向量记忆并非孤立存在，而是一套协同工作的体系。"
        );
    });

    it("strips generated 摘要 prefixes from synced excerpts", () => {
        expect(
            getExcerptPreview(
                "Agent 状态机的工业级设计：从线性链路到图状拓扑的演进",
                "Agent 状态机的工业级设计：从线性链路到图状拓扑的演进 摘要 在2026年，工业级Agent系统的落地已从实验原型转向生产环境的核心基础设施，而状态机的设计范式演进成为关键驱动力。",
                undefined
            )
        ).toBe(
            "在2026年，工业级Agent系统的落地已从实验原型转向生产环境的核心基础设施，而状态机的设计范式演进成为关键驱动力。"
        );
    });

    it("groups h2 and h3 headings for article toc rendering", () => {
        expect(
            groupArticleHeadings([
                {depth: 2, slug: "section-a", text: "章节 A"},
                {depth: 3, slug: "section-a-1", text: "章节 A-1"},
                {depth: 2, slug: "section-b", text: "章节 B"},
                {depth: 3, slug: "section-b-1", text: "章节 B-1"}
            ])
        ).toEqual([
            {
                slug: "section-a",
                text: "章节 A",
                children: [{slug: "section-a-1", text: "章节 A-1"}]
            },
            {
                slug: "section-b",
                text: "章节 B",
                children: [{slug: "section-b-1", text: "章节 B-1"}]
            }
        ]);
    });
});
