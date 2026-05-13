import { access, mkdir, readFile, utimes } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { withRepoLock } from "../../../scripts/lib/repo-lock.mjs";

describe("server repo lock", () => {
  it("reclaims an empty stale lock directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "server-repo-lock-"));
    const lockPath = join(root, ".superpowers/locks/repo.lock");
    const staleAt = new Date(Date.now() - 60_000);

    await mkdir(lockPath, { recursive: true });
    await utimes(lockPath, staleAt, staleAt);

    let ownerContents = "";
    const result = await withRepoLock(
      lockPath,
      async () => {
        ownerContents = await readFile(join(lockPath, "owner.json"), "utf8");
        return "ok";
      },
      {
        timeoutMs: 30,
        retryMs: 1,
        staleMs: 1,
        heartbeatMs: 10
      }
    );

    expect(result).toBe("ok");
    expect(ownerContents).toContain('"pid"');
    await expect(access(lockPath)).rejects.toBeDefined();
  });
});
