import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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
});
