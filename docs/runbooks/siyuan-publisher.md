# SiYuan Publisher Runbook

1. Copy `tools/publisher/publisher.config.example.json` to `tools/publisher/publisher.config.json`.
2. Copy `tools/publisher/.env.example` to `tools/publisher/.env`.
3. Fill in `SIYUAN_BASE_URL`, `SIYUAN_TOKEN`, and the notebook ID.
4. Run `pnpm --filter publisher dev doctor`.
5. Run `pnpm --filter publisher dev sync --dry-run`.
6. Run `pnpm --filter publisher dev sync` when the dry run looks correct.
