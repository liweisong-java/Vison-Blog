import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { enqueueVideoJob, readManifest, readQueueState, writeManifest } from "../src/state";

describe("video-to-blog state", () => {
  it("starts with an empty queue when no file exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-state-"));
    const queue = await readQueueState(join(root, "queue.json"));

    expect(queue).toEqual({ jobs: [] });
  });

  it("appends queued jobs to queue state", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-state-"));
    const queuePath = join(root, "queue.json");

    await enqueueVideoJob(queuePath, {
      id: "job-1",
      url: "https://www.youtube.com/watch?v=abc123",
      status: "queued",
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    });

    const raw = JSON.parse(await readFile(queuePath, "utf8"));
    expect(raw.jobs).toHaveLength(1);
    expect(raw.jobs[0].id).toBe("job-1");
  });

  it("starts with an empty manifest when no file exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-manifest-"));
    const manifest = await readManifest(join(root, "manifest.json"));

    expect(manifest).toEqual({ videos: [] });
  });

  it("writes and reads a manifest", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-manifest-"));
    const manifestPath = join(root, "manifest.json");
    await writeManifest(manifestPath, {
      videos: [
        {
          url: "https://www.bilibili.com/video/BV1xx411c7mD/",
          slug: "test-video",
          updatedAt: "2026-05-14T00:00:00.000Z"
        }
      ]
    });

    const manifest = await readManifest(manifestPath);
    expect(manifest.videos).toHaveLength(1);
    expect(manifest.videos[0]?.slug).toBe("test-video");
  });
});
