import { describe, expect, it } from "vitest";
import { buildTranscriptFromManualText } from "../src/manual-transcript";

describe("manual transcript helper", () => {
  it("turns plain text paragraphs into a transcript structure", () => {
    const transcript = buildTranscriptFromManualText("第一段内容。\n\n第二段内容。");

    expect(transcript.source).toBe("subtitle");
    expect(transcript.language).toBe("zh");
    expect(transcript.segments).toHaveLength(2);
    expect(transcript.segments[0]?.text).toBe("第一段内容。");
    expect(transcript.segments[1]?.start).toBe(10);
  });
});
