import { describe, expect, it, vi } from "vitest";
import { syncPublishedNotes } from "../src/commands/sync";

describe("syncPublishedNotes", () => {
  it("returns written slugs and removed slugs", async () => {
    const result = await syncPublishedNotes({
      dryRun: true,
      config: {
        notebookId: "demo",
        siyuanWorkspaceDir: "/tmp/SiYuan",
        contentRoot: "/tmp/content",
        attrs: {
          publish: "custom-blog-publish",
          category: "custom-blog-category",
          excerpt: "custom-blog-excerpt",
          featured: "custom-blog-featured",
          slug: "custom-blog-slug",
          tags: "custom-blog-tags",
          publishedAt: "custom-blog-date"
        }
      },
      client: {
        queryDocuments: vi.fn().mockResolvedValue([
          {
            id: "doc-tech-1",
            content: "From Notes to Site",
            hpath: "/Blog/From Notes to Site",
            updated: "20260510120000"
          }
        ]),
        getBlockAttrs: vi.fn().mockResolvedValue({
          "custom-blog-publish": "true",
          "custom-blog-category": "tech",
          "custom-blog-excerpt": "How a SiYuan note becomes a deployed editorial article.",
          "custom-blog-featured": "true",
          "custom-blog-slug": "from-notes-to-site",
          "custom-blog-tags": "astro,siyuan",
          "custom-blog-date": "2026-05-10"
        }),
        exportMarkdown: vi.fn().mockResolvedValue({
          content: "## Intro\n\n![Shot](assets/image-demo.png)\n"
        })
      },
      collectManagedPosts: vi.fn().mockResolvedValue([
        { slug: "old-draft", sourceId: "old-draft-id", directory: "/tmp/content/old-draft" }
      ]),
      writeBundle: vi.fn(),
      removeManagedPost: vi.fn(),
      runBlogChecks: vi.fn(),
      commitAndPush: vi.fn()
    });

    expect(result.written).toEqual(["from-notes-to-site"]);
    expect(result.removed).toEqual(["old-draft"]);
  });
});
