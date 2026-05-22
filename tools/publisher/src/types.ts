export type PublisherAttrs = {
  publish: string;
  category?: string;
  excerpt: string;
  featured: string;
  slug: string;
  tags: string;
  publishedAt: string;
  cover?: string;
  canonicalUrl?: string;
  wechatReady?: string;
};

export type PublisherSourceConfig =
  | {
      type: "siyuan";
      notebookId: string;
      workspaceDir: string;
    }
  | {
      type: "obsidian";
      vaultDir: string;
      notesDir?: string;
      assetsDir?: string;
    };

export type PublisherVaultConfig = {
  rootDir: string;
  postsDir: string;
  assetsDir: string;
};

export type PublisherContentTarget = {
  name: string;
  format: "astro-mdx" | "quartz-markdown";
  rootDir: string;
};

export type PublisherConfig = {
  source: PublisherSourceConfig;
  vault: PublisherVaultConfig;
  astroContentDir?: string;
  contentTargets: PublisherContentTarget[];
  wechatExportDir?: string;
  deployHookUrl?: string;
  localDeployRoot?: string;
  publisherStatePath?: string;
  attrs: PublisherAttrs;
};

export type LegacyPublisherConfig = {
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
  path?: string;
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
  excerpt: string;
  featured: boolean;
  publishedAt: string;
  tags: string[];
  canonicalUrl?: string;
  cover?: string;
  wechatReady?: boolean;
};
