import { describe, expect, it, vi } from "vitest";
import { createSiYuanClient } from "../src/siyuan-client";

describe("createSiYuanClient", () => {
  it("posts to exportMdContent", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 0, msg: "", data: { content: "# Hello" } }))
    );

    const client = createSiYuanClient({
      baseUrl: "http://127.0.0.1:6806",
      token: "secret",
      fetchImpl
    });

    await client.exportMarkdown("doc-1");

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:6806/api/export/exportMdContent",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Token secret" })
      })
    );
  });
});
