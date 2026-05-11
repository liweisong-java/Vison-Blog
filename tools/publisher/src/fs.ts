import { cp, mkdir, rm, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function writeBundle(contentRoot: string, bundle: { filePath: string; body: string }) {
  const target = join(contentRoot, bundle.filePath);
  const temporaryTarget = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temporaryTarget, bundle.body, "utf8");
  await rename(temporaryTarget, target);
}

export async function copyAssetFiles(
  siyuanWorkspaceDir: string,
  contentRoot: string,
  slug: string,
  assets: { sourcePath: string; fileName: string }[]
) {
  for (const asset of assets) {
    await cp(join(siyuanWorkspaceDir, "data", asset.sourcePath), join(contentRoot, slug, asset.fileName));
  }
}

export async function removeManagedPost(contentRoot: string, slug: string) {
  await rm(join(contentRoot, slug), { recursive: true, force: true });
}

export async function writeWechatArticle(
  exportRoot: string,
  article: { filePath: string; body: string }
) {
  const target = join(exportRoot, article.filePath);
  const temporaryTarget = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temporaryTarget, article.body, "utf8");
  await rename(temporaryTarget, target);
}

export async function removeWechatArticle(exportRoot: string, slug: string) {
  await rm(join(exportRoot, `${slug}.md`), { force: true });
}
