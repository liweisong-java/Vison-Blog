import { describe, expect, it } from "vitest";
import { formatDisplayDate, formatReadingTime, getCategoryLabel } from "../src/lib/presenters";

describe("presenters", () => {
  it("formats categories for Chinese readers", () => {
    expect(getCategoryLabel("tech")).toBe("技术");
    expect(getCategoryLabel("life")).toBe("生活");
  });

  it("formats dates in a Chinese long-date style", () => {
    expect(formatDisplayDate(new Date("2026-05-10T00:00:00.000Z"))).toBe("2026年5月10日");
  });

  it("formats reading time in Chinese", () => {
    expect(formatReadingTime(1)).toBe("预计阅读 1 分钟");
    expect(formatReadingTime(8)).toBe("预计阅读 8 分钟");
  });
});
