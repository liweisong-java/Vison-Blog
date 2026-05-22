export type SourceDocument = {
  id: string;
  title: string;
  hpath: string;
  path?: string;
  updatedAt: string;
};

export interface ContentSourceAdapter {
  listDocuments(): Promise<SourceDocument[]>;
  readDocumentMeta(id: string): Promise<Record<string, string>>;
  readDocumentContent(id: string): Promise<{ content: string }>;
}
