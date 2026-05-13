import {describe, expect, it, vi} from "vitest";
import {ensureLatestSiYuanSync} from "../src/siyuan-sync-gate";

describe("ensureLatestSiYuanSync", () => {
    it("skips the pre-sync gate when it is disabled", async () => {
        const performSync = vi.fn();
        const getSyncInfo = vi.fn();

        const result = await ensureLatestSiYuanSync({
            enabled: false,
            client: {
                performSync,
                getSyncInfo
            }
        });

        expect(result).toEqual({
            enabled: false,
            syncedAt: null
        });
        expect(performSync).not.toHaveBeenCalled();
        expect(getSyncInfo).not.toHaveBeenCalled();
    });

    it("triggers a Siyuan sync and waits for the synced timestamp to advance", async () => {
        const performSync = vi.fn().mockResolvedValue(undefined);
        const getSyncInfo = vi
            .fn()
            .mockResolvedValueOnce({synced: 100, stat: "before"})
            .mockResolvedValueOnce({synced: 100, stat: "running"})
            .mockResolvedValueOnce({synced: 180, stat: "done"});
        const sleep = vi.fn().mockResolvedValue(undefined);

        const result = await ensureLatestSiYuanSync({
            enabled: true,
            client: {
                performSync,
                getSyncInfo
            },
            pollIntervalMs: 10,
            timeoutMs: 30,
            sleep
        });

        expect(performSync).toHaveBeenCalledTimes(1);
        expect(getSyncInfo).toHaveBeenCalledTimes(3);
        expect(sleep).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            enabled: true,
            syncedAt: 180
        });
    });

    it("fails clearly when Siyuan never reports a newer synced timestamp", async () => {
        const performSync = vi.fn().mockResolvedValue(undefined);
        const getSyncInfo = vi.fn().mockResolvedValue({synced: 100, stat: "still running"});
        const sleep = vi.fn().mockResolvedValue(undefined);

        await expect(
            ensureLatestSiYuanSync({
                enabled: true,
                client: {
                    performSync,
                    getSyncInfo
                },
                pollIntervalMs: 10,
                timeoutMs: 30,
                sleep
            })
        ).rejects.toThrow("思源同步未在 30ms 内完成");
    });
});
