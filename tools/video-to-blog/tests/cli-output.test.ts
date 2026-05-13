import { describe, expect, it } from "vitest";
import { formatCliError } from "../src/cli-output";

const runtimePaths = {
  envPath: "/tmp/vision-blog/tools/video-to-blog/.env",
  configPath: "/tmp/vision-blog/tools/video-to-blog/video-to-blog.config.json"
};

describe("video-to-blog cli errors", () => {
  it("explains missing local config files in Chinese", () => {
    const error = Object.assign(new Error("ENOENT"), {
      code: "ENOENT",
      path: runtimePaths.configPath
    });

    const message = formatCliError(error, runtimePaths);
    expect(message).toContain("未找到视频转博客配置文件");
    expect(message).toContain("pnpm video:init");
  });

  it("explains invalid JSON config files in Chinese", () => {
    const message = formatCliError(new SyntaxError("Unexpected token } in JSON"), runtimePaths);
    expect(message).toContain("视频转博客配置文件格式错误");
    expect(message).toContain(runtimePaths.configPath);
  });
});
