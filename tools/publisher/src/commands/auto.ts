import { access, constants, mkdir, open, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { env } from "node:process";
import { buildLaunchdPlist, getLaunchdLabel, getLaunchdParentDirectories, getLaunchdPaths } from "../launchd.js";
import { runAutoPublishCycle } from "../auto-run.js";
import { readAutoPublishState, writeAutoPublishState } from "../auto-state.js";

type SyncSummary = {
  written: string[];
  removed: string[];
  committed: boolean;
  deployed: boolean;
};

type AutoRuntime = {
  workspaceRoot: string;
  publisherRoot: string;
  statePath: string;
  lockPath: string;
};

async function withLock<T>(lockPath: string, job: () => Promise<T>) {
  await mkdir(dirname(lockPath), { recursive: true });
  let handle;

  try {
    handle = await open(lockPath, "wx");
  } catch (error) {
    const errnoLike = error as NodeJS.ErrnoException;
    if (errnoLike.code === "EEXIST") {
      return {
        skipped: true as const,
        reason: "locked"
      };
    }

    throw error;
  }

  try {
    await handle.writeFile(String(Date.now()));
    return await job();
  } finally {
    await handle.close();
    await unlink(lockPath).catch(() => undefined);
  }
}

async function fileExists(value: string) {
  try {
    await access(value, constants.F_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function resolvePnpmBinary(
  workspaceRoot: string,
  exists: (candidate: string) => Promise<boolean> = fileExists
) {
  const candidates = [
    env.PNPM_BIN,
    join(workspaceRoot, "node_modules", ".bin", "pnpm"),
    "/opt/homebrew/bin/pnpm",
    "/usr/local/bin/pnpm",
    "pnpm"
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (candidate === "pnpm") {
      return candidate;
    }

    if (await exists(candidate)) {
      return candidate;
    }
  }

  return "pnpm";
}

async function loadEnvFile(envPath: string) {
  const raw = await readFile(envPath, "utf8");
  const values = new Map<string, string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    values.set(key, value);
  }

  return values;
}

export async function autoPublishOnceCommand({
  notebookId,
  queryDocuments,
  sync,
  runtime,
  logger = console.log
}: {
  notebookId: string;
  queryDocuments: () => Promise<{ id: string; updated: string }[]>;
  sync: () => Promise<SyncSummary>;
  runtime: AutoRuntime;
  logger?: (message: string) => void;
}) {
  const result = await withLock(runtime.lockPath, async () =>
    runAutoPublishCycle({
      notebookId,
      readState: () => readAutoPublishState(runtime.statePath),
      writeState: (state) => writeAutoPublishState(runtime.statePath, state),
      queryDocuments,
      sync,
      logger
    })
  );

  if ("skipped" in result && result.skipped) {
    logger("自动发布任务仍在运行中，跳过本次触发。");
    return {
      status: "locked" as const
    };
  }

  return result;
}

export async function installAutoPublishLaunchAgentCommand({
  workspaceRoot,
  notebookId,
  siyuanWorkspaceDir,
  envPath,
  intervalSeconds = 300,
  runCommand,
  logger = console.log
}: {
  workspaceRoot: string;
  notebookId: string;
  siyuanWorkspaceDir: string;
  envPath: string;
  intervalSeconds?: number;
  runCommand: (command: string, args: string[]) => Promise<void>;
  logger?: (message: string) => void;
}) {
  const homeDir = env.HOME ?? "";
  if (!homeDir) {
    throw new Error("当前环境没有 HOME，无法安装 launchd 自动发布任务。");
  }

  const paths = getLaunchdPaths({ homeDir, workspaceRoot });
  const envValues = await loadEnvFile(envPath);
  const program = await resolvePnpmBinary(workspaceRoot);
  const branch = envValues.get("PUBLISH_BRANCH") || "当前上游分支";
  const notebookWatchPath = join(siyuanWorkspaceDir, "data", notebookId);

  for (const directory of getLaunchdParentDirectories(paths)) {
    await mkdir(directory, { recursive: true });
  }

  await rm(paths.lockPath, { force: true }).catch(() => undefined);

  const plist = buildLaunchdPlist({
    label: getLaunchdLabel(),
    program,
    args: ["publish:auto-once"],
    workingDirectory: workspaceRoot,
    watchPaths: [notebookWatchPath],
    standardLogPath: paths.logPath,
    intervalSeconds
  });

  await writeFile(paths.plistPath, plist, "utf8");
  await runCommand("launchctl", ["unload", paths.plistPath]).catch(() => undefined);
  await runCommand("launchctl", ["load", paths.plistPath]);

  logger(`自动发布已安装：${paths.plistPath}`);
  logger(`监听目录：${notebookWatchPath}`);
  logger(`定时兜底：每 ${intervalSeconds} 秒检查一次`);
  logger(`当前发布分支：${branch}`);

  return {
    ok: true,
    label: getLaunchdLabel(),
    plistPath: paths.plistPath,
    logPath: paths.logPath,
    statePath: paths.statePath,
    intervalSeconds,
    notebookWatchPath,
    program
  };
}

export async function uninstallAutoPublishLaunchAgentCommand({
  workspaceRoot,
  runCommand,
  logger = console.log
}: {
  workspaceRoot: string;
  runCommand: (command: string, args: string[]) => Promise<void>;
  logger?: (message: string) => void;
}) {
  const homeDir = env.HOME ?? "";
  if (!homeDir) {
    throw new Error("当前环境没有 HOME，无法卸载 launchd 自动发布任务。");
  }

  const paths = getLaunchdPaths({ homeDir, workspaceRoot });
  await runCommand("launchctl", ["unload", paths.plistPath]).catch(() => undefined);
  await rm(paths.plistPath, { force: true });
  await rm(paths.lockPath, { force: true }).catch(() => undefined);

  logger(`自动发布已卸载：${paths.plistPath}`);

  return {
    ok: true,
    label: getLaunchdLabel(),
    plistPath: paths.plistPath
  };
}

export async function getAutoPublishStatusCommand({
  workspaceRoot,
  statePath
}: {
  workspaceRoot: string;
  statePath: string;
}) {
  const homeDir = env.HOME ?? "";
  const launchdPaths = homeDir
    ? getLaunchdPaths({ homeDir, workspaceRoot })
    : null;

  return {
    label: getLaunchdLabel(),
    plistPath: launchdPaths?.plistPath ?? null,
    logPath: launchdPaths?.logPath ?? null,
    statePath,
    state: await readAutoPublishState(statePath)
  };
}

export function createRunCommand(execFileAsync: (file: string, args: string[], options?: { cwd?: string }) => Promise<unknown>) {
  return async (command: string, args: string[]) => {
    const resolvedCommand = command === "launchctl" ? "/bin/launchctl" : command;
    await execFileAsync(resolvedCommand, args);
  };
}
