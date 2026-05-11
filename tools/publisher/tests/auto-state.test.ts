import { describe, expect, it } from "vitest";
import { buildAutoPublishFingerprint } from "../src/auto-state.js";

describe("buildAutoPublishFingerprint", () => {
  it("stays stable for the same documents even if order changes", () => {
    const first = buildAutoPublishFingerprint({
      notebookId: "demo-notebook",
      docs: [
        { id: "b", updated: "20260511120000" },
        { id: "a", updated: "20260511110000" }
      ]
    });
    const second = buildAutoPublishFingerprint({
      notebookId: "demo-notebook",
      docs: [
        { id: "a", updated: "20260511110000" },
        { id: "b", updated: "20260511120000" }
      ]
    });

    expect(first).toBe(second);
  });

  it("changes when a document timestamp changes", () => {
    const first = buildAutoPublishFingerprint({
      notebookId: "demo-notebook",
      docs: [{ id: "a", updated: "20260511110000" }]
    });
    const second = buildAutoPublishFingerprint({
      notebookId: "demo-notebook",
      docs: [{ id: "a", updated: "20260511113000" }]
    });

    expect(first).not.toBe(second);
  });
});
