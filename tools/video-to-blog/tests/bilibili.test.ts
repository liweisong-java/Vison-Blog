import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { downloadBilibiliSubtitleArtifacts, fetchBilibiliMetadata } from "../src/bilibili";

describe("bilibili fallback helpers", () => {
  it("maps public bilibili APIs into normalized video metadata", async () => {
    const metadata = await fetchBilibiliMetadata({
      url: "https://www.bilibili.com/video/BV1GJ411x7h7",
      requestJson: async (url) => {
        if (url.includes("/x/web-interface/view")) {
          return {
            code: 0,
            data: {
              bvid: "BV1GJ411x7h7",
              title: "B 站公开视频整理",
              desc: "这是一段公开说明",
              duration: 213,
              pubdate: 1577835803,
              owner: {
                name: "Vison",
                mid: 1139575852
              }
            }
          };
        }

        if (url.includes("/x/player/pagelist")) {
          return {
            code: 0,
            data: [
              {
                cid: 137649199
              }
            ]
          };
        }

        if (url.includes("/x/player/v2")) {
          return {
            code: 0,
            data: {
              subtitle: {
                subtitles: [
                  {
                    lan: "zh-CN"
                  }
                ]
              }
            }
          };
        }

        throw new Error(`Unexpected URL: ${url}`);
      }
    });

    expect(metadata.id).toBe("BV1GJ411x7h7");
    expect(metadata.platform).toBe("bilibili");
    expect(metadata.title).toBe("B 站公开视频整理");
    expect(metadata.uploader).toBe("Vison");
    expect(metadata.uploaderUrl).toBe("https://space.bilibili.com/1139575852");
    expect(metadata.publishedAt).toBe("2019-12-31");
    expect(metadata.subtitles).toEqual(["zh-CN"]);
    expect(metadata.automaticSubtitles).toEqual([]);
  });

  it("downloads bilibili subtitle json and writes local srt artifacts", async () => {
    const root = await mkdtemp(join(tmpdir(), "bilibili-subtitles-"));
    const files = await downloadBilibiliSubtitleArtifacts({
      url: "https://www.bilibili.com/video/BV1GJ411x7h7",
      outputRoot: root,
      requestJson: async (url) => {
        if (url.includes("/x/web-interface/view")) {
          return {
            code: 0,
            data: {
              bvid: "BV1GJ411x7h7"
            }
          };
        }

        if (url.includes("/x/player/pagelist")) {
          return {
            code: 0,
            data: [
              {
                cid: 137649199
              }
            ]
          };
        }

        if (url.includes("/x/player/v2")) {
          return {
            code: 0,
            data: {
              subtitle: {
                subtitles: [
                  {
                    lan: "zh-CN",
                    subtitle_url: "https://example.com/subtitle.json"
                  }
                ]
              }
            }
          };
        }

        if (url === "https://example.com/subtitle.json") {
          return {
            body: [
              {
                from: 0,
                to: 2,
                content: "第一段字幕"
              },
              {
                from: 2,
                to: 4,
                content: "第二段字幕"
              }
            ]
          };
        }

        throw new Error(`Unexpected URL: ${url}`);
      }
    });

    expect(files).toHaveLength(1);
    expect(files[0]).toContain("subtitle.zh-CN.srt");

    const content = await readFile(files[0], "utf8");
    expect(content).toContain("第一段字幕");
    expect(content).toContain("00:00:00,000 --> 00:00:02,000");
  });
});
