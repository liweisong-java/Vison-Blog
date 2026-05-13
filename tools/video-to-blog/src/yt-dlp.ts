import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { detectVideoPlatform } from "./platform.js";
import type { RunCommand } from "./process.js";
import { runCommand } from "./process.js";
import type { SupportedVideoPlatform, VideoMetadata } from "./types.js";

type RawMetadata = {
  id?: string;
  title?: string;
  webpage_url?: string;
  uploader?: string;
  uploader_url?: string;
  description?: string;
  duration?: number;
  upload_date?: string;
  subtitles?: Record<string, unknown>;
  automatic_captions?: Record<string, unknown>;
};

function normalizeDate(value: string | undefined) {
  if (!value || value.length !== 8) {
    return undefined;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function mapMetadata(raw: RawMetadata, url: string, platform: SupportedVideoPlatform): VideoMetadata {
  if (!raw.id || !raw.title) {
    throw new Error("yt-dlp metadata is missing required id/title fields.");
  }

  return {
    id: raw.id,
    title: raw.title,
    webpageUrl: raw.webpage_url ?? url,
    platform,
    uploader: raw.uploader,
    uploaderUrl: raw.uploader_url,
    description: raw.description,
    duration: raw.duration,
    publishedAt: normalizeDate(raw.upload_date),
    subtitles: Object.keys(raw.subtitles ?? {}),
    automaticSubtitles: Object.keys(raw.automatic_captions ?? {})
  };
}

export async function fetchVideoMetadata({
  url,
  ytDlpBin,
  run = runCommand
}: {
  url: string;
  ytDlpBin: string;
  run?: RunCommand;
}) {
  const platform = detectVideoPlatform(url);
  const { stdout } = await run(ytDlpBin, ["--dump-single-json", "--no-warnings", "--skip-download", url]);
  return mapMetadata(JSON.parse(stdout) as RawMetadata, url, platform);
}

export async function downloadSubtitleArtifacts({
  url,
  ytDlpBin,
  outputRoot,
  run = runCommand
}: {
  url: string;
  ytDlpBin: string;
  outputRoot: string;
  run?: RunCommand;
}) {
  const outputTemplate = join(outputRoot, "subtitle.%(ext)s");
  await run(ytDlpBin, [
    "--skip-download",
    "--write-subs",
    "--write-auto-subs",
    "--sub-langs",
    "all,-live_chat",
    "--sub-format",
    "vtt/srt/best",
    "--output",
    outputTemplate,
    url
  ]);

  const files = await readdir(outputRoot);
  return files
    .filter((file) => file.startsWith("subtitle."))
    .map((file) => join(outputRoot, file));
}

export async function downloadAudioArtifact({
  url,
  ytDlpBin,
  outputRoot,
  run = runCommand
}: {
  url: string;
  ytDlpBin: string;
  outputRoot: string;
  run?: RunCommand;
}) {
  const outputTemplate = join(outputRoot, "audio.%(ext)s");
  await run(ytDlpBin, [
    "--no-playlist",
    "--no-warnings",
    "-f",
    "bestaudio/best",
    "--output",
    outputTemplate,
    url
  ]);

  const files = await readdir(outputRoot);
  const audio = files.find((file) => file.startsWith("audio."));
  if (!audio) {
    throw new Error("yt-dlp did not produce an audio artifact.");
  }

  return join(outputRoot, audio);
}
