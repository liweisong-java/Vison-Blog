import { describe, expect, it } from "vitest";
import { resolvePublisherRuntime } from "../src/runtime";

describe("resolvePublisherRuntime", () => {
  it("derives the workspace root from the cli module location instead of the current working directory", () => {
    const runtime = resolvePublisherRuntime({
      cwdPath: "/tmp/vision-blog/tools/publisher",
      moduleUrl: new URL("file:///tmp/vision-blog/tools/publisher/src/cli.ts")
    });

    expect(runtime.workspaceRoot).toBe("/tmp/vision-blog");
    expect(runtime.publisherRoot).toBe("/tmp/vision-blog/tools/publisher");
    expect(runtime.configPath).toBe("/tmp/vision-blog/tools/publisher/publisher.config.json");
    expect(runtime.envPath).toBe("/tmp/vision-blog/tools/publisher/.env");
    expect(runtime.publisherStatePath).toBe("/tmp/vision-blog/.superpowers/private-dashboard/publisher-state.json");
  });

  it("accepts import.meta.url style file URL strings from the real CLI runtime", () => {
    const runtime = resolvePublisherRuntime({
      cwdPath: "/tmp/vision-blog/tools/publisher",
      moduleUrl: "file:///tmp/vision-blog/tools/publisher/src/cli.ts"
    });

    expect(runtime.workspaceRoot).toBe("/tmp/vision-blog");
    expect(runtime.publisherRoot).toBe("/tmp/vision-blog/tools/publisher");
    expect(runtime.configPath).toBe("/tmp/vision-blog/tools/publisher/publisher.config.json");
    expect(runtime.envPath).toBe("/tmp/vision-blog/tools/publisher/.env");
    expect(runtime.publisherStatePath).toBe("/tmp/vision-blog/.superpowers/private-dashboard/publisher-state.json");
  });

  it("resolves an explicit PUBLISHER_CONFIG relative to the invocation directory", () => {
    const runtime = resolvePublisherRuntime({
      cwdPath: "/tmp/vision-blog/tools/publisher",
      moduleUrl: new URL("file:///tmp/vision-blog/tools/publisher/src/cli.ts"),
      configOverride: "./publisher.config.local.json"
    });

    expect(runtime.configPath).toBe("/tmp/vision-blog/tools/publisher/publisher.config.local.json");
  });
});
