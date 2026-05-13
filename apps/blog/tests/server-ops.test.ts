import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {describe, expect, it} from "vitest";

describe("server-led publishing script", () => {
  it("keeps the server publish cycle isolated through git worktree runtime copies", async () => {
    const script = await readFile(resolve(process.cwd(), "../../scripts/server-publish-cycle.mjs"), "utf8");

    expect(script).toContain("git");
    expect(script).toContain("worktree");
    expect(script).toContain("SERVER_PUBLISH_PUSH_CONTENT");
    expect(script).toContain('PUBLISH_PUSH: pushContent ? "true" : "false"');
    expect(script).toContain("deploy-local");
    expect(script).toContain("pnpm");
    expect(script).toContain("exec");
    expect(script).toContain("tsx");
    expect(script).toContain("src/cli.ts");
    expect(script).toContain("astro");
    expect(script).toContain("generate-private-dashboard.mjs");
    expect(script).toContain("PUBLISH_SKIP_BLOG_CHECKS: \"true\"");
    expect(script).toContain("PUBLISH_SYNC_BEFORE_EXPORT: \"true\"");
    expect(script).toContain('"config", "user.name"');
    expect(script).toContain('"config", "user.email"');
    expect(script).toContain("user.name");
    expect(script).toContain("user.email");
  });
});
