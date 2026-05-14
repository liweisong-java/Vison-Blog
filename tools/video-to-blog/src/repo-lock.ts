import { mkdir, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { dirname, join } from "node:path";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RepoLockOptions = {
  timeoutMs?: number;
  retryMs?: number;
  staleMs?: number;
  heartbeatMs?: number;
};

type RepoLockOwner = {
  pid: number;
  hostname: string;
  acquiredAt: string;
};

async function writeOwnerFile(lockPath: string) {
  const owner: RepoLockOwner = {
    pid: process.pid,
    hostname: hostname(),
    acquiredAt: new Date().toISOString()
  };
  await writeFile(join(lockPath, "owner.json"), `${JSON.stringify(owner, null, 2)}\n`, "utf8");
}

async function updateHeartbeat(lockPath: string) {
  const now = new Date();
  await utimes(lockPath, now, now).catch(() => undefined);
  await utimes(join(lockPath, "owner.json"), now, now).catch(() => undefined);
}

async function isLockStale(lockPath: string, staleMs: number) {
  const ownerPath = join(lockPath, "owner.json");

  try {
    const ownerRaw = await readFile(ownerPath, "utf8");
    const owner = JSON.parse(ownerRaw) as Partial<RepoLockOwner>;
    if (typeof owner.pid === "number" && owner.pid > 0) {
      try {
        process.kill(owner.pid, 0);
        return false;
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ESRCH") {
          return true;
        }
      }
    }
  } catch {
    // Fall through to mtime-based stale detection for older empty locks.
  }

  const metadata = await stat(lockPath);
  return Date.now() - metadata.mtimeMs >= staleMs;
}

async function clearStaleLock(lockPath: string, staleMs: number) {
  if (await isLockStale(lockPath, staleMs)) {
    await rm(lockPath, { recursive: true, force: true }).catch(() => undefined);
    return true;
  }

  return false;
}

export async function withRepoLock<T>(lockPath: string, task: () => Promise<T>, options: RepoLockOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 120000;
  const retryMs = options.retryMs ?? 1000;
  const staleMs = options.staleMs ?? 300000;
  const heartbeatMs = options.heartbeatMs ?? 10000;
  const startedAt = Date.now();

  while (true) {
    try {
      await mkdir(dirname(lockPath), { recursive: true });
      await mkdir(lockPath);
      await writeOwnerFile(lockPath);
      break;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
        const reclaimed = await clearStaleLock(lockPath, staleMs);
        if (reclaimed) {
          continue;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          throw new Error(`Timed out waiting for repository lock: ${lockPath}`);
        }
        await sleep(retryMs);
        continue;
      }
      throw error;
    }
  }

  const heartbeatTimer = setInterval(() => {
    void updateHeartbeat(lockPath);
  }, heartbeatMs);
  heartbeatTimer.unref();

  try {
    await updateHeartbeat(lockPath);
    return await task();
  } finally {
    clearInterval(heartbeatTimer);
    await rm(lockPath, { recursive: true, force: true }).catch(() => undefined);
  }
}
