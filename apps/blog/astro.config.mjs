import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { siteUrl } from "./site.config.mjs";

export default defineConfig({
  site: siteUrl,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/secret-dashboard/")
    })
  ]
});
