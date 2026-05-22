import {execFile} from "node:child_process";
import {existsSync} from "node:fs";
import {stat, writeFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {cwd, env} from "node:process";
import {promisify} from "node:util";
import {config as loadEnv} from "dotenv";
import {commitAndPush as commitAndPushGit} from "./git.js";
import {loadPublisherConfig} from "./config.js";
import {formatCliError, printJson} from "./cli-output.js";
import {
    autoPublishOnceCommand,
    createRunCommand,
    getAutoPublishStatusCommand,
    installAutoPublishLaunchAgentCommand,
    uninstallAutoPublishLaunchAgentCommand
} from "./commands/auto.js";
import {doctorCommand} from "./commands/doctor.js";
import {initPublisherFiles} from "./commands/init.js";
import {removeManagedPost, removeWechatArticle, writeBundle, writeWechatArticle} from "./fs.js";
import {collectContentEntries} from "./repository.js";
import {createSiYuanClient} from "./siyuan-client.js";
import {syncPublishedNotes} from "./commands/sync.js";
import {readPublisherState, writePublisherState} from "./publisher-state.js";
import {resolvePublisherRuntime} from "./runtime.js";
import {deployLocalStaticSite} from "./local-deploy.js";
import {buildSystemdService, buildSystemdTimer, getSystemdServiceName, getSystemdUnitPaths} from "./systemd.js";
import {ensureLatestSiYuanSync} from "./siyuan-sync-gate.js";
import {createSiYuanSourceAdapter} from "./source-adapters/siyuan-adapter.js";

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

function shouldSkipBlogChecks() {
  return normalizeBooleanEnv(env.PUBLISH_SKIP_BLOG_CHECKS, false);
}

function normalizeBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value == null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function shouldSyncBeforeExport() {
    return normalizeBooleanEnv(env.PUBLISH_SYNC_BEFORE_EXPORT, false);
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
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
  const sourceAdapter =
    config.source.type === "siyuan"
      ? createSiYuanSourceAdapter({
          notebookId: config.source.notebookId,
          client
        })
      : null;

  if (command === "doctor") {
    printJson(await doctorCommand({ config, client }));
    return;
  }

  if (command === "deploy-local") {
    const distDir = readArg("--dist-dir") ?? resolve(repoRoot, "apps/blog/dist");
    const deployRoot =
      readArg("--deploy-root") ?? config.localDeployRoot ?? env.SERVER_PUBLISH_DEPLOY_ROOT;
    const releaseId = readArg("--release-id") ?? new Date().toISOString().replace(/[:.]/g, "-");

    if (!deployRoot) {
      throw new Error("Missing deploy root. Please set localDeployRoot or pass --deploy-root.");
    }

    await stat(distDir);
    printJson(
      await deployLocalStaticSite({
        distDir,
        deployRoot,
        releaseId
      })
    );
    return;
  }

  if (command === "server-install") {
    const user = readArg("--user") ?? env.SERVER_PUBLISH_USER ?? "deploy";
    const group = readArg("--group") ?? env.SERVER_PUBLISH_GROUP;
    const intervalMinutes = Number(readArg("--interval-minutes") ?? env.SERVER_PUBLISH_INTERVAL_MINUTES ?? "1");
    const unitPaths = getSystemdUnitPaths();
    const commandLine = `bash -lc 'cd ${repoRoot} && pnpm publish:server-run'`;

    await writeFile(
      unitPaths.servicePath,
      buildSystemdService({
        workspaceRoot: repoRoot,
        user,
        group,
        environmentFile: runtime.envPath,
        command: commandLine
      }),
      "utf8"
    );
    await writeFile(
      unitPaths.timerPath,
      buildSystemdTimer({
        onCalendar: `*:0/${intervalMinutes}`
      }),
      "utf8"
    );
    await execFileAsync("systemctl", ["daemon-reload"]);
    await execFileAsync("systemctl", ["enable", "--now", `${getSystemdServiceName()}.timer`]);

    printJson({
      ok: true,
      servicePath: unitPaths.servicePath,
      timerPath: unitPaths.timerPath,
      intervalMinutes
    });
    return;
  }

  if (command === "auto-status") {
    printJson(
      await getAutoPublishStatusCommand({
        workspaceRoot: repoRoot,
        statePath: runtime.statePath
      })
    );
    return;
  }

  const sync = () =>
    syncPublishedNotes({
      dryRun: false,
      config,
      client,
      collectContentEntries,
      writeBundle,
      writeWechatArticle,
      removeWechatArticle,
      removeManagedPost,
      runBlogChecks: () => (shouldSkipBlogChecks() ? Promise.resolve() : runBlogChecks(repoRoot)),
      commitAndPush: () =>
        commitAndPushGit({
          repoRoot,
          branch: env.PUBLISH_BRANCH || env.GITHUB_REF_NAME || undefined,
          remote: env.PUBLISH_REMOTE ?? "origin",
          message: "chore(content): sync siyuan posts",
          includePaths: [
            ...config.contentTargets.map((target) => target.rootDir),
            ...(config.wechatExportDir ? [config.wechatExportDir] : [])
          ],
          push: normalizeBooleanEnv(env.PUBLISH_PUSH, true)
        }),
      triggerDeploy: (summary) => triggerDeployHook(config.deployHookUrl ?? env.PUBLISH_DEPLOY_HOOK, summary),
      publisherState: {
        readState: () => readPublisherState(config.publisherStatePath ?? runtime.publisherStatePath),
        writeState: (state) => writePublisherState(config.publisherStatePath ?? runtime.publisherStatePath, state)
      }
    });

    async function syncWithOptionalSiYuanRefresh() {
        await ensureLatestSiYuanSync({
            enabled: shouldSyncBeforeExport(),
            client
        });

        return sync();
    }

  if (command === "auto-once") {
    if (!sourceAdapter || config.source.type !== "siyuan") {
      throw new Error("当前自动发布仅支持思源数据源。");
    }

    printJson(
      await autoPublishOnceCommand({
        notebookId: config.source.notebookId,
        queryDocuments: async () =>
          (await sourceAdapter.listDocuments()).map((doc) => ({
            id: doc.id,
            updated: doc.updatedAt
          })),
        sync,
        runtime: {
          workspaceRoot: repoRoot,
          publisherRoot: runtime.publisherRoot,
          statePath: runtime.statePath,
          lockPath: runtime.lockPath
        }
      })
    );
    return;
  }

  if (command === "auto-install") {
    if (config.source.type !== "siyuan") {
      throw new Error("当前自动发布安装仅支持思源数据源。");
    }

    printJson(
      await installAutoPublishLaunchAgentCommand({
        workspaceRoot: repoRoot,
        notebookId: config.source.notebookId,
        siyuanWorkspaceDir: config.source.workspaceDir,
        envPath: runtime.envPath,
        runCommand: createRunCommand(execFileAsync)
      })
    );
    return;
  }

  if (command === "auto-uninstall") {
    printJson(
      await uninstallAutoPublishLaunchAgentCommand({
        workspaceRoot: repoRoot,
        runCommand: createRunCommand(execFileAsync)
      })
    );
    return;
  }

  const dryRun = process.argv.includes("--dry-run");
  const result = dryRun
    ? await syncPublishedNotes({
        dryRun,
        config,
        client,
        collectContentEntries,
        writeBundle,
        writeWechatArticle,
        removeWechatArticle,
        removeManagedPost,
        runBlogChecks: () => (shouldSkipBlogChecks() ? Promise.resolve() : runBlogChecks(repoRoot)),
        commitAndPush: () =>
          commitAndPushGit({
            repoRoot,
            branch: env.PUBLISH_BRANCH || env.GITHUB_REF_NAME || undefined,
            remote: env.PUBLISH_REMOTE ?? "origin",
            message: "chore(content): sync siyuan posts",
            includePaths: [
              ...config.contentTargets.map((target) => target.rootDir),
              ...(config.wechatExportDir ? [config.wechatExportDir] : [])
            ],
            push: normalizeBooleanEnv(env.PUBLISH_PUSH, true)
          }),
        triggerDeploy: (summary) =>
          triggerDeployHook(config.deployHookUrl ?? env.PUBLISH_DEPLOY_HOOK, summary),
        publisherState: {
          readState: () => readPublisherState(config.publisherStatePath ?? runtime.publisherStatePath),
          writeState: (state) => writePublisherState(config.publisherStatePath ?? runtime.publisherStatePath, state)
        }
      })
      : await syncWithOptionalSiYuanRefresh();

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
