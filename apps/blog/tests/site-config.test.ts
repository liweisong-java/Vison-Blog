import { describe, expect, it, vi } from "vitest";

describe("site config", () => {
  it("reads site and giscus settings from environment variables", async () => {
    vi.stubEnv("SITE_URL", "https://blog.example.com");
    vi.stubEnv("GISCUS_REPO", "vision/blog");
    vi.stubEnv("GISCUS_REPO_ID", "repo_123");
    vi.stubEnv("GISCUS_CATEGORY", "General");
    vi.stubEnv("GISCUS_CATEGORY_ID", "cat_456");
    vi.stubEnv("GISCUS_MAPPING", "pathname");
    vi.stubEnv("GISCUS_THEME", "preferred_color_scheme");

    const mod = await import("../site.config.mjs");

    expect(mod.siteConfig.siteUrl).toBe("https://blog.example.com");
    expect(mod.siteConfig.giscus.repo).toBe("vision/blog");
    expect(mod.siteConfig.giscus.repoId).toBe("repo_123");
    expect(mod.siteConfig.giscus.category).toBe("General");
    expect(mod.siteConfig.giscus.categoryId).toBe("cat_456");
    expect(mod.isGiscusConfigured(mod.siteConfig.giscus)).toBe(true);

    vi.unstubAllEnvs();
  });
});
