import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { cwd, env } from "node:process";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";
import { commitAndPush as commitAndPushGit } from "./git.js";
import { loadPublisherConfig } from "./config.js";
import { formatCliError, printJson } from "./cli-output.js";
import { doctorCommand } from "./commands/doctor.js";
import { initPublisherFiles } from "./commands/init.js";
import { removeManagedPost, removeWechatArticle, writeBundle, writeWechatArticle } from "./fs.js";
import { collectContentEntries } from "./repository.js";
import { createSiYuanClient } from "./siyuan-client.js";
import { syncPublishedNotes } from "./commands/sync.js";
import { resolvePublisherRuntime } from "./runtime.js";

const execFileAsync = promisify(execFile);
const runtime = resolvePublisherRuntime({
  cwdPath: cwd(),
  moduleUrl: import.meta.url,
  configOverride: env.PUBLISHER_CONFIG
});
const command = process.argv[2];

async function runBlogChecks(workspaceRoot: string) {
  await execFileAsync("pnpm", ["--filter", "blog", "check"], { cwd: workspaceRoot });
  await execFileAsync("pnpm", ["--filter", "blog", "build"], { cwd: workspaceRoot });
}

async function triggerDeployHook(
  deployHookUrl: string | undefined,
  summary: { written: string[]; removed: string[]; committed: boolean }
) {
  if (!deployHookUrl) {
    return { deployed: false, skipped: true };
  }

  const response = await fetch(deployHookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(summary)
  });

  if (!response.ok) {
    throw new Error(`Deploy hook failed with ${response.status} ${response.statusText}`);
  }

  return { deployed: true, skipped: false };
}

async function main() {
  if (command === "init") {
    printJson(
      await initPublisherFiles({
        envExamplePath: resolve(runtime.publisherRoot, ".env.example"),
        envPath: runtime.envPath,
        configExamplePath: resolve(runtime.publisherRoot, "publisher.config.example.json"),
        configPath: runtime.configPath
      })
    );
    return;
  }

  loadEnv({ path: runtime.envPath, quiet: true });

  const repoRoot = runtime.workspaceRoot;
  const configPath = runtime.configPath;
  if (!existsSync(configPath)) {
    throw Object.assign(new Error(`Missing publisher config: ${configPath}`), {
      code: "ENOENT",
      path: configPath
    });
  }

  const configUrl = pathToFileURL(configPath);

  const config = await loadPublisherConfig(configUrl, repoRoot);
  const client = createSiYuanClient({
    baseUrl: env.SIYUAN_BASE_URL ?? "http://127.0.0.1:6806",
    token: env.SIYUAN_TOKEN
  });

  if (command === "doctor") {
    printJson(await doctorCommand({ config, client }));
    return;
  }

  const dryRun = process.argv.includes("--dry-run");
  const result = await syncPublishedNotes({
    dryRun,
    config,
    client,
    collectContentEntries,
    writeBundle,
    writeWechatArticle,
    removeWechatArticle,
    removeManagedPost,
    runBlogChecks: () => runBlogChecks(repoRoot),
    commitAndPush: () =>
      commitAndPushGit({
        repoRoot,
        branch: env.PUBLISH_BRANCH ?? env.GITHUB_REF_NAME ?? "master",
        remote: env.PUBLISH_REMOTE ?? "origin",
        message: "chore(content): sync siyuan posts",
        includePaths: [config.contentRoot, ...(config.wechatExportDir ? [config.wechatExportDir] : [])]
      }),
    triggerDeploy: (summary) => triggerDeployHook(config.deployHookUrl ?? env.PUBLISH_DEPLOY_HOOK, summary)
  });

  printJson(result);
}

void main().catch((error) => {
  console.error(
    formatCliError(error, {
      envPath: runtime.envPath,
      configPath: runtime.configPath
    })
  );
  process.exitCode = 1;
});
