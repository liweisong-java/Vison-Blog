import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const metricSchema = z.object({
  pageviews: z.number().nonnegative(),
  visitors: z.number().nonnegative()
});

const statusSchema = z.enum(["healthy", "warning", "failed"]);

export const privateDashboardSchema = z.object({
  generatedAt: z.string(),
  summary: z.object({
    totalPosts: z.number().nonnegative(),
    postsLast30Days: z.number().nonnegative(),
    todayPageViews: z.number().nonnegative(),
    visitsLast30Days: z.number().nonnegative(),
    publisherStatus: statusSchema,
    lastPublishedAt: z.string().nullable()
  }),
  content: z.object({
    totalPosts: z.number().nonnegative(),
    categories: z.object({
      tech: z.number().nonnegative(),
      life: z.number().nonnegative()
    }),
    totalTags: z.number().nonnegative(),
    topTags: z.array(
      z.object({
        tag: z.string().min(1),
        count: z.number().nonnegative()
      })
    ),
    totalWords: z.number().nonnegative(),
    averageWordsPerPost: z.number().nonnegative()
  }),
  traffic: z.object({
    today: metricSchema,
    last7Days: metricSchema,
    last30Days: metricSchema,
    topPages: z.array(
      z.object({
        path: z.string().min(1),
        pageviews: z.number().nonnegative()
      })
    ),
    topReferrers: z.array(
      z.object({
        referrer: z.string().min(1),
        visits: z.number().nonnegative()
      })
    ),
    devices: z.array(
      z.object({
        device: z.string().min(1),
        visitors: z.number().nonnegative()
      })
    )
  }),
  publisher: z.object({
    status: statusSchema,
    lastSyncAt: z.string().nullable(),
    lastSuccessAt: z.string().nullable(),
    lastFailureAt: z.string().nullable(),
    lastFailureReason: z.string().nullable(),
    pendingCount: z.number().nonnegative(),
    syncsLast7Days: z.number().nonnegative()
  })
});

export type PrivateDashboard = z.infer<typeof privateDashboardSchema>;
export type PublisherStatus = z.infer<typeof statusSchema>;
const PRIVATE_DASHBOARD_PATH = resolve(
  process.cwd(),
  "..",
  "..",
  ".superpowers",
  "private-dashboard",
  "dashboard.json"
);

export function createEmptyPrivateDashboard(): PrivateDashboard {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPosts: 0,
      postsLast30Days: 0,
      todayPageViews: 0,
      visitsLast30Days: 0,
      publisherStatus: "warning",
      lastPublishedAt: null
    },
    content: {
      totalPosts: 0,
      categories: {
        tech: 0,
        life: 0
      },
      totalTags: 0,
      topTags: [],
      totalWords: 0,
      averageWordsPerPost: 0
    },
    traffic: {
      today: { pageviews: 0, visitors: 0 },
      last7Days: { pageviews: 0, visitors: 0 },
      last30Days: { pageviews: 0, visitors: 0 },
      topPages: [],
      topReferrers: [],
      devices: []
    },
    publisher: {
      status: "warning",
      lastSyncAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastFailureReason: null,
      pendingCount: 0,
      syncsLast7Days: 0
    }
  };
}

export async function loadPrivateDashboard() {
  try {
    const raw = await readFile(PRIVATE_DASHBOARD_PATH, "utf8");
    return privateDashboardSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`[private-dashboard] using empty dashboard data: ${error.message}`);
    }
    return createEmptyPrivateDashboard();
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "暂时没有记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getPublisherStatusLabel(status: PublisherStatus) {
  switch (status) {
    case "healthy":
      return "运行正常";
    case "warning":
      return "需要留意";
    case "failed":
      return "同步失败";
  }
}

export function summarizeDashboard(input: Pick<PrivateDashboard, "generatedAt" | "summary">) {
  if (!input.summary.totalPosts && !input.summary.visitsLast30Days && !input.summary.lastPublishedAt) {
    return "统计快照尚未生成，当前先展示空态结构。";
  }

  const generatedAt = formatDateTime(input.generatedAt);
  const status = getPublisherStatusLabel(input.summary.publisherStatus);
  return `最近已更新：${generatedAt}，当前发布状态：${status}。`;
}

export function summarizeDeskStatus(input: Pick<PrivateDashboard, "publisher">) {
  const status = getPublisherStatusLabel(input.publisher.status);
  const pending = input.publisher.pendingCount;
  const lastSuccess = formatDateTime(input.publisher.lastSuccessAt);
  return `${status}，队列 ${pending} 条，最近成功 ${lastSuccess}`;
}

export function toPercent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

export function formatDashboardDate(value: string | null) {
  return formatDateTime(value);
}
