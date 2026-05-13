import { mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRepoLock<T>(
  lockPath: string,
  task: () => Promise<T>,
  options: { timeoutMs?: number; retryMs?: number } = {}
) {
  const timeoutMs = options.timeoutMs ?? 120000;
  const retryMs = options.retryMs ?? 1000;
  const startedAt = Date.now();

  while (true) {
    try {
      await mkdir(dirname(lockPath), { recursive: true });
      await mkdir(lockPath);
      break;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        if (Date.now() - startedAt >= timeoutMs) {
          throw new Error(`Timed out waiting for repository lock: ${lockPath}`);
        }
        await sleep(retryMs);
        continue;
      }
      throw error;
    }
  }

  try {
    return await task();
  } finally {
    await rm(lockPath, { recursive: true, force: true }).catch(() => undefined);
  }
}
