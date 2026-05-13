export type VideoToBlogConfig = {
  contentRoot: string;
  stateRoot: string;
  deployRoot: string;
  ytDlpBin: string;
  ytDlpArgs: string[];
  ytDlpArgsByPlatform: Partial<Record<SupportedVideoPlatform, string[]>>;
  pythonBin: string;
  whisperModel: string;
  tempRoot: string;
};

export type VideoToBlogRuntime = {
  workspaceRoot: string;
  toolRoot: string;
  envPath: string;
  configPath: string;
  stateRoot: string;
  queuePath: string;
  jobsRoot: string;
  manifestPath: string;
  tempRoot: string;
  repoLockPath: string;
};

export type VideoToBlogJobStatus = "queued" | "running" | "succeeded" | "failed";

export type VideoToBlogJob = {
  id: string;
  url: string;
  status: VideoToBlogJobStatus;
  createdAt: string;
  updatedAt: string;
  slug?: string;
  error?: string;
};

export type VideoToBlogQueueState = {
  jobs: VideoToBlogJob[];
};

export type VideoSourceManifestEntry = {
  url: string;
  slug: string;
  updatedAt: string;
};

export type VideoSourceManifest = {
  videos: VideoSourceManifestEntry[];
};

export type SupportedVideoPlatform = "youtube" | "bilibili" | "douyin";

export type VideoMetadata = {
  id: string;
  title: string;
  webpageUrl: string;
  platform: SupportedVideoPlatform;
  uploader?: string;
  uploaderUrl?: string;
  description?: string;
  duration?: number;
  publishedAt?: string;
  subtitles: string[];
  automaticSubtitles: string[];
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type Transcript = {
  source: "subtitle" | "asr";
  language?: string;
  text: string;
  segments: TranscriptSegment[];
};

export type ComposedArticle = {
  slug: string;
  title: string;
  body: string;
  canonicalUrl: string;
};

export type VideoRequestJson = (url: string, options?: { headers?: Record<string, string> }) => Promise<unknown>;
