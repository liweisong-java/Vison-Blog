import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import { resolve } from "node:path";
import {promisify} from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("quartz ui contracts", () => {
  it("keeps the layout focused on content instead of framework chrome", async () => {
    const layout = await readFile(resolve(process.cwd(), "quartz.layout.ts"), "utf8");
    const footer = await readFile(resolve(process.cwd(), "quartz/components/Footer.tsx"), "utf8");
    const quartzConfig = await readFile(resolve(process.cwd(), "quartz.config.ts"), "utf8");

    expect(layout).not.toContain("Component.PageTitle()");
    expect(layout).not.toContain("Component.ContentMeta()");
    expect(footer).not.toContain("Created with");
    expect(footer).not.toContain("Quartz v");
    expect(quartzConfig).not.toContain("Plugin.FolderPage()");
    expect(layout).not.toContain("ReaderMode()");
  });

  it("keeps the custom styles from hiding the main article body", async () => {
    const customScss = await readFile(resolve(process.cwd(), "quartz/styles/custom.scss"), "utf8");

    expect(customScss).not.toContain(".page-header + .popover-hint");
  });

  it("keeps the shared vault home free of migration placeholder copy", async () => {
    const homeEntry = await readFile(resolve(process.cwd(), "../../content/vault/posts/index.md"), "utf8");

    expect(homeEntry).not.toContain("Quartz 迁移骨架已经接入");
    expect(homeEntry).not.toContain("首页占位文件");
    expect(homeEntry).toContain("伟松的博客");
  });

  it("keeps the public quartz output with a root index page", async () => {
    await execFileAsync("pnpm", ["--filter", "quartz", "build"], {
      cwd: resolve(process.cwd(), "../.."),
      maxBuffer: 10 * 1024 * 1024,
    });

    const publicRootEntries = await import("node:fs/promises").then(({readdir}) =>
      readdir(resolve(process.cwd(), "public"))
    );

    expect(publicRootEntries).toContain("index.html");
  });

  it("keeps the home feed tuned for Chinese blog reading instead of single-line tool cards", async () => {
    const homeFeedStyle = await readFile(resolve(process.cwd(), "quartz/components/styles/homeFeed.scss"), "utf8");

    expect(homeFeedStyle).toContain("white-space: nowrap");
    expect(homeFeedStyle).toContain("text-overflow: ellipsis");
  });

  it("keeps article chrome lighter than a documentation sidebar layout", async () => {
    const customScss = await readFile(resolve(process.cwd(), "quartz/styles/custom.scss"), "utf8");
    const layout = await readFile(resolve(process.cwd(), "quartz.layout.ts"), "utf8");
    const contentLayoutBlock = layout.match(
      /export const defaultContentPageLayout:[\s\S]*?}\n\n\/\/ components for pages that display lists/
    )?.[0] ?? "";

    expect(customScss).toContain(".article-toc-shell");
    expect(customScss).toContain(".home-shell");
    expect(customScss).toContain(".center article.article-shell a.internal:not(.tag-link)");
    expect(customScss).toContain("background-color: transparent");
    expect(customScss).toContain(".center article.article-shell {\n  border: 0;");
    expect(contentLayoutBlock).not.toContain("Breadcrumbs");
    expect(contentLayoutBlock).not.toContain("TagList");
  });
});
