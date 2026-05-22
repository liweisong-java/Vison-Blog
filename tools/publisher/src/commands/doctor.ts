import { access } from "node:fs/promises";
import { join } from "node:path";
import type {PublisherConfig} from "../types.js";

function resolveSiyuanSourceConfig(config: PublisherConfig) {
  const source = (config as PublisherConfig & {
    notebookId?: string;
    siyuanWorkspaceDir?: string;
  }).source;

  if (source?.type === "siyuan") {
    return source;
  }

  const legacyNotebookId = (config as PublisherConfig & { notebookId?: string }).notebookId;
  const legacyWorkspaceDir = (config as PublisherConfig & { siyuanWorkspaceDir?: string }).siyuanWorkspaceDir;

  if (legacyNotebookId && legacyWorkspaceDir) {
    return {
      notebookId: legacyNotebookId,
      workspaceDir: legacyWorkspaceDir
    };
  }

  return null;
}

function resolveVaultPostsRoot(config: PublisherConfig) {
  const preferredTarget = config.contentTargets.find((target) => target.format === "quartz-markdown");
  if (preferredTarget) {
    return preferredTarget.rootDir;
  }

  const fallbackTarget = config.contentTargets[0];
  if (fallbackTarget) {
    return fallbackTarget.rootDir;
  }

  throw new Error("Missing content target in publisher config.");
}

export async function doctorCommand({
  config,
  client
}: {
  config: PublisherConfig;
  client: { queryDocuments: (notebookId: string) => Promise<unknown[]> };
}) {
  const source = resolveSiyuanSourceConfig(config);
  if (!source) {
    throw new Error("当前 doctor 仅支持思源数据源。");
  }

  const postsRoot = resolveVaultPostsRoot(config);

  await access(join(source.workspaceDir, "data"));
  await access(postsRoot);
  if (config.wechatExportDir) {
    await access(config.wechatExportDir).catch(() => undefined);
  }
  const docs = await client.queryDocuments(source.notebookId);

  return {
    ok: true,
    notebookDocumentCount: docs.length,
    contentRoot: postsRoot,
    contentTargets: config.contentTargets,
    wechatExportDir: config.wechatExportDir ?? null,
    deployHookConfigured: Boolean(config.deployHookUrl)
  };
}
