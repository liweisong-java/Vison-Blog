import { describe, expect, it } from "vitest";
import { loadVideoToBlogConfig } from "../src/config";

describe("loadVideoToBlogConfig", () => {
  it("resolves configured paths relative to the repository root", async () => {
    const config = await loadVideoToBlogConfig(
      new URL("./fixtures/config.json", import.meta.url),
      "/tmp/vision-blog"
    );

    expect(config.contentRoot).toBe("/tmp/vision-blog/apps/blog/src/content/posts");
    expect(config.stateRoot).toBe("/tmp/vision-blog/.superpowers/video-to-blog");
    expect(config.deployRoot).toBe("/data/Vison-Blog");
    expect(config.tempRoot).toBe("/tmp/vision-blog/.superpowers/video-to-blog/tmp");
  });
});
