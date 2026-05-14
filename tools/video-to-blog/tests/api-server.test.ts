import { describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import { request } from "node:http";

describe("video-to-blog api server", () => {
  it("accepts submit requests and returns a task summary", async () => {
    const enqueueVideo = vi.fn(async () => ({
      ok: true,
      id: "job-123",
      url: "https://www.bilibili.com/video/BV1GJ411x7h7",
      manualTranscript: true
    }));
    const getVideoToBlogStatus = vi.fn(async () => ({
      ok: true,
      queueSize: 1,
      pending: 1,
      publishedVideos: 1
    }))
      .mockResolvedValueOnce({
        ok: true,
        queueSize: 1,
        pending: 1,
        publishedVideos: 0
      })
      .mockResolvedValueOnce({
        ok: true,
        queueSize: 1,
        pending: 0,
        publishedVideos: 1
      });
    const runVideoQueue = vi.fn(async () => ({
      ok: true,
      processed: 1,
      results: [{ id: "job-123", slug: "demo-post", committed: true }]
    }));

    const { createVideoToBlogRequestHandler } = await import("../src/api-server");
    const handler = createVideoToBlogRequestHandler({
      enqueueVideo,
      getVideoToBlogStatus,
      runVideoQueue,
      runtime: {} as never,
      config: {} as never,
      env: {}
    });

    const req = createRequest(
      "/submit",
      "POST",
      JSON.stringify({
        url: "https://www.bilibili.com/video/BV1GJ411x7h7",
        transcript: "第一段整理内容。"
      })
    );
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(enqueueVideo).toHaveBeenCalledOnce();
    expect(runVideoQueue).toHaveBeenCalledOnce();
    expect(JSON.parse(res.body)).toMatchObject({
      ok: true,
      job: { id: "job-123" },
      result: { processed: 1 },
      status: { queueSize: 1 }
    });
  });

  it("returns queue status for status requests", async () => {
    const getVideoToBlogStatus = vi.fn(async () => ({
      ok: true,
      queueSize: 2,
      pending: 1,
      publishedVideos: 4
    }));

    const { createVideoToBlogRequestHandler } = await import("../src/api-server");
    const handler = createVideoToBlogRequestHandler({
      enqueueVideo: vi.fn(),
      getVideoToBlogStatus,
      runVideoQueue: vi.fn(),
      runtime: {} as never,
      config: {} as never,
      env: {}
    });

    const req = createRequest("/status", "GET");
    const res = createResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(getVideoToBlogStatus).toHaveBeenCalledOnce();
    expect(JSON.parse(res.body)).toMatchObject({
      ok: true,
      status: {
        queueSize: 2,
        pending: 1
      }
    });
  });

  it("keeps the latest result available across requests after the api server starts", async () => {
    const enqueueVideo = vi.fn(async () => ({
      ok: true,
      id: "job-123",
      url: "https://www.bilibili.com/video/BV1GJ411x7h7",
      manualTranscript: true
    }));
    const getVideoToBlogStatus = vi.fn(async () => ({
      ok: true,
      queueSize: 1,
      pending: 0,
      publishedVideos: 1
    }))
      .mockResolvedValueOnce({
        ok: true,
        queueSize: 1,
        pending: 1,
        publishedVideos: 0
      })
      .mockResolvedValueOnce({
        ok: true,
        queueSize: 1,
        pending: 0,
        publishedVideos: 1
      })
      .mockResolvedValue({
        ok: true,
        queueSize: 1,
        pending: 0,
        publishedVideos: 1
      });
    const runVideoQueue = vi.fn(async () => ({
      ok: true,
      processed: 1,
      results: [{ id: "job-123", slug: "demo-post", committed: true }]
    }));

    const { startVideoToBlogApiServer } = await import("../src/api-server");
    const server = await startVideoToBlogApiServer({
      host: "127.0.0.1",
      port: 0,
      enqueueVideo,
      getVideoToBlogStatus,
      runVideoQueue,
      runtime: {} as never,
      config: {} as never,
      env: {}
    });

    try {
      const submitPayload = await sendJsonRequest(server.port, "/submit", "POST", {
        url: "https://www.bilibili.com/video/BV1GJ411x7h7",
        transcript: "第一段整理内容。"
      });

      expect(submitPayload).toMatchObject({
        ok: true,
        result: {
          processed: 1
        }
      });

      const statusPayload = await sendJsonRequest(server.port, "/status", "GET");
      expect(statusPayload).toMatchObject({
        ok: true,
        lastResult: {
          processed: 1,
          results: [{ slug: "demo-post" }]
        }
      });
    } finally {
      await server.close();
    }
  });

  it("translates douyin cookie failures into a readable api message", async () => {
    const { startVideoToBlogApiServer } = await import("../src/api-server");
    const server = await startVideoToBlogApiServer({
      host: "127.0.0.1",
      port: 0,
      enqueueVideo: vi.fn(async () => ({
        ok: true,
        id: "job-123",
        url: "https://v.douyin.com/f9_XaJ6rOB0/",
        manualTranscript: false
      })),
      getVideoToBlogStatus: vi.fn(async () => ({
        ok: true,
        queueSize: 1,
        pending: 1,
        publishedVideos: 0
      })),
      runVideoQueue: vi.fn(async () => {
        throw new Error(
          "Command failed: yt-dlp --dump-single-json --no-warnings --skip-download https://v.douyin.com/f9_XaJ6rOB0/\nERROR: [Douyin] 7639300730813156659: Fresh cookies (not necessarily logged in) are needed\n"
        );
      }),
      runtime: {} as never,
      config: {} as never,
      env: {}
    });

    try {
      const parsed = await sendJsonRequest(server.port, "/submit", "POST", {
        url: "https://v.douyin.com/f9_XaJ6rOB0/"
      });

      expect(parsed.message).toContain("抖音当前要求更有效的浏览器会话");
    } finally {
      await server.close();
    }
  });

  it("treats queued job failures as api failures instead of fake success", async () => {
    const { startVideoToBlogApiServer } = await import("../src/api-server");
    const server = await startVideoToBlogApiServer({
      host: "127.0.0.1",
      port: 0,
      enqueueVideo: vi.fn(async () => ({
        ok: true,
        id: "job-456",
        url: "https://v.douyin.com/f9_XaJ6rOB0/",
        manualTranscript: false
      })),
      getVideoToBlogStatus: vi.fn(async () => ({
        ok: true,
        queueSize: 1,
        pending: 0,
        publishedVideos: 0
      }))
        .mockResolvedValueOnce({
          ok: true,
          queueSize: 1,
          pending: 1,
          publishedVideos: 0
        })
        .mockResolvedValueOnce({
          ok: true,
          queueSize: 1,
          pending: 0,
          publishedVideos: 0
        }),
      runVideoQueue: vi.fn(async () => ({
        ok: true,
        processed: 1,
        results: [
          {
            id: "job-456",
            error:
              "Command failed: yt-dlp --dump-single-json --no-warnings --skip-download https://v.douyin.com/f9_XaJ6rOB0/\nERROR: [Douyin] 7639300730813156659: Fresh cookies (not necessarily logged in) are needed\n"
          }
        ]
      })),
      runtime: {} as never,
      config: {} as never,
      env: {}
    });

    try {
      const response = await sendRawJsonRequest(server.port, "/submit", "POST", {
        url: "https://v.douyin.com/f9_XaJ6rOB0/"
      });

      expect(response.statusCode).toBe(422);
      expect(response.payload.ok).toBe(false);
      expect(response.payload.message).toContain("抖音当前要求更有效的浏览器会话");
    } finally {
      await server.close();
    }
  });
});

function createRequest(url: string, method: string, body = "") {
  const req = new EventEmitter() as EventEmitter & {
    url: string;
    method: string;
    headers: Record<string, string>;
  };

  req.url = url;
  req.method = method;
  req.headers = { "content-type": "application/json" };

  queueMicrotask(() => {
    if (body) {
      req.emit("data", Buffer.from(body));
    }
    req.emit("end");
  });

  return req;
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: "",
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    end(chunk?: string) {
      if (chunk) {
        this.body += chunk;
      }
    }
  };
}

async function sendJsonRequest(
  port: number,
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) {
  const response = await sendRawJsonRequest(port, path, method, body);
  return response.payload;
}

async function sendRawJsonRequest(
  port: number,
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload)
            }
          : undefined
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          try {
            resolve({
              statusCode: res.statusCode ?? 0,
              payload: JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>
            } as unknown as Record<string, unknown>);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}
