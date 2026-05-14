import { describe, expect, it } from "vitest";
import { downloadAudioArtifact, downloadSubtitleArtifacts, fetchVideoMetadata } from "../src/yt-dlp";

describe("yt-dlp helpers", () => {
  it("maps dumped yt-dlp metadata into normalized video metadata", async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const metadata = await fetchVideoMetadata({
      url: "https://www.youtube.com/watch?v=abc123",
      ytDlpBin: "yt-dlp",
      ytDlpArgs: ["--socket-timeout", "30"],
      ytDlpArgsByPlatform: {
        youtube: ["--extractor-args", "youtube:player_client=web"]
      },
      run: async (command, args) => {
        calls.push({ command, args });
        return {
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
        };
      }
    });

    expect(metadata.id).toBe("abc123");
    expect(metadata.platform).toBe("youtube");
    expect(metadata.publishedAt).toBe("2026-05-14");
    expect(metadata.subtitles).toEqual(["zh-CN"]);
    expect(metadata.automaticSubtitles).toEqual(["en"]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args).toEqual([
      "--socket-timeout",
      "30",
      "--extractor-args",
      "youtube:player_client=web",
      "--dump-single-json",
      "--no-warnings",
      "--skip-download",
      "https://www.youtube.com/watch?v=abc123"
    ]);
  });

  it("reuses configured yt-dlp args for subtitle and audio downloads", async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const ytDlpArgs = ["--socket-timeout", "30"];
    const ytDlpArgsByPlatform = {
      bilibili: ["--extractor-args", "bilibili:prefer_multi_flv=true"]
    };

    await downloadSubtitleArtifacts({
      url: "https://www.bilibili.com/video/BV1xx411c7mu",
      ytDlpBin: "yt-dlp",
      ytDlpArgs,
      ytDlpArgsByPlatform,
      outputRoot: "/tmp/subtitles",
      run: async (command, args) => {
        calls.push({ command, args });
        return { stdout: "", stderr: "" };
      },
      listFiles: async () => ["subtitle.zh-CN.vtt"]
    });

    await downloadAudioArtifact({
      url: "https://www.bilibili.com/video/BV1xx411c7mu",
      ytDlpBin: "yt-dlp",
      ytDlpArgs,
      ytDlpArgsByPlatform,
      outputRoot: "/tmp/audio",
      run: async (command, args) => {
        calls.push({ command, args });
        return { stdout: "", stderr: "" };
      },
      listFiles: async () => ["audio.m4a"]
    });

    expect(calls[0]?.args.slice(0, 4)).toEqual([
      "--socket-timeout",
      "30",
      "--extractor-args",
      "bilibili:prefer_multi_flv=true"
    ]);
    expect(calls[1]?.args.slice(0, 4)).toEqual([
      "--socket-timeout",
      "30",
      "--extractor-args",
      "bilibili:prefer_multi_flv=true"
    ]);
  });
});
