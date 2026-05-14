import { access, mkdir, readFile, utimes } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { withRepoLock } from "../src/repo-lock";

describe("withRepoLock", () => {
  it("reclaims an empty stale lock directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-lock-"));
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

  it("keeps waiting when the lock directory is still fresh", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-lock-"));
    const lockPath = join(root, ".superpowers/locks/repo.lock");

    await mkdir(lockPath, { recursive: true });

    await expect(
      withRepoLock(
        lockPath,
        async () => "should-not-run",
        {
          timeoutMs: 20,
          retryMs: 5,
          staleMs: 60_000
        }
      )
    ).rejects.toThrow(/Timed out waiting for repository lock/);
  });
});
