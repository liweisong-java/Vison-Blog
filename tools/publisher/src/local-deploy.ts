import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { rename, symlink } from "node:fs/promises";

export async function deployLocalStaticSite({
  distDir,
  deployRoot,
  releaseId
}: {
  distDir: string;
  deployRoot: string;
  releaseId: string;
}) {
  const resolvedDistDir = resolve(distDir);
  const resolvedDeployRoot = resolve(deployRoot);
  const releasesDir = join(resolvedDeployRoot, "releases");
  const releaseDir = join(releasesDir, releaseId);
  const nextLink = join(resolvedDeployRoot, ".next-current");
  const currentLink = join(resolvedDeployRoot, "current");

  await mkdir(releasesDir, { recursive: true });
  await rm(releaseDir, { recursive: true, force: true });
  await cp(resolvedDistDir, releaseDir, { recursive: true });

  await rm(nextLink, { force: true }).catch(() => undefined);
  await symlink(releaseDir, nextLink);
  await rm(currentLink, { force: true }).catch(() => undefined);
  await rename(nextLink, currentLink);

  return {
    releaseDir,
    currentLink
  };
}
