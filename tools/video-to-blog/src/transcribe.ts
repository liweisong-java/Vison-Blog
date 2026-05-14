import { resolve } from "node:path";
import { pickBestSubtitleFile, parseSubtitleFile } from "./subtitles.js";
import type { RunCommand } from "./process.js";
import { runCommand } from "./process.js";
import type { Transcript } from "./types.js";

export async function transcribeVideo({
  subtitleFiles,
  audioPath,
  pythonBin,
  whisperModel,
  toolRoot,
  run = runCommand
}: {
  subtitleFiles: string[];
  audioPath?: string;
  pythonBin: string;
  whisperModel: string;
  toolRoot: string;
  run?: RunCommand;
}): Promise<Transcript> {
  const preferredSubtitle = pickBestSubtitleFile(subtitleFiles);
  if (preferredSubtitle) {
    return parseSubtitleFile(preferredSubtitle);
  }

  if (!audioPath) {
    throw new Error("No subtitles or audio are available for transcription.");
  }

  const scriptPath = resolve(toolRoot, "python", "transcribe.py");
  const { stdout } = await run(pythonBin, [scriptPath, audioPath, whisperModel]);
  return JSON.parse(stdout) as Transcript;
}
