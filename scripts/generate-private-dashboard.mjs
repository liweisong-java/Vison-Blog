import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  emptyPublisherStats,
  emptyTrafficStats,
  getRangeStart,
  privateDashboardPath,
  publisherStatePath,
  readJsonFile,
  umamiSnapshotPath,
  writeJsonFile,
  workspaceRoot
} from "./private-dashboard-utils.mjs";

const postsRoot = resolve(workspaceRoot, "apps/blog/src/content/posts");

async function collectPostFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPostFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name === "index.mdx") {
      files.push(entryPath);
    }
  }

  return files;
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const frontmatter = match[1];
  const lines = frontmatter.split("\n");
  const data = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) {
      continue;
    }

    const [, key, rawValue] = keyMatch;

    if (!rawValue.trim()) {
      const items = [];
      let cursor = index + 1;
      while (cursor < lines.length && /^\s+-\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^\s+-\s+/, "").trim());
        cursor += 1;
      }

      if (items.length) {
        data[key] = items.map((item) => parseScalar(item));
        index = cursor - 1;
      }
      continue;
    }

    data[key] = parseScalar(rawValue);
  }

  return {
    data,
    content: raw.slice(match[0].length).trimStart()
  };
}

function wordCount(body) {
  return (body.match(/[\p{Script=Han}]|[A-Za-z0-9]+/gu) ?? []).length;
}

function toDate(value) {
  return new Date(value);
}

function sortTopTags(tagCounts) {
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.tag.localeCompare(right.tag, "zh-CN");
    });
}

export async function buildContentDashboard(files, now = new Date()) {
  const posts = [];

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const parsed = parseFrontmatter(raw);
    const data = parsed.data ?? {};

    if (data.publish === false) {
      continue;
    }

    const publishedAt = typeof data.publishedAt === "string" ? toDate(data.publishedAt) : new Date(data.publishedAt);
    const tags = Array.isArray(data.tags) ? data.tags.filter(Boolean) : [];
    posts.push({
      category: data.category === "tech" ? "tech" : "life",
      publishedAt,
      tags,
      words: wordCount(parsed.content)
    });
  }

  const categoryCounts = { tech: 0, life: 0 };
  const tagCounts = new Map();
  let totalWords = 0;
  let postsLast30Days = 0;
  const threshold = getRangeStart(30, now).getTime();

  for (const post of posts) {
    categoryCounts[post.category] += 1;
    totalWords += post.words;
    if (post.publishedAt.getTime() >= threshold) {
      postsLast30Days += 1;
    }

    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return {
    totalPosts: posts.length,
    postsLast30Days,
    categories: categoryCounts,
    totalTags: tagCounts.size,
    topTags: sortTopTags(tagCounts).slice(0, 8),
    totalWords,
    averageWordsPerPost: posts.length ? Math.round(totalWords / posts.length) : 0
  };
}

function buildPublisherDashboard(publisherState, now = new Date()) {
  if (!publisherState) {
    return emptyPublisherStats();
  }

  const threshold = getRangeStart(7, now).getTime();
  const syncsLast7Days = (publisherState.syncHistory ?? []).filter(
    (entry) => new Date(entry.finishedAt).getTime() >= threshold
  ).length;

  return {
    status: publisherState.status ?? "warning",
    lastSyncAt: publisherState.lastSyncAt ?? null,
    lastSuccessAt: publisherState.lastSuccessAt ?? null,
    lastFailureAt: publisherState.lastFailureAt ?? null,
    lastFailureReason: publisherState.lastFailureReason ?? null,
    pendingCount: Number(publisherState.pendingCount ?? 0),
    syncsLast7Days
  };
}

function buildSummary(content, traffic, publisher) {
  return {
    totalPosts: content.totalPosts,
    postsLast30Days: content.postsLast30Days,
    todayPageViews: traffic.today.pageviews,
    visitsLast30Days: traffic.last30Days.visitors,
    publisherStatus: publisher.status,
    lastPublishedAt: publisher.lastSuccessAt
  };
}

export async function generatePrivateDashboard(now = new Date()) {
  const files = await collectPostFiles(postsRoot);
  const content = await buildContentDashboard(files, now);
  const traffic = (await readJsonFile(umamiSnapshotPath, emptyTrafficStats())) ?? emptyTrafficStats();
  const publisherState = await readJsonFile(publisherStatePath, null);
  const publisher = buildPublisherDashboard(publisherState, now);
  const dashboard = {
    generatedAt: now.toISOString(),
    summary: buildSummary(content, traffic, publisher),
    content: {
      totalPosts: content.totalPosts,
      categories: content.categories,
      totalTags: content.totalTags,
      topTags: content.topTags,
      totalWords: content.totalWords,
      averageWordsPerPost: content.averageWordsPerPost
    },
    traffic,
    publisher
  };

  await writeJsonFile(privateDashboardPath, dashboard);
  return dashboard;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dashboard = await generatePrivateDashboard();
  console.log(
    `Private dashboard updated: ${privateDashboardPath} (${dashboard.content.totalPosts} posts)`
  );
}
