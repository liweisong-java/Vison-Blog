import { describe, expect, it } from "vitest"
import type { QuartzPluginData } from "../quartz/plugins/vfile"
import { collectRenderableFolders } from "../quartz/plugins/emitters/folderPageFolders"

describe("collectRenderableFolders", () => {
  it("does not treat article containers as folder landing pages", () => {
    const files = [
      { slug: "on-dao-notes/index" },
      { slug: "agent/index" },
      { slug: "notes/index" },
      { slug: "notes/deep-dive/index" },
    ] as QuartzPluginData[]

    const folders = collectRenderableFolders(files)

    expect(folders.has("on-dao-notes")).toBe(false)
    expect(folders.has("agent")).toBe(false)
    expect(folders.has("notes")).toBe(false)
  })
})
