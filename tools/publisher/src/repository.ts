import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";

export async function collectContentEntries(contentRoot: string) {
  const files = await fg(["**/index.mdx", "**/index.md"], { cwd: contentRoot });
  const posts = [];

  for (const relativePath of files) {
    const absolutePath = join(contentRoot, relativePath);
    const parsed = matter(await readFile(absolutePath, "utf8"));
    posts.push({
      slug: String(parsed.data.slug ?? relativePath.split("/")[0]),
      sourceId: typeof parsed.data.sourceId === "string" ? parsed.data.sourceId : undefined,
      directory: absolutePath.replace(/\/index\.(md|mdx)$/, "")
    });
  }

  return posts;
}
