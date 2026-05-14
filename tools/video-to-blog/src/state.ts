import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { join } from "node:path";
import type { VideoSourceManifest, VideoToBlogJob, VideoToBlogQueueState } from "./types.js";

const jobSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  status: z.enum(["queued", "running", "succeeded", "failed"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  transcriptText: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  error: z.string().min(1).optional()
});

const queueStateSchema = z.object({
  jobs: z.array(jobSchema)
});

const manifestSchema = z.object({
  videos: z.array(
    z.object({
      url: z.string().url(),
      slug: z.string().min(1),
      updatedAt: z.string().min(1)
    })
  )
});

async function ensureParent(path: string) {
  await mkdir(dirname(path), { recursive: true });
}

export async function readQueueState(queuePath: string): Promise<VideoToBlogQueueState> {
  if (!existsSync(queuePath)) {
    return { jobs: [] };
  }

  const raw = await readFile(queuePath, "utf8");
  return queueStateSchema.parse(JSON.parse(raw));
}

export async function writeQueueState(queuePath: string, state: VideoToBlogQueueState) {
  await ensureParent(queuePath);
  await writeFile(queuePath, JSON.stringify(state, null, 2));
}

export async function enqueueVideoJob(queuePath: string, job: VideoToBlogJob) {
  const state = await readQueueState(queuePath);
  state.jobs.push(job);
  await writeQueueState(queuePath, state);
  return state;
}

export async function readManifest(manifestPath: string): Promise<VideoSourceManifest> {
  if (!existsSync(manifestPath)) {
    return { videos: [] };
  }

  const raw = await readFile(manifestPath, "utf8");
  return manifestSchema.parse(JSON.parse(raw));
}

export async function writeManifest(manifestPath: string, manifest: VideoSourceManifest) {
  await ensureParent(manifestPath);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

export async function updateQueuedJob(
  queuePath: string,
  jobId: string,
  updater: (job: VideoToBlogJob) => VideoToBlogJob
) {
  const state = await readQueueState(queuePath);
  const nextJobs = state.jobs.map((job) => (job.id === jobId ? updater(job) : job));
  await writeQueueState(queuePath, { jobs: nextJobs });
  return nextJobs.find((job) => job.id === jobId);
}

export async function writeJobSnapshot(jobsRoot: string, job: VideoToBlogJob) {
  await mkdir(jobsRoot, { recursive: true });
  await writeFile(join(jobsRoot, `${job.id}.json`), JSON.stringify(job, null, 2));
}
