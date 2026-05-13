import { describe, expect, it } from "vitest";
import { fetchVideoMetadata } from "../src/yt-dlp";

describe("yt-dlp helpers", () => {
  it("maps dumped yt-dlp metadata into normalized video metadata", async () => {
    const metadata = await fetchVideoMetadata({
      url: "https://www.youtube.com/watch?v=abc123",
      ytDlpBin: "yt-dlp",
      run: async () => ({
        stdout: JSON.stringify({
          id: "abc123",
          title: "Agent 实战分享",
          webpage_url: "https://www.youtube.com/watch?v=abc123",
          uploader: "Vison",
          upload_date: "20260514",
          subtitles: { "zh-CN": [] },
          automatic_captions: { en: [] }
        }),
        stderr: ""
      })
    });

    expect(metadata.id).toBe("abc123");
    expect(metadata.platform).toBe("youtube");
    expect(metadata.publishedAt).toBe("2026-05-14");
    expect(metadata.subtitles).toEqual(["zh-CN"]);
    expect(metadata.automaticSubtitles).toEqual(["en"]);
  });
});
