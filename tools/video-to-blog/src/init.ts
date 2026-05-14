import { copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export async function initVideoToBlogFiles({
  envExamplePath,
  envPath,
  configExamplePath,
  configPath
}: {
  envExamplePath: string;
  envPath: string;
  configExamplePath: string;
  configPath: string;
}) {
  const created: string[] = [];
  const skipped: string[] = [];

  if (existsSync(envPath)) {
    skipped.push(envPath);
  } else {
    await copyFile(envExamplePath, envPath);
    created.push(envPath);
  }

  if (existsSync(configPath)) {
    skipped.push(configPath);
  } else {
    await copyFile(configExamplePath, configPath);
    created.push(configPath);
  }

  return {
    ok: true,
    created,
    skipped
  };
}
