import { access, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { enqueueVideoJob, readManifest, readQueueState, updateQueuedJob, writeJobSnapshot } from "./state.js";
import { fetchVideoMetadata, downloadAudioArtifact, downloadSubtitleArtifacts } from "./yt-dlp.js";
import { downloadBilibiliSubtitleArtifacts, fetchBilibiliMetadata as fetchBilibiliMetadataFallback } from "./bilibili.js";
import { transcribeVideo } from "./transcribe.js";
import { composeVideoArticle } from "./compose.js";
import { buildBlogArtifacts, deployLocalStaticSite } from "./deploy.js";
import { commitAndPushManagedPaths } from "./git.js";
import { findExistingVideoArticle, updatePublishedManifest, withManagedArticleTransaction } from "./publish.js";
import type { VideoToBlogConfig, VideoToBlogJob, VideoToBlogRuntime } from "./types.js";
import { runCommand } from "./process.js";
import { detectVideoPlatform } from "./platform.js";
import { buildTranscriptFromManualText } from "./manual-transcript.js";

function logRunStage(message: string) {
  console.error(`[video-to-blog] ${message}`);
}

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
  await run(config.ytDlpBin, [...config.ytDlpArgs, "--version"]);
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
  transcriptText,
  now = () => new Date().toISOString()
}: {
  runtime: VideoToBlogRuntime;
  url: string;
  transcriptText?: string;
  now?: () => string;
}) {
  const timestamp = now();
  const id = createHash("sha1").update(`${url}:${timestamp}`).digest("hex").slice(0, 12);
  await enqueueVideoJob(runtime.queuePath, {
    id,
    url,
    status: "queued",
    createdAt: timestamp,
    updatedAt: timestamp,
    transcriptText: transcriptText?.trim() || undefined
  });

  return { ok: true, id, url, manualTranscript: Boolean(transcriptText?.trim()) };
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

async function recycleRunningJobs(runtime: VideoToBlogRuntime) {
  const queue = await readQueueState(runtime.queuePath);
  const recycled = queue.jobs.filter((job) => job.status === "running");

  for (const job of recycled) {
    await setJobState({
      runtime,
      jobId: job.id,
      patch: {
        status: "queued",
        error: "Recovered from an interrupted previous run."
      }
    });
  }

  return recycled.length;
}

export async function runVideoQueue({
  config,
  runtime,
  env,
  run = runCommand,
  buildSite = buildBlogArtifacts,
  commitAndPush = commitAndPushManagedPaths,
  deploySite = deployLocalStaticSite,
  fetchBilibiliMetadata = fetchBilibiliMetadataFallback,
  downloadBilibiliSubtitles = downloadBilibiliSubtitleArtifacts,
  now = () => new Date().toISOString()
}: {
  config: VideoToBlogConfig;
  runtime: VideoToBlogRuntime;
  env: NodeJS.ProcessEnv;
  run?: typeof runCommand;
  buildSite?: typeof buildBlogArtifacts;
  commitAndPush?: typeof commitAndPushManagedPaths;
  deploySite?: typeof deployLocalStaticSite;
  fetchBilibiliMetadata?: typeof fetchBilibiliMetadataFallback;
  downloadBilibiliSubtitles?: typeof downloadBilibiliSubtitleArtifacts;
  now?: () => string;
}) {
  await recycleRunningJobs(runtime);
  const queue = await readQueueState(runtime.queuePath);
  const queuedJobs = queue.jobs.filter((job) => job.status === "queued");
  const results = [];

  for (const job of queuedJobs) {
    logRunStage(`start job=${job.id} url=${job.url}`);
    const started = await setJobState({
      runtime,
      jobId: job.id,
      patch: { status: "running", error: undefined }
    });
    const artifactRoot = join(runtime.jobsRoot, job.id);
    await mkdir(artifactRoot, { recursive: true });

    try {
      const platform = detectVideoPlatform(started.url);
      const subtitleRoot = resolve(artifactRoot, "subtitles");
      const audioRoot = resolve(artifactRoot, "audio");
      await mkdir(subtitleRoot, { recursive: true });
      await mkdir(audioRoot, { recursive: true });

      const requestJson = async (url: string, options?: { headers?: Record<string, string> }) => {
        const { stdout } = await run("curl", [
          "-fsSL",
          ...(options?.headers
            ? Object.entries(options.headers).flatMap(([key, value]) => ["-H", `${key}: ${value}`])
            : []),
          url
        ]);
        return JSON.parse(stdout) as unknown;
      };

      let metadata;
      let subtitleFiles: string[] = [];
      let audioPath: string | undefined;

      try {
        metadata = await fetchVideoMetadata({
          url: started.url,
          ytDlpBin: config.ytDlpBin,
          ytDlpArgs: config.ytDlpArgs,
          ytDlpArgsByPlatform: config.ytDlpArgsByPlatform,
          run
        });
        logRunStage(`job=${job.id} metadata=yt-dlp platform=${platform}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (platform !== "bilibili" || !message.includes("412")) {
          throw error;
        }

        logRunStage(`job=${job.id} metadata=bilibili-api-fallback`);
        metadata = await fetchBilibiliMetadata({
          url: started.url,
          requestJson
        });
        subtitleFiles = await downloadBilibiliSubtitles({
          url: started.url,
          outputRoot: subtitleRoot,
          requestJson
        });
      }

      await writeFile(join(artifactRoot, "metadata.json"), JSON.stringify(metadata, null, 2), "utf8");

      const transcript = started.transcriptText
        ? (() => {
            logRunStage(`job=${job.id} transcript=manual`);
            return buildTranscriptFromManualText(started.transcriptText);
          })()
        : await (async () => {
            if (!subtitleFiles.length) {
              subtitleFiles = await downloadSubtitleArtifacts({
                url: started.url,
                ytDlpBin: config.ytDlpBin,
                ytDlpArgs: config.ytDlpArgs,
                ytDlpArgsByPlatform: config.ytDlpArgsByPlatform,
                outputRoot: subtitleRoot,
                run
              }).catch(() => []);
              if (subtitleFiles.length) {
                logRunStage(`job=${job.id} transcript=subtitle files=${subtitleFiles.length}`);
              }
            }

            if (!subtitleFiles.length) {
              logRunStage(`job=${job.id} transcript=asr-audio-download`);
              audioPath = await downloadAudioArtifact({
                url: started.url,
                ytDlpBin: config.ytDlpBin,
                ytDlpArgs: config.ytDlpArgs,
                ytDlpArgsByPlatform: config.ytDlpArgsByPlatform,
                outputRoot: audioRoot,
                run
              });
            }

            return transcribeVideo({
              subtitleFiles,
              audioPath,
              pythonBin: config.pythonBin,
              whisperModel: config.whisperModel,
              toolRoot: runtime.toolRoot,
              run
            });
          })();

      const transcriptPath = join(artifactRoot, "transcript.json");
      await import("node:fs/promises").then(({ writeFile }) =>
        writeFile(transcriptPath, JSON.stringify(transcript, null, 2), "utf8")
      );
      logRunStage(`job=${job.id} transcript=saved path=${transcriptPath}`);

      logRunStage(`job=${job.id} existing-article=scan-start`);
      const existing = await findExistingVideoArticle(config.contentRoot, metadata.webpageUrl);
      logRunStage(`job=${job.id} existing-article=scan-done slug=${existing?.slug ?? "none"}`);
      const article = composeVideoArticle({
        metadata,
        transcript,
        slugOverride: existing?.slug,
        now
      });
      logRunStage(`job=${job.id} article=composed slug=${article.slug}`);

      logRunStage(`job=${job.id} transaction=enter`);
      const deployment = await withManagedArticleTransaction({
        runtime,
        article,
        task: async ({ markPersisted }) => {
          logRunStage(`job=${job.id} build=start skipCheck=${env.VIDEO_TO_BLOG_SKIP_CHECK === "1"}`);
          await buildSite({
            workspaceRoot: runtime.workspaceRoot,
            skipCheck: env.VIDEO_TO_BLOG_SKIP_CHECK === "1",
            run
          });
          logRunStage(`job=${job.id} build=done`);

          logRunStage(`job=${job.id} git=commit-push-start`);
          const commitResult = await commitAndPush({
            repoRoot: runtime.workspaceRoot,
            branch: env.VIDEO_TO_BLOG_BRANCH ?? "master",
            remote: env.VIDEO_TO_BLOG_REMOTE ?? "origin",
            message: `feat(video): publish ${article.slug}`,
            includePaths: [config.contentRoot],
            authorName: env.VIDEO_TO_BLOG_GIT_AUTHOR_NAME ?? "Vision Video Bot",
            authorEmail: env.VIDEO_TO_BLOG_GIT_AUTHOR_EMAIL ?? "vision-video-bot@users.noreply.github.com"
          });
          logRunStage(`job=${job.id} git=commit-push-done committed=${commitResult.committed} pushed=${commitResult.pushed}`);
          markPersisted();

          logRunStage(`job=${job.id} deploy=start`);
          await deploySite({
            distDir: join(runtime.workspaceRoot, "apps/blog/dist"),
            deployRoot: config.deployRoot,
            releaseId: now().replace(/[:.]/g, "-"),
          });
          logRunStage(`job=${job.id} deploy=done`);

          await updatePublishedManifest({
            runtime,
            metadata,
            slug: article.slug,
            now: now()
          });
          logRunStage(`job=${job.id} manifest=updated slug=${article.slug}`);

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
      logRunStage(`job=${job.id} done status=succeeded slug=${article.slug}`);
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
      logRunStage(`job=${job.id} done status=failed error=${message}`);
    }
  }

  return {
    ok: true,
    processed: results.length,
    results
  };
}
