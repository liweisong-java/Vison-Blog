import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {z} from "zod";
import type {LegacyPublisherConfig, PublisherConfig} from "./types.js";

const attrsSchema = z.object({
  publish: z.string().min(1),
  category: z.string().min(1).optional(),
  excerpt: z.string().min(1),
  featured: z.string().min(1),
  slug: z.string().min(1),
  tags: z.string().min(1),
  publishedAt: z.string().min(1),
  cover: z.string().min(1).optional(),
  canonicalUrl: z.string().min(1).optional(),
  wechatReady: z.string().min(1).optional()
});

const legacyConfigSchema = z.object({
  notebookId: z.string().min(1),
  siyuanWorkspaceDir: z.string().min(1),
  contentRoot: z.string().min(1),
  wechatExportDir: z.string().min(1).optional(),
  deployHookUrl: z.url().optional(),
  localDeployRoot: z.string().min(1).optional(),
  publisherStatePath: z.string().min(1).optional(),
  attrs: attrsSchema
});

const sourceConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("siyuan"),
    notebookId: z.string().min(1),
    workspaceDir: z.string().min(1)
  }),
  z.object({
    type: z.literal("obsidian"),
    vaultDir: z.string().min(1),
    notesDir: z.string().min(1).optional(),
    assetsDir: z.string().min(1).optional()
  })
]);

const nextConfigSchema = z.object({
  source: sourceConfigSchema,
  vault: z.object({
    rootDir: z.string().min(1),
    postsDir: z.string().min(1),
    assetsDir: z.string().min(1)
  }),
  astroContentDir: z.string().min(1).optional(),
  wechatExportDir: z.string().min(1).optional(),
  deployHookUrl: z.url().optional(),
  localDeployRoot: z.string().min(1).optional(),
  publisherStatePath: z.string().min(1).optional(),
  attrs: attrsSchema
});

function resolveLegacyConfig(parsed: LegacyPublisherConfig, repoRoot: string): PublisherConfig {
  const normalizedContentRoot = resolve(repoRoot, parsed.contentRoot);

  return {
    source: {
      type: "siyuan",
      notebookId: parsed.notebookId,
      workspaceDir: resolve(repoRoot, parsed.siyuanWorkspaceDir)
    },
    vault: {
      rootDir: normalizedContentRoot,
      postsDir: ".",
      assetsDir: "."
    },
    contentTargets: [
      {
        name: "astro",
        format: "astro-mdx",
        rootDir: normalizedContentRoot
      }
    ],
    wechatExportDir: parsed.wechatExportDir
      ? resolve(repoRoot, parsed.wechatExportDir)
      : undefined,
    deployHookUrl: parsed.deployHookUrl,
    localDeployRoot: parsed.localDeployRoot
      ? resolve(repoRoot, parsed.localDeployRoot)
      : undefined,
    publisherStatePath: parsed.publisherStatePath
      ? resolve(repoRoot, parsed.publisherStatePath)
      : undefined,
    attrs: parsed.attrs
  };
}

export async function loadPublisherConfig(fileUrl: URL, repoRoot: string): Promise<PublisherConfig> {
  const raw = await readFile(fileUrl, "utf8");
  const parsedJson = JSON.parse(raw);

  const nextResult = nextConfigSchema.safeParse(parsedJson);
  if (nextResult.success) {
    const parsed = nextResult.data;
    const normalizedVaultRoot = resolve(repoRoot, parsed.vault.rootDir);
    const normalizedVaultPostsRoot =
      parsed.vault.postsDir === "."
        ? normalizedVaultRoot
        : resolve(normalizedVaultRoot, parsed.vault.postsDir);
    const normalizedAstroContentDir = parsed.astroContentDir
      ? resolve(repoRoot, parsed.astroContentDir)
      : undefined;

    return {
      source:
        parsed.source.type === "siyuan"
          ? {
              ...parsed.source,
              workspaceDir: resolve(repoRoot, parsed.source.workspaceDir)
            }
          : {
              ...parsed.source,
              vaultDir: resolve(repoRoot, parsed.source.vaultDir)
            },
      vault: {
        rootDir: normalizedVaultRoot,
        postsDir: parsed.vault.postsDir,
        assetsDir: parsed.vault.assetsDir
      },
      astroContentDir: normalizedAstroContentDir,
      contentTargets: [
        {
          name: "vault",
          format: "quartz-markdown",
          rootDir: normalizedVaultPostsRoot
        },
        ...(normalizedAstroContentDir
          ? [
              {
                name: "astro",
                format: "astro-mdx" as const,
                rootDir: normalizedAstroContentDir
              }
            ]
          : [])
      ],
      wechatExportDir: parsed.wechatExportDir
        ? resolve(repoRoot, parsed.wechatExportDir)
        : undefined,
      deployHookUrl: parsed.deployHookUrl,
      localDeployRoot: parsed.localDeployRoot
        ? resolve(repoRoot, parsed.localDeployRoot)
        : undefined,
      publisherStatePath: parsed.publisherStatePath
        ? resolve(repoRoot, parsed.publisherStatePath)
        : undefined,
      attrs: parsed.attrs
    };
  }

  const legacyParsed = legacyConfigSchema.parse(parsedJson);

  return resolveLegacyConfig(legacyParsed, repoRoot);
}
