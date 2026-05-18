import {describe, expect, it} from "vitest";
import {formatDisplayDate, formatReadingTime} from "../src/lib/presenters";

describe("presenters", () => {
  it("formats dates in a Chinese long-date style", () => {
    expect(formatDisplayDate(new Date("2026-05-10T00:00:00.000Z"))).toBe("2026年5月10日");
  });

  it("formats reading time in Chinese", () => {
    expect(formatReadingTime(1)).toBe("预计阅读 1 分钟");
    expect(formatReadingTime(8)).toBe("预计阅读 8 分钟");
  });
});
