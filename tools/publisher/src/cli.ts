import { execFile } from "node:child_process";
import { cwd, env } from "node:process";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";
import { commitAndPush as commitAndPushGit } from "./git.js";
import { loadPublisherConfig } from "./config.js";
import { doctorCommand } from "./commands/doctor.js";
import { copyAssetFiles, removeManagedPost, writeBundle } from "./fs.js";
import { collectManagedPosts } from "./repository.js";
import { createSiYuanClient } from "./siyuan-client.js";
import { syncPublishedNotes } from "./commands/sync.js";

const execFileAsync = promisify(execFile);

async function runBlogChecks() {
  await execFileAsync("pnpm", ["--filter", "blog", "check"], { cwd: cwd() });
  await execFileAsync("pnpm", ["--filter", "blog", "build"], { cwd: cwd() });
}

async function main() {
  loadEnv();

  const config = await loadPublisherConfig(new URL("../publisher.config.example.json", import.meta.url), cwd());
  const client = createSiYuanClient({
    baseUrl: env.SIYUAN_BASE_URL ?? "http://127.0.0.1:6806",
    token: env.SIYUAN_TOKEN
  });

  const command = process.argv[2];
  if (command === "doctor") {
    console.log(await doctorCommand({ config, client }));
    return;
  }

  const dryRun = process.argv.includes("--dry-run");
  console.log(
    await syncPublishedNotes({
      dryRun,
      config,
      client,
      collectManagedPosts,
      writeBundle,
      removeManagedPost,
      runBlogChecks,
      commitAndPush: () =>
        commitAndPushGit({
          repoRoot: cwd(),
          branch: env.PUBLISH_BRANCH ?? "master",
          remote: env.PUBLISH_REMOTE ?? "origin",
          message: "chore(content): sync siyuan posts"
        })
    })
  );
}

void main();
