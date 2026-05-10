import type { PublishedNote, PublisherConfig } from "../types.js";
import { buildPostBundle } from "../markdown.js";
import { copyAssetFiles } from "../fs.js";

function toPublishedNote(doc: { id: string; content: string }, attrs: Record<string, string>, config: PublisherConfig): PublishedNote | null {
  if (attrs[config.attrs.publish] !== "true") {
    return null;
  }

  return {
    id: doc.id,
    title: doc.content,
    slug: attrs[config.attrs.slug],
    category: attrs[config.attrs.category] === "life" ? "life" : "tech",
    excerpt: attrs[config.attrs.excerpt],
    featured: attrs[config.attrs.featured] === "true",
    publishedAt: attrs[config.attrs.publishedAt],
    tags: (attrs[config.attrs.tags] ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  };
}

export async function syncPublishedNotes({
  dryRun,
  config,
  client,
  collectManagedPosts,
  writeBundle,
  removeManagedPost,
  runBlogChecks,
  commitAndPush
}: {
  dryRun: boolean;
  config: PublisherConfig;
  client: {
    queryDocuments: (notebookId: string) => Promise<any[]>;
    getBlockAttrs: (id: string) => Promise<Record<string, string>>;
    exportMarkdown: (id: string) => Promise<{ content: string }>;
  };
  collectManagedPosts: (contentRoot: string) => Promise<{ slug: string; sourceId: string }[]>;
  writeBundle: (contentRoot: string, bundle: { filePath: string; body: string }) => Promise<void>;
  removeManagedPost: (contentRoot: string, slug: string) => Promise<void>;
  runBlogChecks: () => Promise<void>;
  commitAndPush: () => Promise<unknown>;
}) {
  const docs = await client.queryDocuments(config.notebookId);
  const publishedNotes: PublishedNote[] = [];

  for (const doc of docs) {
    const attrs = await client.getBlockAttrs(doc.id);
    const note = toPublishedNote(doc, attrs, config);
    if (note) {
      publishedNotes.push(note);
    }
  }

  const bundles = [];
  for (const note of publishedNotes) {
    const markdown = await client.exportMarkdown(note.id);
    bundles.push(await buildPostBundle({ note, markdown: markdown.content }));
  }

  const existingPosts = await collectManagedPosts(config.contentRoot);
  const liveIds = new Set(publishedNotes.map((note) => note.id));
  const removed = existingPosts.filter((post) => !liveIds.has(post.sourceId)).map((post) => post.slug);

  if (!dryRun) {
    for (const bundle of bundles) {
      await writeBundle(config.contentRoot, bundle);
      await copyAssetFiles(config.siyuanWorkspaceDir, config.contentRoot, bundle.slug, bundle.assets);
    }

    for (const slug of removed) {
      await removeManagedPost(config.contentRoot, slug);
    }

    await runBlogChecks();
    await commitAndPush();
  }

  return {
    written: bundles.map((bundle) => bundle.slug),
    removed
  };
}
