import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type AutoPublishState = {
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
};

export function buildAutoPublishFingerprint({
  notebookId,
  docs
}: {
  notebookId: string;
  docs: { id: string; updated: string }[];
}) {
  const payload = [
    notebookId,
    ...[...docs]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((doc) => `${doc.id}:${doc.updated}`)
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

export async function readAutoPublishState(statePath: string): Promise<AutoPublishState | null> {
  try {
    const raw = await readFile(statePath, "utf8");
    return JSON.parse(raw) as AutoPublishState;
  } catch (error) {
    const errnoLike = error as NodeJS.ErrnoException;
    if (errnoLike.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writeAutoPublishState(statePath: string, state: AutoPublishState) {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
}
