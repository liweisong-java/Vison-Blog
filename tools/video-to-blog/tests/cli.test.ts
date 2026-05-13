import { describe, expect, it } from "vitest";
import { enqueueVideo, getVideoToBlogStatus } from "../src/commands";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("video-to-blog commands", () => {
  it("enqueues a video link", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-cli-"));
    const result = await enqueueVideo({
      runtime: {
        workspaceRoot: root,
        toolRoot: join(root, "tools/video-to-blog"),
        envPath: join(root, "tools/video-to-blog/.env"),
        configPath: join(root, "tools/video-to-blog/video-to-blog.config.json"),
        stateRoot: join(root, ".superpowers/video-to-blog"),
        queuePath: join(root, ".superpowers/video-to-blog/queue.json"),
        jobsRoot: join(root, ".superpowers/video-to-blog/jobs"),
        manifestPath: join(root, ".superpowers/video-to-blog/manifest.json"),
        tempRoot: join(root, ".superpowers/video-to-blog/tmp"),
        repoLockPath: join(root, ".superpowers/locks/repo.lock")
      },
      url: "https://www.youtube.com/watch?v=abc123",
      now: () => "2026-05-14T00:00:00.000Z"
    });

    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://www.youtube.com/watch?v=abc123");
    expect(result.id).toHaveLength(12);
  });

  it("reports queue and manifest status", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-cli-"));
    const runtime = {
      workspaceRoot: root,
      toolRoot: join(root, "tools/video-to-blog"),
      envPath: join(root, "tools/video-to-blog/.env"),
      configPath: join(root, "tools/video-to-blog/video-to-blog.config.json"),
      stateRoot: join(root, ".superpowers/video-to-blog"),
      queuePath: join(root, ".superpowers/video-to-blog/queue.json"),
      jobsRoot: join(root, ".superpowers/video-to-blog/jobs"),
      manifestPath: join(root, ".superpowers/video-to-blog/manifest.json"),
      tempRoot: join(root, ".superpowers/video-to-blog/tmp"),
      repoLockPath: join(root, ".superpowers/locks/repo.lock")
    };

    await enqueueVideo({
      runtime,
      url: "https://www.douyin.com/video/123456",
      now: () => "2026-05-14T00:00:00.000Z"
    });
    const status = await getVideoToBlogStatus(runtime);

    expect(status.queueSize).toBe(1);
    expect(status.pending).toBe(1);
    expect(status.publishedVideos).toBe(0);
  });
});
