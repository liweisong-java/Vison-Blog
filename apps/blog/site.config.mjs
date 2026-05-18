export const siteUrl = process.env.SITE_URL ?? "https://example.com";

export const siteConfig = {
  title: "伟松的博客",
    description: "记录写作、思考、代码、工具与日常片段的中文个人博客。",
  siteUrl,
  nav: [
    { href: "/", label: "首页" },
    { href: "/archive/", label: "归档" },
    { href: "/about/", label: "关于我" }
  ],
  giscus: {
    repo: process.env.GISCUS_REPO ?? "owner/repo",
    repoId: process.env.GISCUS_REPO_ID ?? "REPO_ID",
    category: process.env.GISCUS_CATEGORY ?? "Announcements",
    categoryId: process.env.GISCUS_CATEGORY_ID ?? "CATEGORY_ID",
    mapping: process.env.GISCUS_MAPPING ?? "pathname",
    theme: process.env.GISCUS_THEME ?? "light"
  }
};

export function isGiscusConfigured(config = siteConfig.giscus) {
  const placeholders = new Set(["owner/repo", "REPO_ID", "CATEGORY_ID"]);
  return !placeholders.has(config.repo) && !placeholders.has(config.repoId) && !placeholders.has(config.categoryId);
}
