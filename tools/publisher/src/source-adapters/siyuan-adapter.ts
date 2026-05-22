import type {ContentSourceAdapter, SourceDocument} from "./types.js";

type SiYuanClientLike = {
  queryDocuments(notebookId: string): Promise<
    Array<{ id: string; content: string; hpath: string; path?: string; updated: string }>
  >;
  getBlockAttrs(id: string): Promise<Record<string, string>>;
  exportMarkdown(id: string): Promise<{ content: string }>;
};

export function createSiYuanSourceAdapter({
  notebookId,
  client
}: {
  notebookId: string;
  client: SiYuanClientLike;
}): ContentSourceAdapter {
  return {
    async listDocuments() {
      const docs = await client.queryDocuments(notebookId);
      return docs.map(
        (doc): SourceDocument => ({
          id: doc.id,
          title: doc.content,
          hpath: doc.hpath,
          path: doc.path,
          updatedAt: doc.updated
        })
      );
    },
    readDocumentMeta(id) {
      return client.getBlockAttrs(id);
    },
    readDocumentContent(id) {
      return client.exportMarkdown(id);
    }
  };
}
