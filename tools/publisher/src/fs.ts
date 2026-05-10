import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function writeBundle(contentRoot: string, bundle: { filePath: string; body: string }) {
  const target = join(contentRoot, bundle.filePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bundle.body, "utf8");
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
