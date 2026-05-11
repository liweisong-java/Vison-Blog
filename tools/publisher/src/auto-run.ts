import { buildAutoPublishFingerprint } from "./auto-state.js";

export async function runAutoPublishCycle({
  notebookId,
  readState,
  writeState,
  queryDocuments,
  sync,
  logger
}: {
  notebookId: string;
  readState: () => Promise<{
    fingerprint: string;
    lastSuccessAt?: string;
    lastFailureAt?: string;
    lastError?: string;
    lastResult?: {
      written: string[];
      removed: string[];
      committed: boolean;
      deployed: boolean;
    };
  } | null>;
  writeState: (state: {
    fingerprint: string;
    lastCheckedAt?: string;
    lastSuccessAt?: string;
    lastFailureAt?: string;
    lastError?: string;
    lastResult?: {
      written: string[];
      removed: string[];
      committed: boolean;
      deployed: boolean;
    };
  }) => Promise<void>;
  queryDocuments: () => Promise<{ id: string; updated: string }[]>;
  sync: () => Promise<{
    written: string[];
    removed: string[];
    committed: boolean;
    deployed: boolean;
  }>;
  logger: (message: string) => void;
}) {
  const docs = await queryDocuments();
  const fingerprint = buildAutoPublishFingerprint({ notebookId, docs });
  const state = await readState();
  const now = new Date().toISOString();

  if (state?.fingerprint === fingerprint && state.lastSuccessAt && !state.lastFailureAt) {
    logger("未检测到思源笔记变化，跳过本次同步。");
    return {
      status: "skipped" as const,
      fingerprint
    };
  }

  try {
    const result = await sync();
    await writeState({
      fingerprint,
      lastCheckedAt: now,
      lastSuccessAt: now,
      lastError: undefined,
      lastFailureAt: undefined,
      lastResult: {
        written: result.written,
        removed: result.removed,
        committed: result.committed,
        deployed: result.deployed
      }
    });
    logger(
      `自动同步完成：写入 ${result.written.length} 篇，移除 ${result.removed.length} 篇，提交=${String(result.committed)}。`
    );
    return {
      status: "synced" as const,
      fingerprint,
      result
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeState({
      fingerprint,
      lastCheckedAt: now,
      lastFailureAt: now,
      lastError: message,
      lastResult: state?.lastResult
    });
    logger(`自动同步失败：${message}`);
    throw error;
  }
}
