import { dirname } from "node:path";

type RuntimePaths = {
  envPath: string;
  configPath: string;
};

type ErrnoLike = Error & {
  code?: string;
  path?: string;
};

export function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

export function formatCliError(error: unknown, runtime: RuntimePaths) {
  if (error instanceof SyntaxError) {
    return [
      `发布器配置文件格式错误：${runtime.configPath}`,
      "请检查 JSON 的逗号、引号和括号是否完整。"
    ].join("\n");
  }

  if (error instanceof Error) {
    const errnoError = error as ErrnoLike;

    if (errnoError.code === "ENOENT" && typeof errnoError.path === "string") {
      if (errnoError.path === runtime.envPath) {
        return [
          `未找到发布器环境文件：${runtime.envPath}`,
          "请先运行 `pnpm publish:init`，然后补齐 `tools/publisher/.env` 里的真实配置。"
        ].join("\n");
      }

      if (errnoError.path === runtime.configPath) {
        return [
          `未找到发布器配置文件：${runtime.configPath}`,
          "请先运行 `pnpm publish:init`，然后补齐 `tools/publisher/publisher.config.json`。"
        ].join("\n");
      }

      if (errnoError.path.endsWith("/data")) {
        return [
          `未找到思源工作区目录：${dirname(errnoError.path)}`,
          `请检查 ${runtime.configPath} 里的 \`siyuanWorkspaceDir\` 是否为你本机的思源工作区路径。`
        ].join("\n");
      }

      return `找不到需要的文件或目录：${errnoError.path}`;
    }

    if (error.message.startsWith("SiYuan API error at ")) {
      const detail = error.message.replace(/^SiYuan API error at [^:]+:\s*/, "");
      return [
        `思源接口调用失败：${detail}`,
        "请确认思源已经启动，并检查 `tools/publisher/.env` 里的 `SIYUAN_BASE_URL` 和 `SIYUAN_TOKEN`。"
      ].join("\n");
    }

    return error.message;
  }

  return String(error);
}
