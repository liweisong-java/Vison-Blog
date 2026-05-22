import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {describe, expect, it} from "vitest";

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

  it("keeps root quartz scripts for local startup", async () => {
    const rootPackageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "../../package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };

    expect(rootPackageJson.scripts?.["dev:quartz"]).toBe("pnpm --filter quartz dev");
    expect(rootPackageJson.scripts?.["build:quartz"]).toBe("pnpm --filter quartz build");
  });

  it("keeps quartz in the root verification commands", async () => {
    const rootPackageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "../../package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };

    expect(rootPackageJson.scripts?.test).toContain("pnpm --filter quartz test");
    expect(rootPackageJson.scripts?.check).toContain("pnpm --filter quartz build");
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

    it("ships a scheduled GitHub Actions cleanup workflow with a Chinese runbook", async () => {
        const readme = await readFile(resolve(process.cwd(), "../../README.md"), "utf8");
        const runbook = await readFile(
            resolve(process.cwd(), "../../docs/runbooks/actions-cleanup.md"),
            "utf8"
        );
        const workflow = await readFile(
            resolve(process.cwd(), "../../.github/workflows/actions-cleanup.yml"),
            "utf8"
        );

        expect(readme).toContain("actions-cleanup");
        expect(runbook).toContain("workflow runs");
        expect(runbook).toContain("dry_run");
        expect(workflow).toContain("schedule:");
        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("deleteWorkflowRun");
        expect(workflow).toContain("actions: write");
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
    expect(siteConfig).not.toContain('/desk/');
  });

  it("ships a mobile-first personal desk home with app-like entry cards", async () => {
    const page = await readFile(resolve(process.cwd(), "../blog/src/pages/desk/index.astro"), "utf8");

    expect(page).toContain('title="个人中控台');
    expect(page).toContain("/secret-dashboard/");
    expect(page).not.toContain("http://localhost:4321/secret-dashboard/index.html");
    expect(page).toContain("Vison Desk");
  });

  it("keeps quartz and vault directories for the migration path", async () => {
    const workspacePackageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "../../package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };

    await expect(readFile(resolve(process.cwd(), "../../apps/quartz/package.json"), "utf8")).resolves.toContain(
      '"name": "quartz"'
    );
    await expect(readFile(resolve(process.cwd(), "../../content/vault/posts/.gitkeep"), "utf8")).resolves.toBe("");
    await expect(readFile(resolve(process.cwd(), "../../content/vault/assets/.gitkeep"), "utf8")).resolves.toBe("");
    expect(workspacePackageJson.scripts?.["dev:quartz"]).toBe("pnpm --filter quartz dev");
  });

  it("keeps quartz pointed at the shared vault posts directory", async () => {
    const quartzPackageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "../../apps/quartz/package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };
    const quartzReadme = await readFile(resolve(process.cwd(), "../../apps/quartz/README.md"), "utf8");

    expect(quartzPackageJson.scripts?.dev).toContain("../../content/vault/posts");
    expect(quartzPackageJson.scripts?.build).toContain("../../content/vault/posts");
    expect(quartzReadme).toContain("content/vault/posts");
  });

  it("ignores generated quartz build output from git", async () => {
    const gitignore = await readFile(resolve(process.cwd(), "../../.gitignore"), "utf8");

    expect(gitignore).toContain("apps/quartz/public/");
    expect(gitignore).toContain("apps/quartz/.quartz-cache/");
  });

  it("ships a real Chinese quartz home instead of a migration placeholder", async () => {
    const homeEntry = await readFile(resolve(process.cwd(), "../../content/vault/posts/index.md"), "utf8");

    expect(homeEntry).not.toContain("Quartz 迁移骨架已经接入");
    expect(homeEntry).not.toContain("首页占位文件");
    expect(homeEntry).toContain("伟松的博客");
  });

  it("backfills existing Astro posts into the shared quartz vault", async () => {
    const daoPost = await readFile(
      resolve(process.cwd(), "../../content/vault/posts/on-dao-notes/index.md"),
      "utf8"
    );
    const agentPost = await readFile(
      resolve(process.cwd(), "../../content/vault/posts/agent/index.md"),
      "utf8"
    );

    expect(daoPost).toContain("title: 天道・五台山论道");
    expect(agentPost).toContain("title: Agent上下文维护的工业级三层架构与实践");
  });

  it("keeps the quartz shell free from default framework chrome", async () => {
    const layout = await readFile(resolve(process.cwd(), "../../apps/quartz/quartz.layout.ts"), "utf8");
    const footer = await readFile(resolve(process.cwd(), "../../apps/quartz/quartz/components/Footer.tsx"), "utf8");
    const customScss = await readFile(
      resolve(process.cwd(), "../../apps/quartz/quartz/styles/custom.scss"),
      "utf8"
    );

    expect(layout).not.toContain("Component.PageTitle()");
    expect(layout).not.toContain("Component.ContentMeta()");
    expect(footer).not.toContain("Created with");
    expect(footer).not.toContain("Quartz v");
    expect(customScss).not.toContain(".page-header + .popover-hint");
  });
});
