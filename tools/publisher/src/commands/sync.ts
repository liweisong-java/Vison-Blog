import type { PublishedNote, PublisherConfig, SiYuanDocument } from "../types.js";
import { buildPostBundle, buildWechatArticle } from "../markdown.js";
import { copyAssetFiles } from "../fs.js";

type ManagedEntry = {
  slug: string;
  sourceId?: string;
  directory: string;
};

type InvalidNote = {
  id: string;
  title: string;
  reasons: string[];
};

const transliterationMap: Record<string, string> = {
  周: "zhou-",
  末: "mo",
  散: "san-",
  步: "bu"
};
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(input: string) {
  const normalizedInput = [...input]
    .map((char) => transliterationMap[char] ?? char)
    .join("");
  const slug = normalizedInput
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug;
}

function excerptFromMarkdown(markdown: string) {
  const normalized = markdown
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/[#>*_\-\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.slice(0, 140).trim();
}

function publishedDateFromUpdated(updated: string) {
  const year = updated.slice(0, 4);
  const month = updated.slice(4, 6);
  const day = updated.slice(6, 8);
  return `${year}-${month}-${day}`;
}

function uniqueTags(rawTags: string) {
  return [...new Set(rawTags.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

function normalizePublishedNote(
  doc: SiYuanDocument,
  attrs: Record<string, string>,
  markdown: string,
  config: PublisherConfig
): { note: PublishedNote | null; invalid?: InvalidNote } {
  if (attrs[config.attrs.publish] !== "true") {
    return { note: null };
  }

  const reasons: string[] = [];
  const category = attrs[config.attrs.category];
  if (category !== "tech" && category !== "life") {
    reasons.push("category must be tech or life");
  }

  const generatedSlug = slugify(doc.content);
  const slug = attrs[config.attrs.slug]?.trim() || generatedSlug || `note-${doc.id.slice(0, 8)}`;
  if (!slug) {
    reasons.push("slug is missing and could not be generated from the title");
  } else if (!slugPattern.test(slug)) {
    reasons.push(`slug "${slug}" contains unsupported characters`);
  }

  const excerpt = attrs[config.attrs.excerpt]?.trim() || excerptFromMarkdown(markdown);
  if (!excerpt || excerpt.length < 24) {
    reasons.push("excerpt must be at least 24 characters");
  }

  const publishedAt = attrs[config.attrs.publishedAt]?.trim() || publishedDateFromUpdated(doc.updated);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    reasons.push("publishedAt must use YYYY-MM-DD");
  }

  if (reasons.length) {
    return {
      note: null,
      invalid: {
        id: doc.id,
        title: doc.content,
        reasons
      }
    };
  }

  const wechatReadyAttr = config.attrs.wechatReady ? attrs[config.attrs.wechatReady]?.trim() : undefined;

  return {
    note: {
      id: doc.id,
      title: doc.content,
      slug,
      category: category as "tech" | "life",
      excerpt,
      featured: attrs[config.attrs.featured] === "true",
      publishedAt,
      tags: uniqueTags(attrs[config.attrs.tags] ?? ""),
      cover: config.attrs.cover ? attrs[config.attrs.cover]?.trim() || undefined : undefined,
      canonicalUrl: config.attrs.canonicalUrl
        ? attrs[config.attrs.canonicalUrl]?.trim() || undefined
        : undefined,
      wechatReady: wechatReadyAttr ? wechatReadyAttr === "true" : true
    }
  };
}

function formatInvalidNotes(invalidNotes: InvalidNote[]) {
  return invalidNotes
    .map((note) => `${note.title} (${note.id}): ${note.reasons.join("; ")}`)
    .join("\n");
}

function getRemovedSlugs({
  existingEntries,
  publishedNotes
}: {
  existingEntries: ManagedEntry[];
  publishedNotes: PublishedNote[];
}) {
  const liveBySourceId = new Map(publishedNotes.map((note) => [note.id, note.slug]));
  const liveIds = new Set(publishedNotes.map((note) => note.id));

  return existingEntries
    .filter((entry) => {
      if (!entry.sourceId) {
        return false;
      }

      if (!liveIds.has(entry.sourceId)) {
        return true;
      }

      return liveBySourceId.get(entry.sourceId) !== entry.slug;
    })
    .map((entry) => entry.slug);
}

function ensureUniqueSlugs({
  existingEntries,
  publishedNotes
}: {
  existingEntries: ManagedEntry[];
  publishedNotes: PublishedNote[];
}) {
  const existingEntryBySlug = new Map(existingEntries.map((entry) => [entry.slug, entry]));
  const seen = new Set<string>();

  for (const note of publishedNotes) {
    if (seen.has(note.slug)) {
      throw new Error(`Duplicate published slug detected: ${note.slug}`);
    }
    seen.add(note.slug);

    const existingEntry = existingEntryBySlug.get(note.slug);
    if (existingEntry && existingEntry.sourceId !== note.id) {
      throw new Error(`Slug collision detected for "${note.slug}". Update the note slug before publishing.`);
    }
  }
}

function getWechatRemovedSlugs({
  removed,
  publishedNotes
}: {
  removed: string[];
  publishedNotes: PublishedNote[];
}) {
  return [...new Set([...removed, ...publishedNotes.filter((note) => note.wechatReady === false).map((note) => note.slug)])];
}

export async function syncPublishedNotes({
  dryRun,
  config,
  client,
  collectContentEntries,
  writeBundle,
  removeManagedPost,
  runBlogChecks,
  commitAndPush,
  triggerDeploy,
  writeWechatArticle,
  removeWechatArticle
}: {
  dryRun: boolean;
  config: PublisherConfig;
  client: {
    queryDocuments: (notebookId: string) => Promise<SiYuanDocument[]>;
    getBlockAttrs: (id: string) => Promise<Record<string, string>>;
    exportMarkdown: (id: string) => Promise<{ content: string }>;
  };
  collectContentEntries: (contentRoot: string) => Promise<ManagedEntry[]>;
  writeBundle: (contentRoot: string, bundle: { filePath: string; body: string }) => Promise<void>;
  removeManagedPost: (contentRoot: string, slug: string) => Promise<void>;
  writeWechatArticle: (
    exportRoot: string,
    article: { filePath: string; body: string; slug: string; title: string }
  ) => Promise<void>;
  removeWechatArticle: (exportRoot: string, slug: string) => Promise<void>;
  runBlogChecks: () => Promise<void>;
  commitAndPush: () => Promise<{ committed: boolean; stagedFiles?: string[] }>;
  triggerDeploy: (summary: {
    written: string[];
    removed: string[];
    invalid: InvalidNote[];
    committed: boolean;
  }) => Promise<unknown>;
}) {
  const docs = await client.queryDocuments(config.notebookId);
  const publishedNotes: PublishedNote[] = [];
  const invalidNotes: InvalidNote[] = [];

  for (const doc of docs) {
    const attrs = await client.getBlockAttrs(doc.id);
    const shouldPublish = attrs[config.attrs.publish] === "true";
    const markdown = shouldPublish ? (await client.exportMarkdown(doc.id)).content : "";
    const result = normalizePublishedNote(doc, attrs, markdown, config);

    if (result.invalid) {
      invalidNotes.push(result.invalid);
      continue;
    }

    if (result.note) {
      publishedNotes.push(result.note);
    }
  }

  if (invalidNotes.length) {
    throw new Error(`Unable to publish some notes:\n${formatInvalidNotes(invalidNotes)}`);
  }

  const existingEntries = await collectContentEntries(config.contentRoot);
  ensureUniqueSlugs({ existingEntries, publishedNotes });

  const bundles = [];
  const wechatArticles = [];
  for (const note of publishedNotes) {
    const markdown = await client.exportMarkdown(note.id);
    bundles.push(await buildPostBundle({ note, markdown: markdown.content }));
    if (config.wechatExportDir && note.wechatReady !== false) {
      wechatArticles.push(await buildWechatArticle({ note, markdown: markdown.content }));
    }
  }

  const removed = getRemovedSlugs({ existingEntries, publishedNotes });
  const wechatRemovedSlugs = getWechatRemovedSlugs({ removed, publishedNotes });
  let committed = false;
  let deployed = false;
  const wechatExported: string[] = [];
  const wechatRemoved: string[] = [];

  if (!dryRun) {
    for (const bundle of bundles) {
      await writeBundle(config.contentRoot, bundle);
      await copyAssetFiles(config.siyuanWorkspaceDir, config.contentRoot, bundle.slug, bundle.assets);
    }

    if (config.wechatExportDir) {
      for (const article of wechatArticles) {
        await writeWechatArticle(config.wechatExportDir, article);
        wechatExported.push(article.slug);
      }

      for (const slug of wechatRemovedSlugs) {
        await removeWechatArticle(config.wechatExportDir, slug);
        wechatRemoved.push(slug);
      }
    }

    for (const slug of removed) {
      await removeManagedPost(config.contentRoot, slug);
    }

    await runBlogChecks();
    const commitResult = await commitAndPush();
    committed = commitResult.committed;

    if (committed) {
      await triggerDeploy({
        written: bundles.map((bundle) => bundle.slug),
        removed,
        invalid: invalidNotes,
        committed
      });
      deployed = true;
    }
  }

  return {
    written: bundles.map((bundle) => bundle.slug),
    removed,
    wechatExported,
    wechatRemoved: config.wechatExportDir ? wechatRemoved : wechatRemovedSlugs,
    invalid: invalidNotes,
    committed,
    deployed
  };
}
