import type {SiYuanSyncInfo} from "./types.js";

type SyncClient = {
    performSync: () => Promise<void>;
    getSyncInfo: () => Promise<SiYuanSyncInfo>;
};

type EnsureLatestSiYuanSyncArgs = {
    enabled: boolean;
    client: SyncClient;
    pollIntervalMs?: number;
    timeoutMs?: number;
    sleep?: (ms: number) => Promise<void>;
};

function delay(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function ensureLatestSiYuanSync({
                                                 enabled,
                                                 client,
                                                 pollIntervalMs = 1500,
                                                 timeoutMs = 30000,
                                                 sleep = delay
                                             }: EnsureLatestSiYuanSyncArgs) {
    if (!enabled) {
        return {
            enabled: false as const,
            syncedAt: null
        };
    }

    const before = await client.getSyncInfo();
    await client.performSync();

    const startedAt = Date.now();

    while (Date.now() - startedAt <= timeoutMs) {
        const current = await client.getSyncInfo();
        if (current.synced > before.synced) {
            return {
                enabled: true as const,
                syncedAt: current.synced
            };
        }

        if (Date.now() - startedAt > timeoutMs) {
            break;
        }

        await sleep(pollIntervalMs);
    }

    throw new Error(`思源同步未在 ${timeoutMs}ms 内完成，请先确认服务器思源可以正常拉取云端最新内容。`);
}
