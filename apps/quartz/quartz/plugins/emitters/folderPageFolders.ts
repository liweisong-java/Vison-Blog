import type { QuartzPluginData } from "../vfile"
import { type FullSlug, type SimpleSlug, simplifySlug, stripSlashes } from "../../util/path"

function getFoldersForSlug(slug: string): SimpleSlug[] {
  const segments = slug.split("/")
  const folders: SimpleSlug[] = []

  for (let index = 0; index < segments.length - 1; index += 1) {
    const folder = segments.slice(0, index + 1).join("/")
    if (folder) {
      folders.push(folder as SimpleSlug)
    }
  }

  return folders
}

export function collectRenderableFolders(allFiles: QuartzPluginData[]): Set<SimpleSlug> {
  const articleContainers = new Set(
    allFiles
      .map((data) => data.slug)
      .filter((slug): slug is FullSlug => Boolean(slug))
      .filter((slug) => slug.endsWith("/index"))
      .map((slug) => stripSlashes(simplifySlug(slug))),
  )

  return new Set(
    allFiles.flatMap((data) => {
      return data.slug
        ? getFoldersForSlug(data.slug).filter(
            (folderName) =>
              folderName !== "." &&
              folderName !== "tags" &&
              !articleContainers.has(stripSlashes(folderName) as SimpleSlug),
          )
        : []
    }),
  )
}
