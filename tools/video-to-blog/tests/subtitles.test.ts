import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { parseSubtitleFile, pickBestSubtitleFile } from "../src/subtitles";

describe("subtitle parsing", () => {
  it("prefers Chinese subtitle files when multiple languages exist", () => {
    const file = pickBestSubtitleFile(["/tmp/subtitle.en.vtt", "/tmp/subtitle.zh-CN.vtt"]);
    expect(file).toBe("/tmp/subtitle.zh-CN.vtt");
  });

  it("parses VTT subtitle content into transcript segments", async () => {
    const root = await mkdtemp(join(tmpdir(), "subtitle-parse-"));
    const filePath = join(root, "subtitle.zh-CN.vtt");
    await writeFile(
      filePath,
      ["WEBVTT", "", "00:00:00.000 --> 00:00:02.000", "大家好，欢迎来到今天的视频。", ""].join("\n"),
      "utf8"
    );

    const transcript = await parseSubtitleFile(filePath);
    expect(transcript.source).toBe("subtitle");
    expect(transcript.language).toBe("zh");
    expect(transcript.segments[0]?.text).toContain("大家好");
  });
});
