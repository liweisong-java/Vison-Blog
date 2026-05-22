import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "伟松的博客",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: false,
    analytics: null,
    locale: "zh-CN",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "PingFang SC",
        body: "PingFang SC",
        code: "SF Mono",
      },
      colors: {
        lightMode: {
          light: "#fbfaf7",
          lightgray: "#e6e0d7",
          gray: "#b6aa98",
          darkgray: "#5d5146",
          dark: "#241f1a",
          secondary: "#8a4d2f",
          tertiary: "#d2a679",
          highlight: "rgba(210, 166, 121, 0.16)",
          textHighlight: "#f8d66d88",
        },
        darkMode: {
          light: "#1b1713",
          lightgray: "#37302a",
          gray: "#6d6258",
          darkgray: "#ddd3c6",
          dark: "#f4efe7",
          secondary: "#d8a37b",
          tertiary: "#d4b28c",
          highlight: "rgba(216, 163, 123, 0.16)",
          textHighlight: "#f0c85d88",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
