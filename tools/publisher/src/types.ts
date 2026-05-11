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
  attrs: PublisherAttrs;
};

export type SiYuanDocument = {
  id: string;
  content: string;
  hpath: string;
  updated: string;
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
