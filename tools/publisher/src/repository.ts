import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";

export async function collectManagedPosts(contentRoot: string) {
  const files = await fg("**/index.mdx", { cwd: contentRoot });
  const posts = [];

  for (const relativePath of files) {
    const absolutePath = join(contentRoot, relativePath);
    const parsed = matter(await readFile(absolutePath, "utf8"));
    if (parsed.data.sourceId) {
      posts.push({
        slug: parsed.data.slug,
        sourceId: parsed.data.sourceId,
        directory: absolutePath.replace(/\/index\.mdx$/, "")
      });
    }
  }

  return posts;
}
