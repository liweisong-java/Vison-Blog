import { describe, expect, it } from "vitest";
import {
  buildVideoToBlogSystemdService,
  buildVideoToBlogSystemdTimer,
  getVideoToBlogServiceName,
  getVideoToBlogUnitPaths
} from "../src/systemd";

describe("video-to-blog systemd helpers", () => {
  it("builds stable systemd unit paths", () => {
    const paths = getVideoToBlogUnitPaths();
    expect(paths.servicePath).toBe("/etc/systemd/system/vision-video-to-blog.service");
    expect(paths.timerPath).toBe("/etc/systemd/system/vision-video-to-blog.timer");
  });

  it("renders a service unit for the video queue worker", () => {
    const service = buildVideoToBlogSystemdService({
      workspaceRoot: "/data/Vison-Blog/repo",
      user: "deploy",
      group: "deploy",
      environmentFile: "/data/Vison-Blog/repo/tools/video-to-blog/.env",
      command: "bash -lc 'cd /data/Vison-Blog/repo && pnpm video:run'"
    });

    expect(service).toContain("Description=Vision Blog video-to-blog queue worker");
    expect(service).toContain("User=deploy");
    expect(service).toContain("EnvironmentFile=/data/Vison-Blog/repo/tools/video-to-blog/.env");
    expect(service).toContain("ExecStart=bash -lc 'cd /data/Vison-Blog/repo && pnpm video:run'");
  });

  it("renders a timer unit with the expected service binding", () => {
    const timer = buildVideoToBlogSystemdTimer({ onCalendar: "*:0/15" });

    expect(getVideoToBlogServiceName()).toBe("vision-video-to-blog");
    expect(timer).toContain("OnCalendar=*:0/15");
    expect(timer).toContain("Persistent=true");
    expect(timer).toContain("Unit=vision-video-to-blog.service");
  });
});
