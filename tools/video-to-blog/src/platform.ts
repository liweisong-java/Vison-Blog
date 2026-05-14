import type { SupportedVideoPlatform } from "./types.js";

function normalizeHostname(input: string) {
  return input.toLowerCase().replace(/^www\./, "");
}

export function detectVideoPlatform(url: string): SupportedVideoPlatform {
  const parsed = new URL(url);
  const hostname = normalizeHostname(parsed.hostname);

  if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtu.be") {
    return "youtube";
  }

  if (hostname === "bilibili.com" || hostname.endsWith(".bilibili.com") || hostname === "b23.tv") {
    return "bilibili";
  }

  if (hostname === "douyin.com" || hostname.endsWith(".douyin.com") || hostname === "iesdouyin.com") {
    return "douyin";
  }

  throw new Error(`Unsupported public video platform: ${hostname}`);
}

export function getPlatformLabel(platform: SupportedVideoPlatform) {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "bilibili":
      return "Bilibili";
    case "douyin":
      return "抖音";
  }
}
