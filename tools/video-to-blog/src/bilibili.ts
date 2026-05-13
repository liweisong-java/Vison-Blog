import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { VideoMetadata, VideoRequestJson } from "./types.js";

type BilibiliViewResponse = {
  code?: number;
  data?: {
    bvid?: string;
    title?: string;
    desc?: string;
    duration?: number;
    pubdate?: number;
    owner?: {
      name?: string;
      mid?: number;
    };
  };
};

type BilibiliPageListResponse = {
  code?: number;
  data?: Array<{
    cid?: number;
  }>;
};

type BilibiliSubtitleResponse = {
  code?: number;
  data?: {
    subtitle?: {
      subtitles?: Array<{
        lan?: string;
        subtitle_url?: string;
      }>;
    };
  };
};

type BilibiliSubtitleJson = {
  body?: Array<{
    from?: number;
    to?: number;
    content?: string;
  }>;
};

function formatDateFromUnix(seconds: number | undefined) {
  if (!seconds) {
    return undefined;
  }

  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function parseBvid(url: string) {
  const match = /\/video\/(BV[0-9A-Za-z]+)/i.exec(url);
  if (!match) {
    throw new Error(`Unable to parse Bilibili bvid from URL: ${url}`);
  }

  return match[1];
}

function formatSrtTimestamp(value: number) {
  const hours = Math.floor(value / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((value % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  const milliseconds = Math.round((value % 1) * 1000)
    .toString()
    .padStart(3, "0");

  return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

function buildSrt(body: Array<{ from?: number; to?: number; content?: string }>) {
  return body
    .map((item, index) => {
      const start = formatSrtTimestamp(item.from ?? 0);
      const end = formatSrtTimestamp(item.to ?? item.from ?? 0);
      return [`${index + 1}`, `${start} --> ${end}`, item.content?.trim() ?? "", ""].join("\n");
    })
    .join("\n");
}

async function getPrimaryCid(bvid: string, requestJson: VideoRequestJson) {
  const pageList = (await requestJson(
    `https://api.bilibili.com/x/player/pagelist?bvid=${encodeURIComponent(bvid)}&jsonp=jsonp`
  )) as BilibiliPageListResponse;
  const cid = pageList.data?.[0]?.cid;
  if (!cid) {
    throw new Error(`Bilibili public API did not return a cid for ${bvid}`);
  }

  return cid;
}

export async function fetchBilibiliMetadata({
  url,
  requestJson
}: {
  url: string;
  requestJson: VideoRequestJson;
}): Promise<VideoMetadata> {
  const bvid = parseBvid(url);
  const view = (await requestJson(
    `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`
  )) as BilibiliViewResponse;
  const data = view.data;

  if (!data?.bvid || !data.title) {
    throw new Error(`Bilibili public API did not return metadata for ${bvid}`);
  }

  const cid = await getPrimaryCid(bvid, requestJson);
  const subtitleInfo = (await requestJson(
    `https://api.bilibili.com/x/player/v2?bvid=${encodeURIComponent(bvid)}&cid=${cid}`
  )) as BilibiliSubtitleResponse;
  const subtitles = (subtitleInfo.data?.subtitle?.subtitles ?? [])
    .map((item) => item.lan)
    .filter((value): value is string => Boolean(value));

  return {
    id: data.bvid,
    title: data.title,
    webpageUrl: url,
    platform: "bilibili",
    uploader: data.owner?.name,
    uploaderUrl: data.owner?.mid ? `https://space.bilibili.com/${data.owner.mid}` : undefined,
    description: data.desc,
    duration: data.duration,
    publishedAt: formatDateFromUnix(data.pubdate),
    subtitles,
    automaticSubtitles: []
  };
}

export async function downloadBilibiliSubtitleArtifacts({
  url,
  outputRoot,
  requestJson
}: {
  url: string;
  outputRoot: string;
  requestJson: VideoRequestJson;
}) {
  const bvid = parseBvid(url);
  const cid = await getPrimaryCid(bvid, requestJson);
  const subtitleInfo = (await requestJson(
    `https://api.bilibili.com/x/player/v2?bvid=${encodeURIComponent(bvid)}&cid=${cid}`
  )) as BilibiliSubtitleResponse;
  const subtitles = subtitleInfo.data?.subtitle?.subtitles ?? [];

  if (!subtitles.length) {
    return [];
  }

  await mkdir(outputRoot, { recursive: true });
  const artifacts: string[] = [];

  for (const subtitle of subtitles) {
    if (!subtitle.lan || !subtitle.subtitle_url) {
      continue;
    }

    const payload = (await requestJson(subtitle.subtitle_url)) as BilibiliSubtitleJson;
    const filePath = join(outputRoot, `subtitle.${subtitle.lan}.srt`);
    await writeFile(filePath, buildSrt(payload.body ?? []), "utf8");
    artifacts.push(filePath);
  }

  return artifacts;
}
