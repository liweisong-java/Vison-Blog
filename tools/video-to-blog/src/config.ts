import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import type { VideoToBlogConfig } from "./types.js";

const rawConfigSchema = z.object({
  contentRoot: z.string().min(1),
  stateRoot: z.string().min(1),
  deployRoot: z.string().min(1),
  ytDlpBin: z.string().min(1),
  ytDlpArgs: z.array(z.string().min(1)).default([]),
  ytDlpArgsByPlatform: z
    .object({
      youtube: z.array(z.string().min(1)).optional(),
      bilibili: z.array(z.string().min(1)).optional(),
      douyin: z.array(z.string().min(1)).optional()
    })
    .default({}),
  pythonBin: z.string().min(1),
  whisperModel: z.string().min(1),
  tempRoot: z.string().min(1)
});

export async function loadVideoToBlogConfig(fileUrl: URL, repoRoot: string): Promise<VideoToBlogConfig> {
  const raw = await readFile(fileUrl, "utf8");
  const parsed = rawConfigSchema.parse(JSON.parse(raw));

  return {
    ...parsed,
    contentRoot: resolve(repoRoot, parsed.contentRoot),
    stateRoot: resolve(repoRoot, parsed.stateRoot),
    deployRoot: resolve(parsed.deployRoot),
    tempRoot: resolve(repoRoot, parsed.tempRoot)
  };
}
