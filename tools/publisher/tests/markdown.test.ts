import { describe, expect, it } from "vitest";
import { buildPostBundle } from "../src/markdown";

describe("buildPostBundle", () => {
  it("rewrites SiYuan asset paths into local MDX asset paths", async () => {
    const bundle = await buildPostBundle({
      note: {
        id: "doc-tech-1",
        title: "From Notes to Site",
        slug: "from-notes-to-site",
        category: "tech",
        excerpt: "How a SiYuan note becomes a deployed editorial article.",
        featured: true,
        publishedAt: "2026-05-10",
        tags: ["astro", "siyuan"]
      },
      markdown: "## Intro\n\n![Shot](assets/image-demo.png)\n"
    });

    expect(bundle.filePath).toBe("from-notes-to-site/index.mdx");
    expect(bundle.body).toContain("slug: from-notes-to-site");
    expect(bundle.body).toContain("![Shot](./image-demo.png)");
    expect(bundle.assets).toEqual([{ sourcePath: "assets/image-demo.png", fileName: "image-demo.png" }]);
  });
});
