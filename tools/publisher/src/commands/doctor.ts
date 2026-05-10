import { access } from "node:fs/promises";
import { join } from "node:path";

export async function doctorCommand({
  config,
  client
}: {
  config: { siyuanWorkspaceDir: string; contentRoot: string; notebookId: string };
  client: { queryDocuments: (notebookId: string) => Promise<unknown[]> };
}) {
  await access(join(config.siyuanWorkspaceDir, "data"));
  await access(config.contentRoot);
  const docs = await client.queryDocuments(config.notebookId);

  return {
    ok: true,
    notebookDocumentCount: docs.length
  };
}
