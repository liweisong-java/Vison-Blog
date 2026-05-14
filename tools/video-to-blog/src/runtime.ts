import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function resolveVideoToBlogRuntime({
  cwdPath,
  moduleUrl,
  configOverride
}: {
  cwdPath: string;
  moduleUrl: URL | string;
  configOverride?: string;
}) {
  const modulePath =
    typeof moduleUrl === "string"
      ? moduleUrl.startsWith("file://")
        ? fileURLToPath(moduleUrl)
        : moduleUrl
      : fileURLToPath(moduleUrl);
  const toolRoot = resolve(dirname(modulePath), "..");
  const workspaceRoot = resolve(toolRoot, "..", "..");
  const stateRoot = resolve(workspaceRoot, ".superpowers", "video-to-blog");

  return {
    workspaceRoot,
    toolRoot,
    envPath: resolve(toolRoot, ".env"),
    configPath: configOverride
      ? resolve(cwdPath, configOverride)
      : resolve(toolRoot, "video-to-blog.config.json"),
    stateRoot,
    queuePath: resolve(stateRoot, "queue.json"),
    jobsRoot: resolve(stateRoot, "jobs"),
    manifestPath: resolve(stateRoot, "manifest.json"),
    tempRoot: resolve(stateRoot, "tmp"),
    repoLockPath: resolve(workspaceRoot, ".superpowers", "locks", "repo.lock")
  };
}
