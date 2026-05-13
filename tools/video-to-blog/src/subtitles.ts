import { readFile } from "node:fs/promises";
import type { Transcript, TranscriptSegment } from "./types.js";

function toSeconds(value: string) {
  const normalized = value.replace(",", ".");
  const parts = normalized.split(":");
  const [hours, minutes, seconds] = parts.map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function cleanupCueText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseVtt(content: string) {
  const lines = content.replace(/\r/g, "").split("\n");
  const segments: TranscriptSegment[] = [];
  let currentTiming: { start: number; end: number } | null = null;
  let buffer: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === "WEBVTT" || line.startsWith("NOTE")) {
      if (currentTiming && buffer.length) {
        segments.push({
          start: currentTiming.start,
          end: currentTiming.end,
          text: cleanupCueText(buffer.join(" "))
        });
      }
      currentTiming = null;
      buffer = [];
      continue;
    }

    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((part) => part.trim().split(" ")[0]);
      currentTiming = {
        start: toSeconds(start),
        end: toSeconds(end)
      };
      buffer = [];
      continue;
    }

    if (currentTiming) {
      buffer.push(line);
    }
  }

  if (currentTiming && buffer.length) {
    segments.push({
      start: currentTiming.start,
      end: currentTiming.end,
      text: cleanupCueText(buffer.join(" "))
    });
  }

  return segments.filter((segment) => segment.text);
}

function parseSrt(content: string) {
  const blocks = content.replace(/\r/g, "").trim().split(/\n\s*\n/g);
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingLine = lines.find((line) => line.includes("-->"));
    if (!timingLine) {
      continue;
    }

    const [start, end] = timingLine.split("-->").map((part) => part.trim());
    const text = cleanupCueText(lines.slice(lines.indexOf(timingLine) + 1).join(" "));
    if (!text) {
      continue;
    }

    segments.push({
      start: toSeconds(start.split(" ")[0]),
      end: toSeconds(end.split(" ")[0]),
      text
    });
  }

  return segments;
}

function detectSubtitleLanguage(filePath: string) {
  const normalized = filePath.toLowerCase();
  if (normalized.includes(".zh")) {
    return "zh";
  }
  if (normalized.includes(".en")) {
    return "en";
  }
  return undefined;
}

export function pickBestSubtitleFile(filePaths: string[]) {
  const weighted = [...filePaths].sort((left, right) => {
    const score = (value: string) => {
      const normalized = value.toLowerCase();
      if (normalized.includes(".zh-hans") || normalized.includes(".zh-cn") || normalized.includes(".zh")) return 0;
      if (normalized.includes(".en")) return 1;
      return 2;
    };

    return score(left) - score(right);
  });

  return weighted[0];
}

export async function parseSubtitleFile(filePath: string): Promise<Transcript> {
  const content = await readFile(filePath, "utf8");
  const segments = filePath.endsWith(".srt") ? parseSrt(content) : parseVtt(content);
  const text = segments.map((segment) => segment.text).join(" ").replace(/\s+/g, " ").trim();

  return {
    source: "subtitle",
    language: detectSubtitleLanguage(filePath),
    text,
    segments
  };
}
