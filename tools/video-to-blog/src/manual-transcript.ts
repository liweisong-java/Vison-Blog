import type { Transcript } from "./types.js";

function splitManualTranscript(text: string) {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildTranscriptFromManualText(text: string): Transcript {
  const normalized = text.trim();
  if (!normalized) {
    throw new Error("Manual transcript text is empty.");
  }

  const paragraphs = splitManualTranscript(normalized);
  let cursor = 0;
  const segments = paragraphs.map((paragraph) => {
    const segment = {
      start: cursor,
      end: cursor + 10,
      text: paragraph.replace(/\s+/g, " ").trim()
    };
    cursor += 10;
    return segment;
  });

  return {
    source: "subtitle",
    language: "zh",
    text: segments.map((segment) => segment.text).join(" "),
    segments
  };
}
