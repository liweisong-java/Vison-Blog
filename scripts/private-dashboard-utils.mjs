import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const workspaceRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const privateDashboardDir = resolve(workspaceRoot, ".superpowers", "private-dashboard");
export const privateDashboardPath = resolve(privateDashboardDir, "dashboard.json");
export const umamiSnapshotPath = resolve(privateDashboardDir, "umami-snapshot.json");
export const publisherStatePath = resolve(privateDashboardDir, "publisher-state.json");

export function getRangeStart(days, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function ensurePrivateDashboardDir() {
  await mkdir(privateDashboardDir, { recursive: true });
}

export async function writeJsonFile(filePath, data) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function readJsonFile(filePath, fallback = null) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

export function emptyTrafficStats() {
  return {
    today: { pageviews: 0, visitors: 0 },
    last7Days: { pageviews: 0, visitors: 0 },
    last30Days: { pageviews: 0, visitors: 0 },
    topPages: [],
    topReferrers: [],
    devices: []
  };
}

export function emptyPublisherStats() {
  return {
    status: "warning",
    lastSyncAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureReason: null,
    pendingCount: 0,
    syncsLast7Days: 0
  };
}
