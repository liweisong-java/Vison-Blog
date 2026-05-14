import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { siteUrl } from "./site.config.mjs";

export default defineConfig({
  site: siteUrl,
  vite: {
    server: {
      proxy: {
        "/video-api": {
          target: "http://127.0.0.1:4319",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/video-api/, "")
        }
      }
    }
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes("/secret-dashboard/") &&
        !page.includes("/desk/") &&
        !page.includes("/desk/video/")
    })
  ]
});
