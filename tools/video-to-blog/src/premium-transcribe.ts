import { basename } from "node:path";
import type { Transcript } from "./types.js";

type OpenAiAudioResponse = {
  text?: string;
  language?: string;
  segments?: Array<{
    start?: number;
    end?: number;
    text?: string;
  }>;
};

export async function transcribeWithOpenAi({
  audioPath,
  apiKey,
  model
}: {
  audioPath: string;
  apiKey: string;
  model: string;
}): Promise<Transcript> {
  const form = new FormData();
  const file = await BunCompatibleFile.fromPath(audioPath);
  form.set("file", file, basename(audioPath));
  form.set("model", model);
  form.set("response_format", "verbose_json");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI transcription failed: ${response.status} ${text}`.trim());
  }

  const payload = (await response.json()) as OpenAiAudioResponse;
  return {
    source: "asr",
    language: payload.language,
    text: payload.text?.trim() ?? "",
    segments:
      payload.segments?.map((segment) => ({
        start: typeof segment.start === "number" ? segment.start : 0,
        end: typeof segment.end === "number" ? segment.end : 0,
        text: segment.text?.trim() ?? ""
      })) ?? []
  };
}

class BunCompatibleFile {
  static async fromPath(filePath: string) {
    const bytes = await import("node:fs/promises").then(({ readFile }) => readFile(filePath));
    return new File([bytes], basename(filePath), {
      type: guessAudioContentType(filePath)
    });
  }
}

function guessAudioContentType(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".mp3")) {
    return "audio/mpeg";
  }
  if (lower.endsWith(".m4a")) {
    return "audio/mp4";
  }
  if (lower.endsWith(".wav")) {
    return "audio/wav";
  }
  if (lower.endsWith(".webm")) {
    return "audio/webm";
  }
  return "application/octet-stream";
}
