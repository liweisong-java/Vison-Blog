import { resolve } from "node:path";
import { pickBestSubtitleFile, parseSubtitleFile } from "./subtitles.js";
import type { RunCommand } from "./process.js";
import { runCommand } from "./process.js";
import { transcribeWithOpenAi } from "./premium-transcribe.js";
import type { PremiumTranscriptionFallback, Transcript, TranscriptionEngine } from "./types.js";

export async function transcribeVideo({
  subtitleFiles,
  audioPath,
  pythonBin,
  whisperModel,
  toolRoot,
  transcriptionEngine = "local",
  openAiApiKey,
  openAiTranscriptionModel = "gpt-4o-transcribe",
  premiumTranscriptionFallback = "local",
  usePremiumTranscription = transcribeWithOpenAi,
  run = runCommand
}: {
  subtitleFiles: string[];
  audioPath?: string;
  pythonBin: string;
  whisperModel: string;
  toolRoot: string;
  transcriptionEngine?: TranscriptionEngine;
  openAiApiKey?: string;
  openAiTranscriptionModel?: string;
  premiumTranscriptionFallback?: PremiumTranscriptionFallback;
  usePremiumTranscription?: typeof transcribeWithOpenAi;
  run?: RunCommand;
}): Promise<Transcript> {
  const preferredSubtitle = pickBestSubtitleFile(subtitleFiles);
  if (preferredSubtitle) {
    return parseSubtitleFile(preferredSubtitle);
  }

  if (!audioPath) {
    throw new Error("No subtitles or audio are available for transcription.");
  }

  if (transcriptionEngine === "openai") {
    if (!openAiApiKey) {
      throw new Error("Missing OPENAI_API_KEY for premium transcription.");
    }

    try {
      return await usePremiumTranscription({
        audioPath,
        apiKey: openAiApiKey,
        model: openAiTranscriptionModel
      });
    } catch (error) {
      if (premiumTranscriptionFallback === "none") {
        throw error;
      }
    }
  }

  const scriptPath = resolve(toolRoot, "python", "transcribe.py");
  const { stdout } = await run(pythonBin, [scriptPath, audioPath, whisperModel]);
  return JSON.parse(stdout) as Transcript;
}
