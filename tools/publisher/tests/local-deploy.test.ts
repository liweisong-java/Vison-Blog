import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deployLocalStaticSite } from "../src/local-deploy";

describe("deployLocalStaticSite", () => {
  it("copies the built site into a release directory and switches current atomically", async () => {
    const root = await mkdtemp(join(tmpdir(), "vision-blog-local-deploy-"));
    const distDir = join(root, "dist");
    const deployRoot = join(root, "deploy");
    const oldReleaseDir = join(deployRoot, "releases", "old-release");

    await mkdir(distDir, { recursive: true });
    await mkdir(oldReleaseDir, { recursive: true });
    await writeFile(join(distDir, "index.html"), "<h1>new</h1>", { encoding: "utf8", flag: "w" });
    await writeFile(join(distDir, "posts.html"), "<p>post</p>", { encoding: "utf8", flag: "w" });
    await writeFile(join(oldReleaseDir, "index.html"), "<h1>old</h1>", { encoding: "utf8", flag: "w" });
    await symlink(oldReleaseDir, join(deployRoot, "current"));

    const result = await deployLocalStaticSite({
      distDir,
      deployRoot,
      releaseId: "new-release"
    });

    expect(result.releaseDir).toBe(join(deployRoot, "releases", "new-release"));
    expect(await readFile(join(result.releaseDir, "index.html"), "utf8")).toContain("new");
    expect(await readFile(join(deployRoot, "current", "posts.html"), "utf8")).toContain("post");
  });
});
