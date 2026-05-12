import { describe, expect, it } from "vitest";
import {
  countRecentPublisherSyncs,
  createInitialPublisherState,
  recordPublisherFailure,
  recordPublisherSuccess
} from "../src/publisher-state.js";

describe("publisher state", () => {
  it("records successful sync metadata", () => {
    const state = recordPublisherSuccess(createInitialPublisherState(), {
      finishedAt: "2026-05-12T12:00:00.000Z",
      pendingCount: 0,
      result: {
        written: 2,
        removed: 1,
        committed: true,
        deployed: true,
        invalidCount: 0
      }
    });

    expect(state.status).toBe("healthy");
    expect(state.lastSuccessAt).toBe("2026-05-12T12:00:00.000Z");
    expect(state.lastResult?.written).toBe(2);
  });

  it("records failure reason and timestamp", () => {
    const state = recordPublisherFailure(createInitialPublisherState(), {
      failedAt: "2026-05-12T12:10:00.000Z",
      reason: "network timeout",
      pendingCount: 1
    });

    expect(state.status).toBe("failed");
    expect(state.lastFailureReason).toContain("network timeout");
    expect(state.pendingCount).toBe(1);
  });

  it("counts recent sync history for dashboard aggregation", () => {
    const state = recordPublisherSuccess(
      recordPublisherSuccess(createInitialPublisherState(), {
        finishedAt: "2026-05-10T08:00:00.000Z",
        pendingCount: 0,
        result: {
          written: 1,
          removed: 0,
          committed: false,
          deployed: false,
          invalidCount: 0
        }
      }),
      {
        finishedAt: "2026-05-12T08:00:00.000Z",
        pendingCount: 0,
        result: {
          written: 2,
          removed: 0,
          committed: true,
          deployed: true,
          invalidCount: 0
        }
      }
    );

    expect(countRecentPublisherSyncs(state, new Date("2026-05-12T12:00:00.000Z"))).toBe(2);
  });
});
