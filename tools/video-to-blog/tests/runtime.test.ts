import { describe, expect, it } from "vitest";
import { resolveVideoToBlogRuntime } from "../src/runtime";

describe("resolveVideoToBlogRuntime", () => {
  it("derives workspace and state paths from the cli module location", () => {
    const runtime = resolveVideoToBlogRuntime({
      cwdPath: "/tmp/vision-blog/tools/video-to-blog",
      moduleUrl: new URL("file:///tmp/vision-blog/tools/video-to-blog/src/cli.ts")
    });

    expect(runtime.workspaceRoot).toBe("/tmp/vision-blog");
    expect(runtime.toolRoot).toBe("/tmp/vision-blog/tools/video-to-blog");
    expect(runtime.configPath).toBe("/tmp/vision-blog/tools/video-to-blog/video-to-blog.config.json");
    expect(runtime.queuePath).toBe("/tmp/vision-blog/.superpowers/video-to-blog/queue.json");
    expect(runtime.repoLockPath).toBe("/tmp/vision-blog/.superpowers/locks/repo.lock");
  });
});
