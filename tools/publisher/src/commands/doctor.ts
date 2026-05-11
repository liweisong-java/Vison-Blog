import { access } from "node:fs/promises";
import { join } from "node:path";

export async function doctorCommand({
  config,
  client
}: {
  config: {
    siyuanWorkspaceDir: string;
    contentRoot: string;
    notebookId: string;
    wechatExportDir?: string;
    deployHookUrl?: string;
  };
  client: { queryDocuments: (notebookId: string) => Promise<unknown[]> };
}) {
  await access(join(config.siyuanWorkspaceDir, "data"));
  await access(config.contentRoot);
  if (config.wechatExportDir) {
    await access(config.wechatExportDir).catch(() => undefined);
  }
  const docs = await client.queryDocuments(config.notebookId);

  return {
    ok: true,
    notebookDocumentCount: docs.length,
    contentRoot: config.contentRoot,
    wechatExportDir: config.wechatExportDir ?? null,
    deployHookConfigured: Boolean(config.deployHookUrl)
  };
}
