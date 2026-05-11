import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function resolvePublisherRuntime({
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
  const publisherRoot = resolve(dirname(modulePath), "..");
  const workspaceRoot = resolve(publisherRoot, "..", "..");

  return {
    workspaceRoot,
    publisherRoot,
    envPath: resolve(publisherRoot, ".env"),
    configPath: configOverride
      ? resolve(cwdPath, configOverride)
      : resolve(publisherRoot, "publisher.config.json")
  };
}
