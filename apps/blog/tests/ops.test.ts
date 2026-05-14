import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("operations docs", () => {
  it("documents giscus environment variables for production setup", async () => {
    const readme = await readFile(resolve(process.cwd(), "../../README.md"), "utf8");
    const vercelSetup = await readFile(resolve(process.cwd(), "../../docs/runbooks/vercel-setup.md"), "utf8");

    expect(readme).toContain("GISCUS_REPO");
    expect(readme).toContain("GISCUS_REPO_ID");
    expect(vercelSetup).toContain("GISCUS_CATEGORY_ID");
  });

  it("keeps e2e in ci validation", async () => {
    const workflow = await readFile(resolve(process.cwd(), "../../.github/workflows/ci.yml"), "utf8");
    expect(workflow).toContain("pnpm e2e");
  });

  it("keeps CI installs reproducible and includes the workspace check step", async () => {
    const workflow = await readFile(resolve(process.cwd(), "../../.github/workflows/ci.yml"), "utf8");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("pnpm check");
  });

  it("keeps a root dev script for IDE-friendly local startup", async () => {
    const rootPackageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "../../package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };

    expect(rootPackageJson.scripts?.dev).toBe("pnpm --filter blog dev");
  });

  it("keeps root publish scripts for a copy-paste friendly workflow", async () => {
    const rootPackageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "../../package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };

    expect(rootPackageJson.scripts?.["publish:init"]).toBe("pnpm --filter publisher dev init");
    expect(rootPackageJson.scripts?.["publish:doctor"]).toBe("pnpm --filter publisher dev doctor");
    expect(rootPackageJson.scripts?.["publish:dry-run"]).toBe("pnpm --filter publisher dev sync --dry-run");
    expect(rootPackageJson.scripts?.["publish:sync"]).toBe("pnpm --filter publisher dev sync");
    expect(rootPackageJson.scripts?.["publish:server-run"]).toBe("node scripts/server-publish-cycle.mjs");
    expect(rootPackageJson.scripts?.["video:init"]).toBe("pnpm --filter video-to-blog dev init");
    expect(rootPackageJson.scripts?.["video:doctor"]).toBe("pnpm --filter video-to-blog dev doctor");
    expect(rootPackageJson.scripts?.["video:enqueue"]).toBe("pnpm --filter video-to-blog dev enqueue");
    expect(rootPackageJson.scripts?.["video:run"]).toBe("pnpm --filter video-to-blog dev run");
    expect(rootPackageJson.scripts?.["video:status"]).toBe("pnpm --filter video-to-blog dev status");
    expect(rootPackageJson.scripts?.["video:serve"]).toBe("pnpm --filter video-to-blog dev serve");
    expect(rootPackageJson.scripts?.["video:install"]).toBe("pnpm --filter video-to-blog dev server-install");
  });

  it("keeps a Chinese Siyuan publishing runbook aligned with the root commands", async () => {
    const runbook = await readFile(
      resolve(process.cwd(), "../../docs/runbooks/siyuan-publisher.md"),
      "utf8"
    );

    expect(runbook).toContain("思源");
    expect(runbook).toContain("pnpm publish:init");
    expect(runbook).toContain("pnpm publish:doctor");
    expect(runbook).toContain("pnpm publish:dry-run");
    expect(runbook).toContain("pnpm publish:sync");
    expect(runbook).toContain("pnpm publish:server-run");
    expect(runbook).toContain("服务器");
  });

  it("documents the video-to-blog workflow and root commands", async () => {
    const readme = await readFile(resolve(process.cwd(), "../../README.md"), "utf8");
    const runbook = await readFile(
      resolve(process.cwd(), "../../docs/runbooks/video-to-blog.md"),
      "utf8"
    );

    expect(readme).toContain("video-to-blog");
    expect(readme).toContain("pnpm video:init");
    expect(readme).toContain("pnpm video:enqueue --url <链接>");
    expect(runbook).toContain("yt-dlp");
    expect(runbook).toContain("faster-whisper");
    expect(runbook).toContain("OPENAI_API_KEY");
    expect(runbook).toContain("gpt-4o-transcribe");
    expect(runbook).toContain("pnpm video:run");
    expect(runbook).toContain("pnpm video:serve");
  });

  it("documents the private dashboard workflow and protected route setup", async () => {
    const readme = await readFile(resolve(process.cwd(), "../../README.md"), "utf8");
    const runbook = await readFile(
      resolve(process.cwd(), "../../docs/runbooks/private-dashboard.md"),
      "utf8"
    );
    const workflow = await readFile(
      resolve(process.cwd(), "../../.github/workflows/private-dashboard-refresh.yml"),
      "utf8"
    );
    const deployWorkflow = await readFile(
      resolve(process.cwd(), "../../.github/workflows/deploy.yml"),
      "utf8"
    );

    expect(readme).toContain("secret-dashboard");
    expect(readme).toContain("private:dashboard");
    expect(runbook).toContain("auth_basic");
    expect(runbook).toContain("UMAMI_BASE_URL");
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("pnpm private:dashboard");
    expect(deployWorkflow).toContain("pnpm private:dashboard");
  });

  it("documents the server-led publishing workflow", async () => {
    const readme = await readFile(resolve(process.cwd(), "../../README.md"), "utf8");
    const deployRunbook = await readFile(
      resolve(process.cwd(), "../../docs/runbooks/server-deploy.md"),
      "utf8"
    );
    const publishRunbook = await readFile(
      resolve(process.cwd(), "../../docs/runbooks/siyuan-publisher.md"),
      "utf8"
    );

    expect(readme).toContain("服务器主导");
    expect(readme).toContain("pnpm publish:server-run");
    expect(deployRunbook).toContain("systemd");
    expect(deployRunbook).toContain("publish:server-run");
    expect(publishRunbook).toContain("浏览器");
  });

  it("keeps the personal desk routes private and excluded from discovery surfaces", async () => {
    const astroConfig = await readFile(resolve(process.cwd(), "../blog/astro.config.mjs"), "utf8");
    const siteConfig = await readFile(resolve(process.cwd(), "../blog/site.config.mjs"), "utf8");

    expect(astroConfig).toContain('/desk/');
    expect(astroConfig).toContain('/desk/video/');
    expect(siteConfig).not.toContain('/desk/');
  });

  it("ships a mobile-first personal desk home with app-like entry cards", async () => {
    const page = await readFile(resolve(process.cwd(), "../blog/src/pages/desk/index.astro"), "utf8");

    expect(page).toContain('title="个人中控台');
    expect(page).toContain("/desk/video/");
    expect(page).toContain("/secret-dashboard/");
    expect(page).not.toContain("http://localhost:4321/secret-dashboard/index.html");
    expect(page).toContain("Vison Desk");
  });

  it("ships a dedicated video workspace under the personal desk", async () => {
    const page = await readFile(resolve(process.cwd(), "../blog/src/pages/desk/video.astro"), "utf8");
    const astroConfig = await readFile(resolve(process.cwd(), "../blog/astro.config.mjs"), "utf8");

    expect(page).toContain("视频转博客");
    expect(page).toContain("粘贴视频链接");
    expect(page).toContain("生成博客");
    expect(page).toContain("复制文本");
    expect(page).toContain("自动读取视频文字");
    expect(page).toContain("使用我提供的文本");
    expect(page).toContain("data-video-mode-button");
    expect(page).toContain('data-video-mode-panel="auto"');
    expect(page).toContain('data-video-mode-panel="manual"');
    expect(page).toContain("data-video-submit");
    expect(page).toContain("data-video-copy");
    expect(page).toContain("data-video-status");
    expect(page).toContain("/desk/");
    expect(page).toContain('const apiBaseUrl = "/video-api"');
    expect(page).not.toContain("http://127.0.0.1:4319");
    expect(astroConfig).toContain('"/video-api"');
    expect(astroConfig).toContain("http://127.0.0.1:4319");
  });
});
