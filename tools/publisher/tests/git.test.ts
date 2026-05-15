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
    expect(result).toEqual({ committed: false, pushed: false, stagedFiles: [] });
    expect(commit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("commits and pushes when managed files are staged", async () => {
    raw.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");

      if (command === "diff --cached --name-only") {
        return "apps/blog/src/content/posts/from-notes-to-site/index.mdx\n";
      }

      if (command === "branch --show-current") {
        return "main\n";
      }

      if (command === "rev-parse --abbrev-ref --symbolic-full-name @{u}") {
        return "origin/main\n";
      }

      if (command === "rev-parse HEAD") {
        return "abc123def456\n";
      }

      throw new Error(`Unexpected git raw command: ${command}`);
    });

    const { commitAndPush } = await import("../src/git");
    const result = await commitAndPush({
      repoRoot: "/tmp/vision-blog",
      branch: "main",
      remote: "origin",
      message: "chore(content): sync siyuan posts",
      includePaths: ["/tmp/vision-blog/apps/blog/src/content/posts"]
    });

    expect(commit).toHaveBeenCalledWith("chore(content): sync siyuan posts");
    expect(push).toHaveBeenCalledWith("origin", "HEAD:main");
    expect(result).toEqual({
      committed: true,
      pushed: true,
      commitHash: "abc123def456",
      stagedFiles: ["apps/blog/src/content/posts/from-notes-to-site/index.mdx"]
    });
  });

  it("pushes to the current upstream branch when no branch override is configured", async () => {
    raw.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");

      if (command === "diff --cached --name-only") {
        return "exports/wechat/from-notes-to-site.md\n";
      }

      if (command === "branch --show-current") {
        return "codex/auto-publish\n";
      }

      if (command === "rev-parse --abbrev-ref --symbolic-full-name @{u}") {
        return "origin/codex/lightweight-siyuan-blog-rebuild\n";
      }

      if (command === "rev-parse HEAD") {
        return "fedcba654321\n";
      }

      throw new Error(`Unexpected git raw command: ${command}`);
    });

    const { commitAndPush } = await import("../src/git");
    await commitAndPush({
      repoRoot: "/tmp/vision-blog",
      remote: "origin",
      message: "chore(content): sync siyuan posts",
      includePaths: ["/tmp/vision-blog/exports/wechat"]
    });

    expect(push).toHaveBeenCalledWith("origin", "HEAD:codex/lightweight-siyuan-blog-rebuild");
  });

  it("rejects an unsafe branch override that does not match the current branch or upstream", async () => {
    raw.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");

      if (command === "diff --cached --name-only") {
        return "apps/blog/src/content/posts/from-notes-to-site/index.mdx\n";
      }

      if (command === "branch --show-current") {
        return "codex/auto-publish\n";
      }

      if (command === "rev-parse --abbrev-ref --symbolic-full-name @{u}") {
        return "origin/codex/lightweight-siyuan-blog-rebuild\n";
      }

      if (command === "rev-parse HEAD") {
        return "unsafe123\n";
      }

      throw new Error(`Unexpected git raw command: ${command}`);
    });

    const { commitAndPush } = await import("../src/git");

    await expect(
      commitAndPush({
        repoRoot: "/tmp/vision-blog",
        branch: "master",
        remote: "origin",
        message: "chore(content): sync siyuan posts",
        includePaths: ["/tmp/vision-blog/apps/blog/src/content/posts"]
      })
    ).rejects.toThrow(/master/);

    expect(commit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("allows pushing an explicit branch from a detached worktree when HEAD matches the remote branch tip", async () => {
    let headReads = 0;

    raw.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");

      if (command === "diff --cached --name-only") {
        return "apps/blog/src/content/posts/post-mpxnkju/index.mdx\n";
      }

      if (command === "branch --show-current") {
        return "\n";
      }

      if (command === "rev-parse --abbrev-ref --symbolic-full-name @{u}") {
        throw new Error("fatal: no upstream configured");
      }

      if (command === "rev-parse HEAD") {
        headReads += 1;
        return headReads === 1 ? "base123\n" : "commit456\n";
      }

      if (command === "rev-parse --verify refs/remotes/origin/master") {
        return "base123\n";
      }

      throw new Error(`Unexpected git raw command: ${command}`);
    });

    const { commitAndPush } = await import("../src/git");
    const result = await commitAndPush({
      repoRoot: "/tmp/vision-blog",
      branch: "master",
      remote: "origin",
      message: "chore(content): sync siyuan posts",
      includePaths: ["/tmp/vision-blog/apps/blog/src/content/posts"]
    });

    expect(commit).toHaveBeenCalledWith("chore(content): sync siyuan posts");
    expect(push).toHaveBeenCalledWith("origin", "HEAD:master");
    expect(result).toEqual({
      committed: true,
      pushed: true,
      commitHash: "commit456",
      stagedFiles: ["apps/blog/src/content/posts/post-mpxnkju/index.mdx"]
    });
  });

  it("commits without pushing when git push is disabled", async () => {
    raw.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");

      if (command === "diff --cached --name-only") {
        return "apps/blog/src/content/posts/post-6voggsk/index.mdx\n";
      }

      if (command === "rev-parse HEAD") {
        return "dea1efacafe1234\n";
      }

      throw new Error(`Unexpected git raw command: ${command}`);
    });

    const { commitAndPush } = await import("../src/git");
    const result = await commitAndPush({
      repoRoot: "/tmp/vision-blog",
      remote: "origin",
      message: "chore(content): sync siyuan posts",
      includePaths: ["/tmp/vision-blog/apps/blog/src/content/posts"],
      push: false
    });

    expect(commit).toHaveBeenCalledWith("chore(content): sync siyuan posts");
    expect(push).not.toHaveBeenCalled();
    expect(result).toEqual({
      committed: true,
      pushed: false,
      commitHash: "dea1efacafe1234",
      stagedFiles: ["apps/blog/src/content/posts/post-6voggsk/index.mdx"]
    });
  });

  it("rebases and retries when the remote branch has advanced", async () => {
    let pushAttempts = 0;
    raw.mockImplementation(async (args: string[]) => {
      const command = args.join(" ");

      if (command === "diff --cached --name-only") {
        return "apps/blog/src/content/posts/post-6voggsk/index.mdx\n";
      }

      if (command === "branch --show-current") {
        return "master\n";
      }

      if (command === "rev-parse --abbrev-ref --symbolic-full-name @{u}") {
        return "origin/master\n";
      }

      if (command === "rev-parse HEAD") {
        return "dea1efacafe1234\n";
      }

      if (command === "rebase refs/remotes/origin/master") {
        return "";
      }

      if (command === "fetch origin master") {
        return "";
      }

      throw new Error(`Unexpected git raw command: ${command}`);
    });
    push.mockImplementation(async () => {
      pushAttempts += 1;
      if (pushAttempts === 1) {
        throw new Error("! [rejected] HEAD -> master (fetch first)");
      }
    });

    const { commitAndPush } = await import("../src/git");
    const result = await commitAndPush({
      repoRoot: "/tmp/vision-blog",
      branch: "master",
      remote: "origin",
      message: "chore(content): sync siyuan posts",
      includePaths: ["/tmp/vision-blog/apps/blog/src/content/posts"]
    });

    expect(push).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      committed: true,
      pushed: true,
      commitHash: "dea1efacafe1234",
      stagedFiles: ["apps/blog/src/content/posts/post-6voggsk/index.mdx"]
    });
  });
});
