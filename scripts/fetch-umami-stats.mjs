import { emptyTrafficStats, umamiSnapshotPath, writeJsonFile } from "./private-dashboard-utils.mjs";
import { fileURLToPath } from "node:url";

function normalizeMetric(entry) {
  return {
    pageviews: Number(entry?.pageviews ?? entry?.x ?? 0),
    visitors: Number(entry?.visitors ?? entry?.y ?? 0)
  };
}

function normalizeSimpleList(items, labelKey, valueKey, fallbackLabel) {
  return (items ?? []).map((item) => ({
    [labelKey]: item?.[labelKey] ?? item?.x ?? fallbackLabel,
    [valueKey]: Number(item?.[valueKey] ?? item?.y ?? 0)
  }));
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Umami API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchUmamiStats({
  baseUrl = process.env.UMAMI_BASE_URL,
  apiToken = process.env.UMAMI_API_TOKEN,
  websiteId = process.env.UMAMI_WEBSITE_ID
} = {}) {
  if (!baseUrl || !apiToken || !websiteId) {
    return emptyTrafficStats();
  }

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json"
  };
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  const [todayStats, last7DaysStats, last30DaysStats, pagesStats, referrerStats, deviceStats] =
    await Promise.all([
      fetchJson(`${normalizedBaseUrl}/api/websites/${websiteId}/stats?startAt=${Date.now() - 24 * 60 * 60 * 1000}&endAt=${Date.now()}`, headers),
      fetchJson(`${normalizedBaseUrl}/api/websites/${websiteId}/stats?startAt=${Date.now() - 7 * 24 * 60 * 60 * 1000}&endAt=${Date.now()}`, headers),
      fetchJson(`${normalizedBaseUrl}/api/websites/${websiteId}/stats?startAt=${Date.now() - 30 * 24 * 60 * 60 * 1000}&endAt=${Date.now()}`, headers),
      fetchJson(`${normalizedBaseUrl}/api/websites/${websiteId}/metrics?type=url&limit=5`, headers),
      fetchJson(`${normalizedBaseUrl}/api/websites/${websiteId}/metrics?type=referrer&limit=5`, headers),
      fetchJson(`${normalizedBaseUrl}/api/websites/${websiteId}/metrics?type=device&limit=5`, headers)
    ]);

  return {
    today: normalizeMetric(todayStats),
    last7Days: normalizeMetric(last7DaysStats),
    last30Days: normalizeMetric(last30DaysStats),
    topPages: normalizeSimpleList(pagesStats, "path", "pageviews", "/"),
    topReferrers: normalizeSimpleList(referrerStats, "referrer", "visits", "direct"),
    devices: normalizeSimpleList(deviceStats, "device", "visitors", "unknown")
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const stats = await fetchUmamiStats();
  await writeJsonFile(umamiSnapshotPath, stats);
  console.log(`Umami snapshot updated: ${umamiSnapshotPath}`);
}
