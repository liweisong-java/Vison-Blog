import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import type { PublisherConfig } from "./types.js";

const rawConfigSchema = z.object({
  notebookId: z.string().min(1),
  siyuanWorkspaceDir: z.string().min(1),
  contentRoot: z.string().min(1),
  attrs: z.object({
    publish: z.string().min(1),
    category: z.string().min(1),
    excerpt: z.string().min(1),
    featured: z.string().min(1),
    slug: z.string().min(1),
    tags: z.string().min(1),
    publishedAt: z.string().min(1)
  })
});

export async function loadPublisherConfig(fileUrl: URL, repoRoot: string): Promise<PublisherConfig> {
  const raw = await readFile(fileUrl, "utf8");
  const parsed = rawConfigSchema.parse(JSON.parse(raw));

  return {
    ...parsed,
    siyuanWorkspaceDir: resolve(repoRoot, parsed.siyuanWorkspaceDir),
    contentRoot: resolve(repoRoot, parsed.contentRoot)
  };
}
