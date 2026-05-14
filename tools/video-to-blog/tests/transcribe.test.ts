import { describe, expect, it, vi } from "vitest";
import type { Transcript } from "../src/types";
import { transcribeVideo } from "../src/transcribe";

describe("transcribeVideo", () => {
  it("prefers the configured premium transcription engine before local whisper", async () => {
    const premiumTranscript: Transcript = {
      source: "asr",
      language: "zh",
      text: "这是高质量转写结果。",
      segments: [
        {
          start: 0,
          end: 2,
          text: "这是高质量转写结果。"
        }
      ]
    };
    const usePremiumTranscription = vi.fn(async () => premiumTranscript);
    const run = vi.fn();

    const result = await transcribeVideo({
      subtitleFiles: [],
      audioPath: "/tmp/audio.mp3",
      pythonBin: "python3",
      whisperModel: "large-v3",
      toolRoot: "/tmp/tools/video-to-blog",
      transcriptionEngine: "openai",
      openAiApiKey: "test-key",
      usePremiumTranscription,
      run
    });

    expect(result).toEqual(premiumTranscript);
    expect(usePremiumTranscription).toHaveBeenCalledOnce();
    expect(run).not.toHaveBeenCalled();
  });

  it("falls back to local whisper when the premium engine fails", async () => {
    const usePremiumTranscription = vi.fn(async () => {
      throw new Error("premium failed");
    });
    const run = vi.fn(async () => ({
      stdout: JSON.stringify({
        source: "asr",
        language: "zh",
        text: "这是本地兜底结果。",
        segments: [
          {
            start: 0,
            end: 1,
            text: "这是本地兜底结果。"
          }
        ]
      }),
      stderr: ""
    }));

    const result = await transcribeVideo({
      subtitleFiles: [],
      audioPath: "/tmp/audio.mp3",
      pythonBin: "python3",
      whisperModel: "large-v3",
      toolRoot: "/tmp/tools/video-to-blog",
      transcriptionEngine: "openai",
      openAiApiKey: "test-key",
      usePremiumTranscription,
      run
    });

    expect(result.text).toContain("本地兜底结果");
    expect(usePremiumTranscription).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledOnce();
  });

  it("falls back to local whisper when openai mode is enabled without an api key", async () => {
    const usePremiumTranscription = vi.fn(async () => {
      throw new Error("should not be called");
    });
    const run = vi.fn(async () => ({
      stdout: JSON.stringify({
        source: "asr",
        language: "zh",
        text: "这是缺少 key 时的本地兜底结果。",
        segments: [
          {
            start: 0,
            end: 1,
            text: "这是缺少 key 时的本地兜底结果。"
          }
        ]
      }),
      stderr: ""
    }));

    const result = await transcribeVideo({
      subtitleFiles: [],
      audioPath: "/tmp/audio.mp3",
      pythonBin: "python3",
      whisperModel: "large-v3",
      toolRoot: "/tmp/tools/video-to-blog",
      transcriptionEngine: "openai",
      premiumTranscriptionFallback: "local",
      usePremiumTranscription,
      run
    });

    expect(result.text).toContain("缺少 key 时的本地兜底结果");
    expect(usePremiumTranscription).not.toHaveBeenCalled();
    expect(run).toHaveBeenCalledOnce();
  });
});
