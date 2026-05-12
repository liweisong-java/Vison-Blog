import { describe, expect, it } from "vitest";
import { loadPublisherConfig } from "../src/config";

describe("loadPublisherConfig", () => {
  it("resolves absolute paths and custom attribute names", async () => {
    const config = await loadPublisherConfig(
      new URL("./fixtures/config.json", import.meta.url),
      "/tmp/vision-blog"
    );

    expect(config.contentRoot).toBe("/tmp/vision-blog/apps/blog/src/content/posts");
    expect(config.attrs.publish).toBe("blog-pub");
  });

  it("supports optional publishing extensions", async () => {
    const config = await loadPublisherConfig(
      new URL("./fixtures/config.json", import.meta.url),
      "/tmp/vision-blog"
    );

    expect(config.deployHookUrl).toBe("https://example.com/deploy-hook");
    expect(config.wechatExportDir).toBe("/tmp/vision-blog/exports/wechat");
    expect(config.localDeployRoot).toBe("/data/Vison-Blog");
  });
});
