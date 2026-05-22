import {describe, expect, it} from "vitest";
import {loadPublisherConfig} from "../src/config";

describe("loadPublisherConfig", () => {
  it("resolves grouped source and vault paths with custom attribute names", async () => {
    const config = await loadPublisherConfig(
      new URL("./fixtures/config.json", import.meta.url),
      "/tmp/vision-blog"
    );

    expect(config.source.type).toBe("siyuan");
    expect(config.source).toMatchObject({
      notebookId: "demo-notebook",
      workspaceDir: "/tmp/vision-blog/SiYuan"
    });
    expect(config.vault).toEqual({
      rootDir: "/tmp/vision-blog/content/vault",
      postsDir: "posts",
      assetsDir: "assets"
    });
    expect(config.astroContentDir).toBe("/tmp/vision-blog/apps/blog/src/content/posts");
    expect(config.contentTargets).toEqual([
      {
        name: "vault",
        format: "quartz-markdown",
        rootDir: "/tmp/vision-blog/content/vault/posts"
      },
      {
        name: "astro",
        format: "astro-mdx",
        rootDir: "/tmp/vision-blog/apps/blog/src/content/posts"
      }
    ]);
    expect(config.attrs.publish).toBe("blog-pub");
    expect(config.attrs.category).toBeUndefined();
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

  it("accepts configs that omit the legacy category attr", async () => {
    const config = await loadPublisherConfig(
      new URL("./fixtures/config-without-category.json", import.meta.url),
      "/tmp/vision-blog"
    );

    expect(config.attrs.publish).toBe("blog-pub");
    expect(config.attrs.category).toBeUndefined();
  });

  it("keeps reading the legacy flat config structure during the migration", async () => {
    const legacyConfigUrl = new URL("./fixtures/config-legacy.json", import.meta.url);
    const config = await loadPublisherConfig(legacyConfigUrl, "/tmp/vision-blog");

    expect(config.source).toEqual({
      type: "siyuan",
      notebookId: "legacy-notebook",
      workspaceDir: "/tmp/vision-blog/LegacySiYuan"
    });
    expect(config.astroContentDir).toBeUndefined();
    expect(config.vault).toEqual({
      rootDir: "/tmp/vision-blog/apps/blog/src/content/posts",
      postsDir: ".",
      assetsDir: "."
    });
    expect(config.contentTargets).toEqual([
      {
        name: "astro",
        format: "astro-mdx",
        rootDir: "/tmp/vision-blog/apps/blog/src/content/posts"
      }
    ]);
  });
});
