import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { VideoToBlogConfig, VideoToBlogRuntime } from "./types.js";

type SubmitPayload = {
  url: string;
  transcript?: string;
};

type ApiServerDeps = {
  runtime: VideoToBlogRuntime;
  config: VideoToBlogConfig;
  env: NodeJS.ProcessEnv;
  enqueueVideo: (input: {
    runtime: VideoToBlogRuntime;
    url: string;
    transcriptText?: string;
  }) => Promise<{ ok: boolean; id: string; url: string; manualTranscript: boolean }>;
  runVideoQueue: (input: {
    config: VideoToBlogConfig;
    runtime: VideoToBlogRuntime;
    env: NodeJS.ProcessEnv;
  }) => Promise<{
    ok: boolean;
    processed: number;
    results: Array<Record<string, unknown>>;
  }>;
  getVideoToBlogStatus: (runtime: VideoToBlogRuntime) => Promise<Record<string, unknown>>;
};

function normalizeApiErrorMessage(message: string) {
  if (message.includes("Fresh cookies") && message.includes("Douyin")) {
    return "抖音当前要求更有效的浏览器会话，自动提取暂时失败。请先在本机 Chrome 中正常打开这个视频，或切换到“使用我提供的文本”模式。";
  }

  if (message.includes("spawn yt-dlp ENOENT")) {
    return "本机还没有安装 yt-dlp，当前无法自动提取视频文字。";
  }

  if (message.includes("faster_whisper") || message.includes("faster-whisper")) {
    return "本机还没有可用的转写环境，当前无法自动识别音频内容。";
  }

  return message;
}

export function createVideoToBlogRequestHandler(deps: ApiServerDeps) {
  let lastResult: { processed: number; results: Array<Record<string, unknown>> } | null = null;
  let lastError: string | null = null;
  let activeRun: Promise<{ processed: number; results: Array<Record<string, unknown>> }> | null = null;

  const ensureQueueDrained = async () => {
    if (activeRun) {
      return activeRun;
    }

    activeRun = (async () => {
      let totalProcessed = 0;
      const mergedResults: Array<Record<string, unknown>> = [];

      try {
        while (true) {
          const before = await deps.getVideoToBlogStatus(deps.runtime);
          const pending = typeof before.pending === "number" ? before.pending : 0;
          if (pending <= 0) {
            break;
          }

          const current = await deps.runVideoQueue({
            config: deps.config,
            runtime: deps.runtime,
            env: deps.env
          });
          totalProcessed += current.processed;
          mergedResults.push(...current.results);

          const after = await deps.getVideoToBlogStatus(deps.runtime);
          const pendingAfter = typeof after.pending === "number" ? after.pending : 0;
          if (pendingAfter <= 0) {
            break;
          }
        }

        lastResult = {
          processed: totalProcessed,
          results: mergedResults
        };
        lastError = readLatestFailureMessage(lastResult?.results ?? []);
        return lastResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        lastError = normalizeApiErrorMessage(message);
        throw error;
      } finally {
        activeRun = null;
      }
    })();

    return activeRun;
  };

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;

    if (req.method === "GET" && pathname === "/status") {
      const status = await deps.getVideoToBlogStatus(deps.runtime);
      writeJson(res, 200, {
        ok: true,
        status,
        running: Boolean(activeRun),
        lastResult,
        lastError
      });
      return;
    }

    if (req.method === "POST" && pathname === "/submit") {
      const payload = parseSubmitPayload(await readJsonBody(req));
      const job = await deps.enqueueVideo({
        runtime: deps.runtime,
        url: payload.url,
        transcriptText: payload.transcript
      });
      const result = await ensureQueueDrained();
      const status = await deps.getVideoToBlogStatus(deps.runtime);
      const failureMessage = readJobFailureMessage(result.results, job.id);

      if (failureMessage) {
        writeJson(res, 422, {
          ok: false,
          job,
          result,
          status,
          message: failureMessage
        });
        return;
      }

      writeJson(res, 200, {
        ok: true,
        job,
        result,
        status
      });
      return;
    }

    writeJson(res, 404, {
      ok: false,
      message: "Not found"
    });
  };
}

export function startVideoToBlogApiServer(
  deps: ApiServerDeps & {
    host?: string;
    port?: number;
  }
) {
  const host = deps.host ?? "127.0.0.1";
  const port = deps.port ?? 4319;
  const handler = createVideoToBlogRequestHandler(deps);
  const server = createServer((req, res) => {
    void handler(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      writeJson(res, 500, {
        ok: false,
        message: normalizeApiErrorMessage(message)
      });
    });
  });

  return new Promise<{ host: string; port: number; close: () => Promise<void> }>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const resolvedPort =
        address && typeof address === "object" && typeof address.port === "number" ? address.port : port;
      resolve({
        host,
        port: resolvedPort,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }
              closeResolve();
            });
          })
      });
    });
  });
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve());
    req.on("error", reject);
  });

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw) as unknown;
}

function parseSubmitPayload(input: unknown): SubmitPayload {
  if (!input || typeof input !== "object") {
    throw new Error("提交内容格式不正确。");
  }

  const payload = input as Record<string, unknown>;
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const transcript = typeof payload.transcript === "string" ? payload.transcript.trim() : undefined;

  if (!url) {
    throw new Error("缺少视频链接。");
  }

  return {
    url,
    transcript
  };
}

function setCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function writeJson(res: ServerResponse, status: number, value: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(value, null, 2));
}

function readJobFailureMessage(results: Array<Record<string, unknown>>, jobId: string) {
  const match = results.find((entry) => entry.id === jobId);
  if (!match || typeof match.error !== "string" || !match.error.trim()) {
    return null;
  }

  return normalizeApiErrorMessage(match.error);
}

function readLatestFailureMessage(results: Array<Record<string, unknown>>) {
  for (let index = results.length - 1; index >= 0; index -= 1) {
    const entry = results[index];
    if (typeof entry?.error === "string" && entry.error.trim()) {
      return normalizeApiErrorMessage(entry.error);
    }
  }

  return null;
}
