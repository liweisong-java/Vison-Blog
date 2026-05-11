import { describe, expect, it } from "vitest";
import { formatCliError } from "../src/cli-output";

const runtimePaths = {
  envPath: "/tmp/vision-blog/tools/publisher/.env",
  configPath: "/tmp/vision-blog/tools/publisher/publisher.config.json"
};

describe("formatCliError", () => {
  it("explains how to fix a missing Siyuan workspace directory in Chinese", () => {
    const error = Object.assign(new Error("ENOENT"), {
      code: "ENOENT",
      path: "/Users/your-name/SiYuan/data"
    });

    const message = formatCliError(error, runtimePaths);

    expect(message).toContain("未找到思源工作区目录");
    expect(message).toContain("/Users/your-name/SiYuan");
    expect(message).toContain("siyuanWorkspaceDir");
    expect(message).toContain(runtimePaths.configPath);
  });

  it("explains Siyuan API failures with the env file fields to check", () => {
    const message = formatCliError(
      new Error("SiYuan API error at /api/query/sql: auth failed"),
      runtimePaths
    );

    expect(message).toContain("思源接口调用失败");
    expect(message).toContain("auth failed");
    expect(message).toContain("SIYUAN_BASE_URL");
    expect(message).toContain("SIYUAN_TOKEN");
  });

  it("explains invalid JSON config files with the config file path", () => {
    const message = formatCliError(new SyntaxError("Unexpected token } in JSON"), runtimePaths);

    expect(message).toContain("发布器配置文件格式错误");
    expect(message).toContain(runtimePaths.configPath);
  });
});
