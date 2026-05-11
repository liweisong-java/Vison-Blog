import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initPublisherFiles } from "../src/commands/init";

describe("initPublisherFiles", () => {
  it("creates local env and config files from examples without overwriting existing files", async () => {
    const root = await mkdtemp(join(tmpdir(), "publisher-init-"));
    const envExamplePath = join(root, ".env.example");
    const envPath = join(root, ".env");
    const configExamplePath = join(root, "publisher.config.example.json");
    const configPath = join(root, "publisher.config.json");

    await writeFile(envExamplePath, "SIYUAN_TOKEN=demo\n", "utf8");
    await writeFile(configExamplePath, '{ "notebookId": "demo" }\n', "utf8");

    const firstRun = await initPublisherFiles({
      envExamplePath,
      envPath,
      configExamplePath,
      configPath
    });

    expect(firstRun.created).toEqual([envPath, configPath]);
    expect(await readFile(envPath, "utf8")).toContain("SIYUAN_TOKEN=demo");
    expect(await readFile(configPath, "utf8")).toContain('"notebookId": "demo"');

    await writeFile(envPath, "SIYUAN_TOKEN=real\n", "utf8");

    const secondRun = await initPublisherFiles({
      envExamplePath,
      envPath,
      configExamplePath,
      configPath
    });

    expect(secondRun.created).toEqual([]);
    expect(secondRun.skipped).toEqual([envPath, configPath]);
    expect(await readFile(envPath, "utf8")).toContain("SIYUAN_TOKEN=real");
  });
});
