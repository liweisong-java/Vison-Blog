import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {describe, expect, it} from "vitest";

describe("server-led publishing script", () => {
  it("keeps the server publish cycle isolated through git worktree runtime copies", async () => {
    const script = await readFile(resolve(process.cwd(), "../../scripts/server-publish-cycle.mjs"), "utf8");

    expect(script).toContain("git");
    expect(script).toContain("worktree");
    expect(script).toContain("PUBLISH_PUSH: \"false\"");
    expect(script).toContain("deploy-local");
    expect(script).toContain("pnpm");
    expect(script).toContain("exec");
    expect(script).toContain("tsx");
    expect(script).toContain("src/cli.ts");
    expect(script).toContain("astro");
    expect(script).toContain("generate-private-dashboard.mjs");
    expect(script).toContain("PUBLISH_SKIP_BLOG_CHECKS: \"true\"");
    expect(script).toContain("PUBLISH_SYNC_BEFORE_EXPORT: \"true\"");
    expect(script).toContain("GIT_AUTHOR_NAME");
    expect(script).toContain("GIT_AUTHOR_EMAIL");
    expect(script).toContain("GIT_COMMITTER_NAME");
    expect(script).toContain("GIT_COMMITTER_EMAIL");
  });
});
