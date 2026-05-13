import type { PublishedNote, PublisherConfig, SiYuanDocument } from "../types.js";
import { buildPostBundle, buildWechatArticle } from "../markdown.js";
import { copyAssetFiles } from "../fs.js";
import { normalizeSiyuanStructures } from "../markdown-normalizers.js";
import {
  createInitialPublisherState,
  recordPublisherFailure,
  recordPublisherSuccess
} from "../publisher-state.js";

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
const draftPattern = /(?:^|\/)(?:draft|drafts|草稿|未发布|未完成)(?:\/|$)|^(?:草稿|draft)[:：-]/iu;
const techKeywordPattern =
  /(ai|人工智能|技术|开发|代码|编程|java|javascript|typescript|node|astro|vercel|prompt|workflow|工作流|接口|数据库|前端|后端|算法|部署|调试|性能|系统|工程)/iu;

function readAttrVariants(attrs: Record<string, string>, key: string) {
  const values = [
    attrs[key],
    attrs[`custom-${key}`]
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return values[0];
}

function normalizeBooleanAttr(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

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
  const normalized = normalizeSiyuanStructures(markdown)
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/<details[^>]*>/g, " ")
    .replace(/<\/details>/g, " ")
    .replace(/<summary>(.*?)<\/summary>/g, " $1 ")
    .replace(/<\/?(Callout|QuoteBlock|EmbedCard|Columns)\b[^>]*>/g, " ")
    .replace(/<\/?div\b[^>]*>/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/[#>*_\-\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.slice(0, 140).trim();
}

function countExcerptUnits(value: string) {
  return (value.match(/[\p{Script=Han}]|[A-Za-z0-9]+/gu) ?? []).length;
}

function hasUsableExcerpt(value: string) {
  return countExcerptUnits(value) >= 4;
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

function shouldSkipByDraftConvention(doc: SiYuanDocument) {
  return draftPattern.test(doc.hpath) || draftPattern.test(doc.content);
}

function inferCategory({
  doc,
  markdown
}: {
  doc: SiYuanDocument;
  markdown: string;
}) {
  const signal = `${doc.hpath}\n${doc.content}\n${markdown}`;
  return techKeywordPattern.test(signal) ? "tech" : "life";
}

function deriveSlug({
  doc,
  attrs,
  existingEntries
}: {
  doc: SiYuanDocument;
  attrs: Record<string, string>;
  existingEntries: ManagedEntry[];
}) {
  const explicitSlug = readAttrVariants(attrs, "blog-slug");

  if (explicitSlug && slugPattern.test(explicitSlug)) {
    return explicitSlug;
  }

  const managedSlug = existingEntries.find((entry) => entry.sourceId === doc.id)?.slug;
  if (managedSlug && slugPattern.test(managedSlug)) {
    return managedSlug;
  }

  const generatedSlug = slugify(doc.content);
  if (generatedSlug && slugPattern.test(generatedSlug)) {
    return generatedSlug;
  }

  const idTail = doc.id
    .slice(-7)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `post-${idTail || "note"}`;
}

function normalizePublishedNote(
  doc: SiYuanDocument,
  attrs: Record<string, string>,
  markdown: string,
  config: PublisherConfig,
  existingEntries: ManagedEntry[]
): { note: PublishedNote | null; invalid?: InvalidNote } {
  const publishFlag = normalizeBooleanAttr(readAttrVariants(attrs, config.attrs.publish));
  if (publishFlag === false) {
    return { note: null };
  }

  if (publishFlag !== true && shouldSkipByDraftConvention(doc)) {
    return { note: null };
  }

  const reasons: string[] = [];
  const categoryAttr = readAttrVariants(attrs, config.attrs.category);
  let category: "tech" | "life";
  if (!categoryAttr) {
    category = inferCategory({ doc, markdown });
  } else if (categoryAttr === "tech" || categoryAttr === "life") {
    category = categoryAttr;
  } else {
    reasons.push("category must be tech or life");
    category = "life";
  }

  const slug = deriveSlug({ doc, attrs, existingEntries });
  if (!slug) {
    reasons.push("slug is missing and could not be generated from the title");
  } else if (!slugPattern.test(slug)) {
    reasons.push(`slug "${slug}" contains unsupported characters`);
  }

  const configuredExcerpt = readAttrVariants(attrs, config.attrs.excerpt);
  const generatedExcerpt = excerptFromMarkdown(markdown);
  const excerpt =
    configuredExcerpt && hasUsableExcerpt(configuredExcerpt)
      ? configuredExcerpt
      : generatedExcerpt;
  if (!excerpt || !hasUsableExcerpt(excerpt)) {
    reasons.push("excerpt must include enough readable content");
  }

  const publishedAt = readAttrVariants(attrs, config.attrs.publishedAt) || publishedDateFromUpdated(doc.updated);
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

  const featuredAttr = normalizeBooleanAttr(readAttrVariants(attrs, config.attrs.featured));
  const wechatReadyAttr = config.attrs.wechatReady
    ? normalizeBooleanAttr(readAttrVariants(attrs, config.attrs.wechatReady))
    : undefined;

  return {
    note: {
      id: doc.id,
      title: doc.content,
      slug,
      category,
      excerpt,
      featured: featuredAttr ?? false,
      publishedAt,
      tags: uniqueTags(readAttrVariants(attrs, config.attrs.tags) ?? ""),
      cover: config.attrs.cover ? readAttrVariants(attrs, config.attrs.cover) || undefined : undefined,
      canonicalUrl: config.attrs.canonicalUrl
        ? readAttrVariants(attrs, config.attrs.canonicalUrl) || undefined
        : undefined,
      wechatReady: wechatReadyAttr ?? true
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
  removeWechatArticle,
  publisherState
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
  publisherState?: {
    readState: () => Promise<import("../types.js").PublisherState | null>;
    writeState: (state: import("../types.js").PublisherState) => Promise<void>;
    now?: () => string;
  };
}) {
  const docs = await client.queryDocuments(config.notebookId);
  const stateStore = publisherState;
  const now = stateStore?.now ?? (() => new Date().toISOString());

  try {
    const existingEntries = await collectContentEntries(config.contentRoot);
    const publishedNotes: PublishedNote[] = [];
    const invalidNotes: InvalidNote[] = [];

    for (const doc of docs) {
      const attrs = await client.getBlockAttrs(doc.id);
      const publishFlag = normalizeBooleanAttr(readAttrVariants(attrs, config.attrs.publish));
      const needsMarkdown = publishFlag !== false && !shouldSkipByDraftConvention(doc);
      const markdown = needsMarkdown ? (await client.exportMarkdown(doc.id)).content : "";
      const result = normalizePublishedNote(doc, attrs, markdown, config, existingEntries);

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

    const result = {
      written: bundles.map((bundle) => bundle.slug),
      removed,
      wechatExported,
      wechatRemoved: config.wechatExportDir ? wechatRemoved : wechatRemovedSlugs,
      invalid: invalidNotes,
      committed,
      deployed
    };

    if (stateStore) {
      const currentState = (await stateStore.readState()) ?? createInitialPublisherState();
      await stateStore.writeState(
        recordPublisherSuccess(currentState, {
          finishedAt: now(),
          pendingCount: 0,
          result: {
            written: result.written.length,
            removed: result.removed.length,
            committed: result.committed,
            deployed: result.deployed,
            invalidCount: result.invalid.length
          }
        })
      );
    }

    return result;
  } catch (error) {
    if (stateStore) {
      const currentState = (await stateStore.readState()) ?? createInitialPublisherState();
      const reason = error instanceof Error ? error.message : String(error);
      await stateStore.writeState(
        recordPublisherFailure(currentState, {
          failedAt: now(),
          reason,
          pendingCount: docs.length
        })
      );
    }

    throw error;
  }
}
