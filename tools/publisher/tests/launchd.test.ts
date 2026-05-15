import { describe, expect, it } from "vitest";
import {
  buildLaunchdPlist,
  getLaunchdLabel,
  getLaunchdPaths
} from "../src/launchd.js";
import { resolvePnpmBinary } from "../src/commands/auto.js";

describe("launchd helpers", () => {
  it("builds stable launchd paths from the workspace root", () => {
    const paths = getLaunchdPaths({
      homeDir: "/Users/liweisong",
      workspaceRoot: "/Users/liweisong/工作区/Vison-Blog"
    });

    expect(paths.plistPath).toBe(
      "/Users/liweisong/Library/LaunchAgents/com.liweisong.vision-blog.publisher.plist"
    );
    expect(paths.logPath).toBe(
      "/Users/liweisong/Library/Logs/vision-blog-auto-publish.log"
    );
  });

  it("renders a launchd plist with watch paths and interval", () => {
    const plist = buildLaunchdPlist({
      label: getLaunchdLabel(),
      program: "/opt/homebrew/bin/pnpm",
      args: ["publish:auto-once"],
      workingDirectory: "/Users/liweisong/工作区/Vison-Blog",
      watchPaths: [
        "/Users/liweisong/Library/Application Support/SiYuan/data/20260511123547-6ld6hlk"
      ],
      standardLogPath: "/Users/liweisong/Library/Logs/vision-blog-auto-publish.log",
      intervalSeconds: 300
    });

    expect(plist).toContain("com.liweisong.vision-blog.publisher");
    expect(plist).toContain("/opt/homebrew/bin/pnpm");
    expect(plist).toContain("<key>WatchPaths</key>");
    expect(plist).toContain("<integer>300</integer>");
  });

  it("prefers an actually existing pnpm binary over a missing workspace shim", async () => {
    const result = await resolvePnpmBinary("/Users/liweisong/工作区/Vison-Blog", async (candidate) =>
      candidate === "/opt/homebrew/bin/pnpm"
    );

    expect(result).toBe("/opt/homebrew/bin/pnpm");
  });
});
