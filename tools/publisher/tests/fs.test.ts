import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { writeBundle } from "../src/fs";

const tempDirectories: string[] = [];

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("writeBundle", () => {
  it("replaces an existing article file with the new contents", async () => {
    const root = await mkdtemp(join(tmpdir(), "vision-publisher-fs-test-"));
    tempDirectories.push(root);

    const articleDirectory = join(root, "ai-usage-notes");
    const filePath = join(articleDirectory, "index.mdx");
    await mkdir(articleDirectory, { recursive: true });
    await writeFile(filePath, "---\ntitle: old\n---\nold body\n", "utf8");

    await writeBundle(root, {
      filePath: "ai-usage-notes/index.mdx",
      body: "---\ntitle: new\n---\nnew body\n"
    });

    await expect(readFile(filePath, "utf8")).resolves.toBe("---\ntitle: new\n---\nnew body\n");
  });

  it("does not leave temporary files behind after replacing an article file", async () => {
    const root = await mkdtemp(join(tmpdir(), "vision-publisher-fs-test-"));
    tempDirectories.push(root);

    await writeBundle(root, {
      filePath: "ai-usage-notes/index.mdx",
      body: "---\ntitle: new\n---\nnew body\n"
    });

    await expect(stat(join(root, "ai-usage-notes", "index.mdx.tmp"))).rejects.toThrow();
  });
});
