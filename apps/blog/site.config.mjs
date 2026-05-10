export const siteUrl = process.env.SITE_URL ?? "https://example.com";

export const siteConfig = {
  title: "Vision Blog",
  description: "Writing across code and life.",
  siteUrl,
  nav: [
    { href: "/", label: "Home" },
    { href: "/category/tech/", label: "Tech" },
    { href: "/category/life/", label: "Life" },
    { href: "/archive/", label: "Archive" },
    { href: "/about/", label: "About" }
  ],
  giscus: {
    repo: "owner/repo",
    repoId: "REPO_ID",
    category: "Announcements",
    categoryId: "CATEGORY_ID",
    mapping: "pathname",
    theme: "light"
  }
};
