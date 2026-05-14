import { describe, expect, it } from "vitest";
import {
  createEmptyPrivateDashboard,
  getPublisherStatusLabel,
  privateDashboardSchema,
  summarizeDeskStatus,
  summarizeDashboard
} from "../src/lib/private-dashboard";

describe("private dashboard", () => {
  it("accepts a dashboard payload with summary, content, traffic, and publisher sections", () => {
    const payload = {
      generatedAt: "2026-05-12T12:00:00.000Z",
      summary: {
        totalPosts: 4,
        postsLast30Days: 2,
        todayPageViews: 18,
        visitsLast30Days: 320,
        publisherStatus: "healthy",
        lastPublishedAt: "2026-05-12T11:30:00.000Z"
      },
      content: {
        totalPosts: 4,
        categories: { tech: 2, life: 2 },
        totalTags: 8,
        topTags: [{ tag: "astro", count: 2 }],
        totalWords: 3200,
        averageWordsPerPost: 800
      },
      traffic: {
        today: { pageviews: 18, visitors: 9 },
        last7Days: { pageviews: 120, visitors: 46 },
        last30Days: { pageviews: 320, visitors: 120 },
        topPages: [{ path: "/posts/from-notes-to-site/", pageviews: 40 }],
        topReferrers: [{ referrer: "direct", visits: 60 }],
        devices: [{ device: "desktop", visitors: 70 }]
      },
      publisher: {
        status: "healthy",
        lastSyncAt: "2026-05-12T11:30:00.000Z",
        lastSuccessAt: "2026-05-12T11:30:00.000Z",
        lastFailureAt: null,
        lastFailureReason: null,
        pendingCount: 0,
        syncsLast7Days: 12
      }
    };

    expect(privateDashboardSchema.parse(payload).summary.totalPosts).toBe(4);
  });

  it("builds a compact status line for the summary header", () => {
    expect(
      summarizeDashboard({
        generatedAt: "2026-05-12T12:00:00.000Z",
        summary: {
          totalPosts: 4,
          postsLast30Days: 2,
          todayPageViews: 18,
          visitsLast30Days: 320,
          publisherStatus: "healthy",
          lastPublishedAt: "2026-05-12T11:30:00.000Z"
        }
      } as never)
    ).toContain("最近已更新");
  });

  it("maps publisher status to stable Chinese labels", () => {
    expect(getPublisherStatusLabel("healthy")).toBe("运行正常");
    expect(getPublisherStatusLabel("warning")).toBe("需要留意");
    expect(getPublisherStatusLabel("failed")).toBe("同步失败");
  });

  it("creates a safe empty fallback payload for public builds", () => {
    const payload = createEmptyPrivateDashboard();

    expect(privateDashboardSchema.parse(payload).publisher.status).toBe("warning");
    expect(summarizeDashboard(payload)).toContain("空态结构");
  });

  it("builds a concise personal desk status line", () => {
    expect(
      summarizeDeskStatus({
        publisher: {
          status: "healthy",
          pendingCount: 2,
          lastSuccessAt: "2026-05-12T11:30:00.000Z"
        }
      } as never)
    ).toContain("队列 2 条");
  });
});
