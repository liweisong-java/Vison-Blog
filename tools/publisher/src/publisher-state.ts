import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { PublisherState, PublisherSyncHistoryEntry, PublisherSyncResultSummary } from "./types.js";

const MAX_SYNC_HISTORY = 32;

export function createInitialPublisherState(): PublisherState {
  return {
    status: "warning",
    lastSyncAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureReason: null,
    pendingCount: 0,
    syncHistory: [],
    lastResult: null
  };
}

function appendHistory(
  entries: PublisherSyncHistoryEntry[],
  nextEntry: PublisherSyncHistoryEntry
): PublisherSyncHistoryEntry[] {
  return [...entries, nextEntry].slice(-MAX_SYNC_HISTORY);
}

export function recordPublisherSuccess(
  state: PublisherState,
  input: {
    finishedAt: string;
    pendingCount: number;
    result: PublisherSyncResultSummary;
  }
): PublisherState {
  return {
    ...state,
    status: "healthy",
    lastSyncAt: input.finishedAt,
    lastSuccessAt: input.finishedAt,
    lastFailureReason: null,
    pendingCount: input.pendingCount,
    syncHistory: appendHistory(state.syncHistory, {
      finishedAt: input.finishedAt,
      status: "success"
    }),
    lastResult: input.result
  };
}

export function recordPublisherFailure(
  state: PublisherState,
  input: {
    failedAt: string;
    reason: string;
    pendingCount: number;
  }
): PublisherState {
  return {
    ...state,
    status: "failed",
    lastSyncAt: input.failedAt,
    lastFailureAt: input.failedAt,
    lastFailureReason: input.reason,
    pendingCount: input.pendingCount,
    syncHistory: appendHistory(state.syncHistory, {
      finishedAt: input.failedAt,
      status: "failure"
    })
  };
}

export function countRecentPublisherSyncs(state: PublisherState, now = new Date()) {
  const threshold = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  return state.syncHistory.filter((entry) => new Date(entry.finishedAt).getTime() >= threshold).length;
}

export async function readPublisherState(statePath: string): Promise<PublisherState | null> {
  try {
    const raw = await readFile(statePath, "utf8");
    return JSON.parse(raw) as PublisherState;
  } catch (error) {
    const errnoLike = error as NodeJS.ErrnoException;
    if (errnoLike.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writePublisherState(statePath: string, state: PublisherState) {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
}
