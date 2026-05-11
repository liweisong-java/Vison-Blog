import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAutoPublishFingerprint } from "../src/auto-state.js";
import { runAutoPublishCycle } from "../src/auto-run.js";

describe("runAutoPublishCycle", () => {
  const now = "2026-05-11T08:00:00.000Z";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  });

  it("skips sync when the notebook fingerprint has not changed", async () => {
    const docs = [
      {
        id: "doc-1",
        content: "Title",
        hpath: "/Blog/Title",
        updated: "20260511120000"
      }
    ];
    const queryDocuments = vi.fn().mockResolvedValue(docs);
    const readState = vi.fn().mockResolvedValue({
      fingerprint: buildAutoPublishFingerprint({
        notebookId: "demo-notebook",
        docs: docs.map((doc) => ({ id: doc.id, updated: doc.updated }))
      }),
      lastSuccessAt: "2026-05-11T07:55:00.000Z"
    });
    const writeState = vi.fn();
    const sync = vi.fn();

    const result = await runAutoPublishCycle({
      notebookId: "demo-notebook",
      readState,
      writeState,
      queryDocuments,
      sync,
      logger: vi.fn()
    });

    expect(result.status).toBe("skipped");
    expect(sync).not.toHaveBeenCalled();
    expect(writeState).not.toHaveBeenCalled();
  });

  it("runs sync and stores the new fingerprint when the notebook changed", async () => {
    const queryDocuments = vi.fn().mockResolvedValue([
      {
        id: "doc-1",
        content: "Title",
        hpath: "/Blog/Title",
        updated: "20260511120000"
      }
    ]);
    const readState = vi.fn().mockResolvedValue({
      fingerprint: "old"
    });
    const writeState = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue({
      written: ["title"],
      removed: [],
      committed: true,
      deployed: true
    });

    const result = await runAutoPublishCycle({
      notebookId: "demo-notebook",
      readState,
      writeState,
      queryDocuments,
      sync,
      logger: vi.fn()
    });

    expect(result.status).toBe("synced");
    expect(sync).toHaveBeenCalledTimes(1);
    expect(writeState).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: expect.any(String),
        lastSuccessAt: now,
        lastResult: {
          written: ["title"],
          removed: [],
          committed: true,
          deployed: true
        }
      })
    );
  });

  it("persists the failure when sync throws", async () => {
    const queryDocuments = vi.fn().mockResolvedValue([
      {
        id: "doc-1",
        content: "Title",
        hpath: "/Blog/Title",
        updated: "20260511120000"
      }
    ]);
    const readState = vi.fn().mockResolvedValue(null);
    const writeState = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockRejectedValue(new Error("sync failed"));

    await expect(
      runAutoPublishCycle({
        notebookId: "demo-notebook",
        readState,
        writeState,
        queryDocuments,
        sync,
        logger: vi.fn()
      })
    ).rejects.toThrow("sync failed");

    expect(writeState).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: expect.any(String),
        lastFailureAt: now,
        lastError: "sync failed"
      })
    );
  });

  it("retries the same fingerprint after the previous run failed", async () => {
    const docs = [
      {
        id: "doc-1",
        content: "Title",
        hpath: "/Blog/Title",
        updated: "20260511120000"
      }
    ];
    const fingerprint = buildAutoPublishFingerprint({
      notebookId: "demo-notebook",
      docs: docs.map((doc) => ({ id: doc.id, updated: doc.updated }))
    });
    const queryDocuments = vi.fn().mockResolvedValue(docs);
    const readState = vi.fn().mockResolvedValue({
      fingerprint,
      lastFailureAt: "2026-05-11T07:59:00.000Z",
      lastError: "sync failed"
    });
    const writeState = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue({
      written: ["title"],
      removed: [],
      committed: false,
      deployed: false
    });

    const result = await runAutoPublishCycle({
      notebookId: "demo-notebook",
      readState,
      writeState,
      queryDocuments,
      sync,
      logger: vi.fn()
    });

    expect(result.status).toBe("synced");
    expect(sync).toHaveBeenCalledTimes(1);
    expect(writeState).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint,
        lastSuccessAt: now,
        lastError: undefined,
        lastFailureAt: undefined
      })
    );
  });
});
