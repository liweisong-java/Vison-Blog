import {describe, expect, it, vi} from "vitest";
import {createSiYuanClient} from "../src/siyuan-client";

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

    it("triggers a Siyuan sync with performSync", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({code: 0, msg: "", data: null}))
        );

        const client = createSiYuanClient({
            baseUrl: "http://127.0.0.1:6806",
            token: "secret",
            fetchImpl
        });

        await client.performSync();

        expect(fetchImpl).toHaveBeenCalledWith(
            "http://127.0.0.1:6806/api/sync/performSync",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({Authorization: "Token secret"})
            })
        );
    });

    it("reads the latest Siyuan sync info", async () => {
        const fetchImpl = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    code: 0,
                    msg: "",
                    data: {
                        stat: "上传/下载文件数 0/1",
                        synced: 1778655069902
                    }
                })
            )
        );

        const client = createSiYuanClient({
            baseUrl: "http://127.0.0.1:6806",
            fetchImpl
        });

        await expect(client.getSyncInfo()).resolves.toEqual({
            stat: "上传/下载文件数 0/1",
            synced: 1778655069902
        });
    });
});
