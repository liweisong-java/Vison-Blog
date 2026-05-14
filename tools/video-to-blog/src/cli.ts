import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { cwd, env } from "node:process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";
import { formatCliError, printJson } from "./cli-output.js";
import { loadVideoToBlogConfig } from "./config.js";
import { enqueueVideo, getVideoToBlogStatus, doctorVideoToBlog, runVideoQueue } from "./commands.js";
import { initVideoToBlogFiles } from "./init.js";
import { resolveVideoToBlogRuntime } from "./runtime.js";
import {
  buildVideoToBlogSystemdService,
  buildVideoToBlogSystemdTimer,
  getVideoToBlogServiceName,
  getVideoToBlogUnitPaths
} from "./systemd.js";

const runtime = resolveVideoToBlogRuntime({
  cwdPath: cwd(),
  moduleUrl: import.meta.url,
  configOverride: env.VIDEO_TO_BLOG_CONFIG
});

const command = process.argv[2];
const execFileAsync = promisify(execFile);

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  if (command === "init") {
    printJson(
      await initVideoToBlogFiles({
        envExamplePath: resolve(runtime.toolRoot, ".env.example"),
        envPath: runtime.envPath,
        configExamplePath: resolve(runtime.toolRoot, "video-to-blog.config.example.json"),
        configPath: runtime.configPath
      })
    );
    return;
  }

  loadEnv({ path: runtime.envPath, quiet: true });

  if (!existsSync(runtime.configPath)) {
    throw Object.assign(new Error(`Missing video-to-blog config: ${runtime.configPath}`), {
      code: "ENOENT",
      path: runtime.configPath
    });
  }

  const config = await loadVideoToBlogConfig(pathToFileURL(runtime.configPath), runtime.workspaceRoot);

  if (command === "doctor") {
    printJson(await doctorVideoToBlog({ config, runtime }));
    return;
  }

  if (command === "enqueue") {
    const url = readArg("--url");
    const transcriptText = readArg("--transcript");
    if (!url) {
      throw new Error("Missing required --url argument.");
    }

    printJson(await enqueueVideo({ runtime, url, transcriptText }));
    return;
  }

  if (command === "status") {
    printJson(await getVideoToBlogStatus(runtime));
    return;
  }

  if (command === "server-install") {
    const user = readArg("--user") ?? env.VIDEO_TO_BLOG_USER ?? "deploy";
    const group = readArg("--group") ?? env.VIDEO_TO_BLOG_GROUP;
    const intervalMinutes = Number(readArg("--interval-minutes") ?? env.VIDEO_TO_BLOG_INTERVAL_MINUTES ?? "5");
    const unitPaths = getVideoToBlogUnitPaths();
    const commandLine = `bash -lc 'cd ${runtime.workspaceRoot} && pnpm video:run'`;

    await writeFile(
      unitPaths.servicePath,
      buildVideoToBlogSystemdService({
        workspaceRoot: runtime.workspaceRoot,
        user,
        group,
        environmentFile: runtime.envPath,
        command: commandLine
      }),
      "utf8"
    );
    await writeFile(
      unitPaths.timerPath,
      buildVideoToBlogSystemdTimer({
        onCalendar: `*:0/${intervalMinutes}`
      }),
      "utf8"
    );
    await execFileAsync("systemctl", ["daemon-reload"]);
    await execFileAsync("systemctl", ["enable", "--now", `${getVideoToBlogServiceName()}.timer`]);

    printJson({
      ok: true,
      servicePath: unitPaths.servicePath,
      timerPath: unitPaths.timerPath,
      intervalMinutes
    });
    return;
  }

  if (command === "run") {
    printJson(await runVideoQueue({ config, runtime, env }));
    return;
  }

  throw new Error(`Unknown command: ${command ?? "(missing)"}`);
}

main().catch((error) => {
  console.error(formatCliError(error, runtime));
  process.exitCode = 1;
});
