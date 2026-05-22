import {cpSync, existsSync, mkdirSync, rmSync} from "node:fs";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {withRepoLock} from "./lib/repo-lock.mjs";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = process.env.SERVER_PUBLISH_RUNTIME_ROOT ?? resolve(root, ".server-runtime");
const repoLockPath = resolve(root, ".superpowers", "locks", "repo.lock");

function envFlag(name, fallback = false) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

async function run(command, args, options = {}) {
  await execFileAsync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      ...(options.env ?? {})
    },
    maxBuffer: 10 * 1024 * 1024,
    ...options
  });
}

async function runNodeScript(entryFile, args = [], options = {}) {
  await run(process.execPath, [entryFile, ...args], options);
}

async function ensureFile(path, message) {
  if (!existsSync(path)) {
    throw new Error(message);
  }
}

function copyIfExists(source, target) {
  if (!existsSync(source)) {
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}

async function main() {
  const branch = process.env.SERVER_PUBLISH_BRANCH ?? "master";
  const remote = process.env.SERVER_PUBLISH_REMOTE ?? "origin";
  const releaseId = process.env.SERVER_PUBLISH_RELEASE_ID ?? new Date().toISOString().replace(/[:.]/g, "-");
  const gitAuthorName = process.env.SERVER_PUBLISH_GIT_AUTHOR_NAME ?? "Vision Blog Bot";
  const gitAuthorEmail = process.env.SERVER_PUBLISH_GIT_AUTHOR_EMAIL ?? "vision-blog-bot@users.noreply.github.com";
  const pushContent = envFlag("SERVER_PUBLISH_PUSH_CONTENT", true);
  const runtimeDir = join(runtimeRoot, releaseId);
  const publisherCliEntry = resolve(runtimeDir, "tools/publisher/src/cli.ts");
  const tsxCliEntry = resolve(runtimeDir, "tools/publisher/node_modules/tsx/dist/cli.mjs");
  const astroCli = resolve(runtimeDir, "apps/blog/node_modules/.bin/astro");

  await ensureFile(
    resolve(root, "tools/publisher/.env"),
    "未找到 tools/publisher/.env，请先运行 pnpm publish:init 并补齐服务器配置。"
  );
  await ensureFile(
    resolve(root, "tools/publisher/publisher.config.json"),
    "未找到 tools/publisher/publisher.config.json，请先运行 pnpm publish:init 并补齐服务器配置。"
  );

  if (!envFlag("SERVER_PUBLISH_SKIP_GIT", false)) {
    await run("git", ["fetch", remote, branch], { cwd: root });
  }

  rmSync(runtimeDir, { recursive: true, force: true });
  mkdirSync(runtimeRoot, { recursive: true });
  await run(
    "git",
    ["worktree", "add", "--force", "--detach", runtimeDir, envFlag("SERVER_PUBLISH_SKIP_GIT", false) ? "HEAD" : `${remote}/${branch}`],
    { cwd: root }
  );

  try {
    copyIfExists(resolve(root, "tools/publisher/.env"), resolve(runtimeDir, "tools/publisher/.env"));
    copyIfExists(
      resolve(root, "tools/publisher/publisher.config.json"),
      resolve(runtimeDir, "tools/publisher/publisher.config.json")
    );
    copyIfExists(resolve(root, ".superpowers"), resolve(runtimeDir, ".superpowers"));
    await run("git", ["config", "user.name", gitAuthorName], { cwd: runtimeDir });
    await run("git", ["config", "user.email", gitAuthorEmail], { cwd: runtimeDir });

    await run("pnpm", ["install", "--frozen-lockfile"], { cwd: runtimeDir });
    await runNodeScript(tsxCliEntry, [publisherCliEntry, "sync"], {
      cwd: runtimeDir,
      env: {
        PUBLISH_SKIP_BLOG_CHECKS: "true",
        PUBLISH_PUSH: pushContent ? "true" : "false",
        PUBLISH_SYNC_BEFORE_EXPORT: "true",
        GIT_AUTHOR_NAME: gitAuthorName,
        GIT_AUTHOR_EMAIL: gitAuthorEmail,
        GIT_COMMITTER_NAME: gitAuthorName,
        GIT_COMMITTER_EMAIL: gitAuthorEmail
      }
    });
    await runNodeScript(resolve(runtimeDir, "scripts/generate-private-dashboard.mjs"), [], { cwd: runtimeDir });

    if (envFlag("SERVER_PUBLISH_SKIP_BUILD", false)) {
      copyIfExists(resolve(runtimeDir, ".superpowers"), resolve(root, ".superpowers"));
      return;
    }

    await run(astroCli, ["check"], {
      cwd: resolve(runtimeDir, "apps/blog")
    });
    await run(astroCli, ["build"], {
      cwd: resolve(runtimeDir, "apps/blog")
    });
    await run("pnpm", ["--filter", "quartz", "build"], {
      cwd: runtimeDir
    });
    await runNodeScript(resolve(runtimeDir, "scripts/build-composite-site.mjs"), [], {
      cwd: runtimeDir
    });

    const distDir = process.env.SERVER_PUBLISH_DIST_DIR ?? resolve(runtimeDir, "site-dist");
    const deployRoot = process.env.SERVER_PUBLISH_DEPLOY_ROOT ?? "/data/Vison-Blog";

    await runNodeScript(
      tsxCliEntry,
      [
        publisherCliEntry,
        "deploy-local",
        "--dist-dir",
        distDir,
        "--deploy-root",
        deployRoot,
        "--release-id",
        releaseId
      ],
      { cwd: runtimeDir }
    );

    copyIfExists(resolve(runtimeDir, ".superpowers"), resolve(root, ".superpowers"));
  } finally {
    await run("git", ["worktree", "remove", "--force", runtimeDir], { cwd: root }).catch(() => undefined);
    await run("git", ["worktree", "prune"], { cwd: root }).catch(() => undefined);
  }
}

await withRepoLock(repoLockPath, main).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
