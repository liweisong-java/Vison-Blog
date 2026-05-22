import {describe, expect, it} from "vitest";
import {createSiYuanSourceAdapter} from "../src/source-adapters/siyuan-adapter.js";

describe("createSiYuanSourceAdapter", () => {
  it("exposes the generic source adapter methods and maps Siyuan fields", async () => {
    const adapter = createSiYuanSourceAdapter({
      notebookId: "demo-notebook",
      client: {
        queryDocuments: async () => [
          {
            id: "doc-1",
            content: "标题",
            hpath: "/标题",
            path: "/doc-1.sy",
            updated: "20260520180000"
          }
        ],
        getBlockAttrs: async () => ({
          "blog-pub": "true"
        }),
        exportMarkdown: async () => ({
          content: "# 标题\n\n正文"
        })
      }
    });

    const docs = await adapter.listDocuments();
    expect(docs).toEqual([
      {
        id: "doc-1",
        title: "标题",
        hpath: "/标题",
        path: "/doc-1.sy",
        updatedAt: "20260520180000"
      }
    ]);

    await expect(adapter.readDocumentMeta("doc-1")).resolves.toEqual({
      "blog-pub": "true"
    });
    await expect(adapter.readDocumentContent("doc-1")).resolves.toEqual({
      content: "# 标题\n\n正文"
    });
  });
});
