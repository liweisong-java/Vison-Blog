import { access, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { enqueueVideoJob, readManifest, readQueueState, updateQueuedJob, writeJobSnapshot } from "./state.js";
import { fetchVideoMetadata, downloadAudioArtifact, downloadSubtitleArtifacts } from "./yt-dlp.js";
import { transcribeVideo } from "./transcribe.js";
import { composeVideoArticle } from "./compose.js";
import { buildBlogArtifacts, deployLocalStaticSite } from "./deploy.js";
import { commitAndPushManagedPaths } from "./git.js";
import { findExistingVideoArticle, updatePublishedManifest, withManagedArticleTransaction } from "./publish.js";
import type { VideoToBlogConfig, VideoToBlogJob, VideoToBlogRuntime } from "./types.js";
import { runCommand } from "./process.js";

export async function doctorVideoToBlog({
  config,
  runtime,
  run = runCommand
}: {
  config: VideoToBlogConfig;
  runtime: VideoToBlogRuntime;
  run?: typeof runCommand;
}) {
  await access(config.contentRoot);
  await run(config.ytDlpBin, ["--version"]);
  await run(config.pythonBin, ["-c", "import faster_whisper"]);

  return {
    ok: true,
    contentRoot: config.contentRoot,
    stateRoot: config.stateRoot,
    deployRoot: config.deployRoot,
    ytDlpBin: config.ytDlpBin,
    pythonBin: config.pythonBin,
    whisperModel: config.whisperModel,
    queuePath: runtime.queuePath,
    manifestPath: runtime.manifestPath
  };
}

export async function enqueueVideo({
  runtime,
  url,
  now = () => new Date().toISOString()
}: {
  runtime: VideoToBlogRuntime;
  url: string;
  now?: () => string;
}) {
  const timestamp = now();
  const id = createHash("sha1").update(`${url}:${timestamp}`).digest("hex").slice(0, 12);
  await enqueueVideoJob(runtime.queuePath, {
    id,
    url,
    status: "queued",
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return { ok: true, id, url };
}

export async function getVideoToBlogStatus(runtime: VideoToBlogRuntime) {
  const queue = await readQueueState(runtime.queuePath);
  const manifest = await readManifest(runtime.manifestPath);
  const pending = queue.jobs.filter((job) => job.status === "queued" || job.status === "running").length;

  return {
    ok: true,
    queueSize: queue.jobs.length,
    pending,
    publishedVideos: manifest.videos.length,
    queuePath: runtime.queuePath,
    manifestPath: runtime.manifestPath
  };
}

async function setJobState({
  runtime,
  jobId,
  patch
}: {
  runtime: VideoToBlogRuntime;
  jobId: string;
  patch: Partial<VideoToBlogJob>;
}) {
  const updated = await updateQueuedJob(runtime.queuePath, jobId, (job) => ({
    ...job,
    ...patch,
    updatedAt: new Date().toISOString()
  }));

  if (!updated) {
    throw new Error(`Queue job not found: ${jobId}`);
  }

  await writeJobSnapshot(runtime.jobsRoot, updated);
  return updated;
}

export async function runVideoQueue({
  config,
  runtime,
  env,
  run = runCommand,
  buildSite = buildBlogArtifacts,
  commitAndPush = commitAndPushManagedPaths,
  deploySite = deployLocalStaticSite,
  now = () => new Date().toISOString()
}: {
  config: VideoToBlogConfig;
  runtime: VideoToBlogRuntime;
  env: NodeJS.ProcessEnv;
  run?: typeof runCommand;
  buildSite?: typeof buildBlogArtifacts;
  commitAndPush?: typeof commitAndPushManagedPaths;
  deploySite?: typeof deployLocalStaticSite;
  now?: () => string;
}) {
  const queue = await readQueueState(runtime.queuePath);
  const queuedJobs = queue.jobs.filter((job) => job.status === "queued");
  const results = [];

  for (const job of queuedJobs) {
    const started = await setJobState({
      runtime,
      jobId: job.id,
      patch: { status: "running", error: undefined }
    });
    const artifactRoot = join(runtime.jobsRoot, job.id);
    await mkdir(artifactRoot, { recursive: true });

    try {
      const metadata = await fetchVideoMetadata({
        url: started.url,
        ytDlpBin: config.ytDlpBin,
        run
      });
      await writeFile(join(artifactRoot, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

      const subtitleRoot = resolve(artifactRoot, "subtitles");
      const audioRoot = resolve(artifactRoot, "audio");
      await mkdir(subtitleRoot, { recursive: true });
      await mkdir(audioRoot, { recursive: true });

      const subtitleFiles = await downloadSubtitleArtifacts({
        url: started.url,
        ytDlpBin: config.ytDlpBin,
        outputRoot: subtitleRoot,
        run
      }).catch(() => []);

      const audioPath = subtitleFiles.length
        ? undefined
        : await downloadAudioArtifact({
            url: started.url,
            ytDlpBin: config.ytDlpBin,
            outputRoot: audioRoot,
            run
          });

      const transcript = await transcribeVideo({
        subtitleFiles,
        audioPath,
        pythonBin: config.pythonBin,
        whisperModel: config.whisperModel,
        toolRoot: runtime.toolRoot,
        run
      });

      const transcriptPath = join(artifactRoot, "transcript.json");
      await import("node:fs/promises").then(({ writeFile }) =>
        writeFile(transcriptPath, JSON.stringify(transcript, null, 2), "utf8")
      );

      const existing = await findExistingVideoArticle(config.contentRoot, metadata.webpageUrl);
      const article = composeVideoArticle({
        metadata,
        transcript,
        slugOverride: existing?.slug,
        now
      });

      const deployment = await withManagedArticleTransaction({
        runtime,
        article,
        task: async ({ markPersisted }) => {
          await buildSite({
            workspaceRoot: runtime.workspaceRoot,
            run
          });

          const commitResult = await commitAndPush({
            repoRoot: runtime.workspaceRoot,
            branch: env.VIDEO_TO_BLOG_BRANCH ?? "master",
            remote: env.VIDEO_TO_BLOG_REMOTE ?? "origin",
            message: `feat(video): publish ${article.slug}`,
            includePaths: [config.contentRoot]
          });
          markPersisted();

          await deploySite({
            distDir: join(runtime.workspaceRoot, "apps/blog/dist"),
            deployRoot: config.deployRoot,
            releaseId: now().replace(/[:.]/g, "-"),
          });

          await updatePublishedManifest({
            runtime,
            metadata,
            slug: article.slug,
            now: now()
          });

          return commitResult;
        }
      });

      const finished = await setJobState({
        runtime,
        jobId: job.id,
        patch: {
          status: "succeeded",
          slug: article.slug
        }
      });

      results.push({
        id: finished.id,
        slug: article.slug,
        committed: deployment.committed
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await setJobState({
        runtime,
        jobId: job.id,
        patch: {
          status: "failed",
          error: message
        }
      });
      results.push({
        id: job.id,
        error: message
      });
    }
  }

  return {
    ok: true,
    processed: results.length,
    results
  };
}
