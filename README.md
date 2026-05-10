# Vision Blog

Lightweight personal blog rebuilt around Astro on the frontend and a local SiYuan publisher on the content side.

## Workspace

- `apps/blog`: static editorial blog
- `tools/publisher`: local SiYuan sync CLI

## Commands

- `pnpm test`
- `pnpm build`
- `pnpm e2e`

## Local Publishing Flow

1. Write or update a note in SiYuan.
2. Set the custom publish attributes expected by `tools/publisher`.
3. Run `pnpm --filter publisher dev sync --dry-run`.
4. Run `pnpm --filter publisher dev sync`.
5. Let Vercel rebuild the static site from the updated repository.
