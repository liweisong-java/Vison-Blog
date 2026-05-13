import type {SiYuanDocument, SiYuanSyncInfo} from "./types.js";

type CreateSiYuanClientArgs = {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
};

type ApiEnvelope<T> = {
  code: number;
  msg: string;
  data: T;
};

export function createSiYuanClient({
  baseUrl,
  token,
  fetchImpl = fetch
}: CreateSiYuanClientArgs) {
  async function request<T>(path: string, body: unknown): Promise<T> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {})
      },
      body: JSON.stringify(body)
    });

    const payload = (await response.json()) as ApiEnvelope<T>;
    if (payload.code !== 0) {
      throw new Error(`SiYuan API error at ${path}: ${payload.msg}`);
    }

    return payload.data;
  }

  return {
    queryDocuments(notebookId: string) {
      return request<SiYuanDocument[]>("/api/query/sql", {
        stmt: `SELECT id, content, hpath, updated FROM blocks WHERE box = '${notebookId}' AND type = 'd' ORDER BY updated DESC`
      });
    },
    getBlockAttrs(id: string) {
      return request<Record<string, string>>("/api/attr/getBlockAttrs", { id });
    },
    exportMarkdown(id: string) {
      return request<{ content: string }>("/api/export/exportMdContent", { id });
    },
      performSync() {
          return request<null>("/api/sync/performSync", {});
      },
      getSyncInfo() {
          return request<SiYuanSyncInfo>("/api/sync/getSyncInfo", {});
    }
  };
}
