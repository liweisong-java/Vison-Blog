import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deployLocalStaticSite } from "../src/deploy";

describe("video-to-blog deploy", () => {
  it("switches the current static release atomically", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-to-blog-deploy-"));
    const distDir = join(root, "dist");
    const deployRoot = join(root, "deploy");

    await mkdir(distDir, { recursive: true });
    await writeFile(join(distDir, "index.html"), "<h1>ok</h1>", "utf8");

    const result = await deployLocalStaticSite({
      distDir,
      deployRoot,
      releaseId: "release-1"
    });

    expect(result.releaseDir).toBe(join(deployRoot, "releases", "release-1"));
    expect(await readFile(join(deployRoot, "current", "index.html"), "utf8")).toContain("ok");
  });
});
