export type PublisherAttrs = {
  publish: string;
  category: string;
  excerpt: string;
  featured: string;
  slug: string;
  tags: string;
  publishedAt: string;
  cover?: string;
  canonicalUrl?: string;
  wechatReady?: string;
};

export type PublisherConfig = {
  notebookId: string;
  siyuanWorkspaceDir: string;
  contentRoot: string;
  wechatExportDir?: string;
  deployHookUrl?: string;
  localDeployRoot?: string;
  publisherStatePath?: string;
  attrs: PublisherAttrs;
};

export type PublisherSyncResultSummary = {
  written: number;
  removed: number;
  committed: boolean;
  deployed: boolean;
  invalidCount: number;
};

export type PublisherSyncHistoryEntry = {
  finishedAt: string;
  status: "success" | "failure";
};

export type PublisherState = {
  status: "healthy" | "warning" | "failed";
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
  pendingCount: number;
  syncHistory: PublisherSyncHistoryEntry[];
  lastResult: PublisherSyncResultSummary | null;
};

export type SiYuanDocument = {
  id: string;
  content: string;
  hpath: string;
  updated: string;
};

export type SiYuanSyncInfo = {
    stat: string;
    synced: number;
};

export type PublishedNote = {
  id: string;
  title: string;
  slug: string;
  category: "tech" | "life";
  excerpt: string;
  featured: boolean;
  publishedAt: string;
  tags: string[];
  canonicalUrl?: string;
  cover?: string;
  wechatReady?: boolean;
};
