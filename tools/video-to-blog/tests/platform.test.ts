import { describe, expect, it } from "vitest";
import { detectVideoPlatform, getPlatformLabel } from "../src/platform";

describe("video platform detection", () => {
  it("detects YouTube, Bilibili, and Douyin URLs", () => {
    expect(detectVideoPlatform("https://www.youtube.com/watch?v=abc123")).toBe("youtube");
    expect(detectVideoPlatform("https://www.bilibili.com/video/BV1xx411c7mD/")).toBe("bilibili");
    expect(detectVideoPlatform("https://www.douyin.com/video/123456")).toBe("douyin");
  });

  it("returns human labels for supported platforms", () => {
    expect(getPlatformLabel("youtube")).toBe("YouTube");
    expect(getPlatformLabel("bilibili")).toBe("Bilibili");
    expect(getPlatformLabel("douyin")).toBe("抖音");
  });
});
