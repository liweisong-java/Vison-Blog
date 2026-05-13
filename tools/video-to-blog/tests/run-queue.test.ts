import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { enqueueVideoJob, readManifest, readQueueState } from "../src/state";
import { runVideoQueue } from "../src/commands";

describe("runVideoQueue", () => {
  it("processes a queued job into a published manifest entry and article file", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-run-"));
    const contentRoot = join(root, "apps/blog/src/content/posts");
    const toolRoot = join(root, "tools/video-to-blog");
    const runtime = {
      workspaceRoot: root,
      toolRoot,
      envPath: join(toolRoot, ".env"),
      configPath: join(toolRoot, "video-to-blog.config.json"),
      stateRoot: join(root, ".superpowers/video-to-blog"),
      queuePath: join(root, ".superpowers/video-to-blog/queue.json"),
      jobsRoot: join(root, ".superpowers/video-to-blog/jobs"),
      manifestPath: join(root, ".superpowers/video-to-blog/manifest.json"),
      tempRoot: join(root, ".superpowers/video-to-blog/tmp"),
      repoLockPath: join(root, ".superpowers/locks/repo.lock")
    };

    await mkdir(contentRoot, { recursive: true });
    await mkdir(join(root, "scripts"), { recursive: true });
    await mkdir(join(toolRoot, "python"), { recursive: true });
    await writeFile(join(root, "scripts/generate-private-dashboard.mjs"), "console.log('ok')\n", "utf8");
    await writeFile(join(toolRoot, "python/transcribe.py"), "print('{}')\n", "utf8");

    await enqueueVideoJob(runtime.queuePath, {
      id: "job-1",
      url: "https://www.youtube.com/watch?v=abc123",
      status: "queued",
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z"
    });

    const invocations: Array<{ command: string; args: string[] }> = [];
    const result = await runVideoQueue({
      config: {
        contentRoot,
        stateRoot: runtime.stateRoot,
        deployRoot: join(root, "deploy"),
        ytDlpBin: "yt-dlp",
        pythonBin: "python3",
        whisperModel: "large-v3",
        tempRoot: runtime.tempRoot
      },
      runtime,
      env: {
        VIDEO_TO_BLOG_BRANCH: "master",
        VIDEO_TO_BLOG_REMOTE: "origin"
      },
      now: () => "2026-05-14T00:00:00.000Z",
      buildSite: async () => {
        const distDir = join(root, "apps/blog/dist");
        await mkdir(distDir, { recursive: true });
        await writeFile(join(distDir, "index.html"), "<h1>video</h1>", "utf8");
      },
      commitAndPush: async () => ({
        committed: true,
        pushed: true,
        stagedFiles: [join(contentRoot, "youtube-abc123", "index.mdx")],
        commitHash: "commit123"
      }),
      run: async (command, args) => {
        invocations.push({ command, args });
        const joined = `${command} ${args.join(" ")}`;

        if (joined.startsWith("yt-dlp --dump-single-json")) {
          return {
            stdout: JSON.stringify({
              id: "abc123",
              title: "视频整理测试",
              webpage_url: "https://www.youtube.com/watch?v=abc123",
              uploader: "Vison",
              upload_date: "20260514",
              subtitles: { "zh-CN": [] },
              automatic_captions: {}
            }),
            stderr: ""
          };
        }

        if (args.includes("--write-subs")) {
          const subtitleDir = join(runtime.jobsRoot, "job-1", "subtitles");
          await mkdir(subtitleDir, { recursive: true });
          await writeFile(
            join(subtitleDir, "subtitle.zh-CN.vtt"),
            ["WEBVTT", "", "00:00:00.000 --> 00:00:02.000", "这是一次视频整理测试。", ""].join("\n"),
            "utf8"
          );
          return { stdout: "", stderr: "" };
        }

        if (command === process.execPath) {
          return { stdout: "", stderr: "" };
        }

        throw new Error(`Unexpected command: ${joined}`);
      }
    });

    expect(result.processed).toBe(1);
    expect(result.results[0]).toMatchObject({
      id: "job-1",
      slug: "youtube-abc123",
      committed: true
    });

    const queue = await readQueueState(runtime.queuePath);
    expect(queue.jobs[0]?.status).toBe("succeeded");

    const manifest = await readManifest(runtime.manifestPath);
    expect(manifest.videos[0]?.slug).toBe("youtube-abc123");

    const article = await readFile(join(contentRoot, "youtube-abc123", "index.mdx"), "utf8");
    expect(article).toContain("title: 视频整理测试");
    expect(article).toContain("这是一次视频整理测试");

    const deployed = await readFile(join(root, "deploy", "current", "index.html"), "utf8");
    expect(deployed).toContain("video");
  });
});
