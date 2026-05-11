import { beforeEach, describe, expect, it, vi } from "vitest";

const add = vi.fn();
const raw = vi.fn();
const commit = vi.fn();
const push = vi.fn();

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => ({
    add,
    raw,
    commit,
    push
  }))
}));

describe("commitAndPush", () => {
  beforeEach(() => {
    add.mockReset();
    raw.mockReset();
    commit.mockReset();
    push.mockReset();
  });

  it("stages only managed paths and skips commit when nothing is staged", async () => {
    raw.mockResolvedValue("");

    const { commitAndPush } = await import("../src/git");
    const result = await commitAndPush({
      repoRoot: "/tmp/vision-blog",
      branch: "main",
      remote: "origin",
      message: "chore(content): sync siyuan posts",
      includePaths: [
        "/tmp/vision-blog/apps/blog/src/content/posts",
        "/tmp/vision-blog/exports/wechat"
      ]
    });

    expect(add).toHaveBeenCalledWith([
      "apps/blog/src/content/posts",
      "exports/wechat"
    ]);
    expect(result).toEqual({ committed: false, stagedFiles: [] });
    expect(commit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("commits and pushes when managed files are staged", async () => {
    raw.mockResolvedValue("apps/blog/src/content/posts/from-notes-to-site/index.mdx\n");

    const { commitAndPush } = await import("../src/git");
    const result = await commitAndPush({
      repoRoot: "/tmp/vision-blog",
      branch: "main",
      remote: "origin",
      message: "chore(content): sync siyuan posts",
      includePaths: ["/tmp/vision-blog/apps/blog/src/content/posts"]
    });

    expect(commit).toHaveBeenCalledWith("chore(content): sync siyuan posts");
    expect(push).toHaveBeenCalledWith("origin", "main");
    expect(result).toEqual({
      committed: true,
      stagedFiles: ["apps/blog/src/content/posts/from-notes-to-site/index.mdx"]
    });
  });
});
