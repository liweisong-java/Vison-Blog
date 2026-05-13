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
      `视频转博客配置文件格式错误：${runtime.configPath}`,
      "请检查 JSON 的逗号、引号和括号是否完整。"
    ].join("\n");
  }

  if (error instanceof Error) {
    const errnoError = error as ErrnoLike;

    if (errnoError.code === "ENOENT" && typeof errnoError.path === "string") {
      if (errnoError.path === runtime.envPath) {
        return [
          `未找到视频转博客环境文件：${runtime.envPath}`,
          "请先运行 `pnpm video:init`，然后补齐 `tools/video-to-blog/.env`。"
        ].join("\n");
      }

      if (errnoError.path === runtime.configPath) {
        return [
          `未找到视频转博客配置文件：${runtime.configPath}`,
          "请先运行 `pnpm video:init`，然后补齐 `tools/video-to-blog/video-to-blog.config.json`。"
        ].join("\n");
      }

      return `找不到需要的文件或目录：${errnoError.path}`;
    }

    return error.message;
  }

  return String(error);
}
