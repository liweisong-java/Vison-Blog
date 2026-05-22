import {mkdtemp, mkdir, readFile, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {afterEach, describe, expect, it} from "vitest";

const tempRoots: string[] = [];

afterEach(async () => {
  for (const root of tempRoots.splice(0)) {
    await import("node:fs/promises").then(({rm}) =>
      rm(root, {recursive: true, force: true})
    );
  }
});

describe("composite site build", () => {
  it("merges quartz public pages with astro private pages and post redirects", async () => {
    const root = await mkdtemp(join(tmpdir(), "vision-composite-site-"));
    tempRoots.push(root);

    const quartzDir = join(root, "quartz");
    const astroDir = join(root, "astro");
    const outDir = join(root, "site");

    await mkdir(join(quartzDir, "agent"), {recursive: true});
    await mkdir(join(quartzDir, "static"), {recursive: true});
    await mkdir(join(quartzDir, "tags"), {recursive: true});
    await mkdir(join(astroDir, "about"), {recursive: true});
    await mkdir(join(astroDir, "archive"), {recursive: true});
    await mkdir(join(astroDir, "desk"), {recursive: true});
    await mkdir(join(astroDir, "secret-dashboard"), {recursive: true});

    await writeFile(join(quartzDir, "index.html"), "<html><body>Quartz Home</body></html>", "utf8");
    await writeFile(join(quartzDir, "agent", "index.html"), "<html><body>Quartz Post</body></html>", "utf8");
    await writeFile(join(quartzDir, "tags", "index.html"), "<html><body>Quartz Tags</body></html>", "utf8");
    await writeFile(join(quartzDir, "static", "icon.png"), "icon", "utf8");

    await writeFile(join(astroDir, "about", "index.html"), "<html><body>About Astro</body></html>", "utf8");
    await writeFile(join(astroDir, "archive", "index.html"), "<html><body>Archive Astro</body></html>", "utf8");
    await writeFile(join(astroDir, "desk", "index.html"), "<html><body>Desk Astro</body></html>", "utf8");
    await mkdir(join(astroDir, "_astro"), {recursive: true});
    await writeFile(
      join(astroDir, "secret-dashboard", "index.html"),
      "<html><body>Secret Dashboard</body></html>",
      "utf8"
    );
    await writeFile(join(astroDir, "_astro", "private.css"), "body{color:#000;}", "utf8");

    const {buildCompositeSite} = await import("../../../scripts/build-composite-site.mjs");

    await buildCompositeSite({
      quartzDir,
      astroDir,
      outDir,
      redirectSlugs: ["agent"]
    });

    await expect(readFile(join(outDir, "index.html"), "utf8")).resolves.toContain("Quartz Home");
    await expect(readFile(join(outDir, "agent", "index.html"), "utf8")).resolves.toContain("Quartz Post");
    await expect(readFile(join(outDir, "about", "index.html"), "utf8")).resolves.toContain("About Astro");
    await expect(readFile(join(outDir, "archive", "index.html"), "utf8")).resolves.toContain("Archive Astro");
    await expect(readFile(join(outDir, "desk", "index.html"), "utf8")).resolves.toContain("Desk Astro");
    await expect(readFile(join(outDir, "secret-dashboard", "index.html"), "utf8")).resolves.toContain(
      "Secret Dashboard"
    );
    await expect(readFile(join(outDir, "posts", "agent", "index.html"), "utf8")).resolves.toContain(
      'http-equiv="refresh"'
    );
    await expect(readFile(join(outDir, "posts", "agent", "index.html"), "utf8")).resolves.toContain(
      'url=/agent/'
    );
    await expect(readFile(join(outDir, "static", "icon.png"), "utf8")).resolves.toBe("icon");
    await expect(readFile(join(outDir, "_astro", "private.css"), "utf8")).resolves.toContain("color:#000");
  });

  it("documents the composite production deployment contract", async () => {
    const rootPackageJson = JSON.parse(
      await readFile(resolve(process.cwd(), "../../package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };
    const deployWorkflow = await readFile(
      resolve(process.cwd(), "../../.github/workflows/deploy.yml"),
      "utf8"
    );
    const serverScript = await readFile(
      resolve(process.cwd(), "../../scripts/server-publish-cycle.mjs"),
      "utf8"
    );

    expect(rootPackageJson.scripts?.build).toContain("pnpm --filter quartz build");
    expect(deployWorkflow).toContain("pnpm build");
    expect(deployWorkflow).toContain("site-dist/");
    expect(serverScript).toContain("build-composite-site.mjs");
    expect(serverScript).toContain("site-dist");
  });
});
