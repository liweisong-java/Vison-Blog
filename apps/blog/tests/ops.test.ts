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
});
