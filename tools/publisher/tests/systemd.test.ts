import { describe, expect, it } from "vitest";
import {
  buildSystemdService,
  buildSystemdTimer,
  getSystemdServiceName,
  getSystemdUnitPaths
} from "../src/systemd";

describe("systemd helpers", () => {
  it("builds stable systemd unit paths", () => {
    const paths = getSystemdUnitPaths();
    expect(paths.servicePath).toBe("/etc/systemd/system/vision-blog-publisher.service");
    expect(paths.timerPath).toBe("/etc/systemd/system/vision-blog-publisher.timer");
  });

  it("renders a systemd service unit for server-led publishing", () => {
    const service = buildSystemdService({
      workspaceRoot: "/data/Vison-Blog/repo",
      user: "deploy",
      group: "deploy",
      environmentFile: "/data/Vison-Blog/repo/tools/publisher/.env",
      command: "bash -lc 'cd /data/Vison-Blog/repo && pnpm publish:server-run'"
    });

    expect(service).toContain(`Description=Vision Blog server-led publish cycle`);
    expect(service).toContain("User=deploy");
    expect(service).toContain("WorkingDirectory=/data/Vison-Blog/repo");
    expect(service).toContain("EnvironmentFile=/data/Vison-Blog/repo/tools/publisher/.env");
    expect(service).toContain("ExecStart=bash -lc 'cd /data/Vison-Blog/repo && pnpm publish:server-run'");
  });

  it("renders a timer unit with the expected service binding", () => {
    const timer = buildSystemdTimer({ onCalendar: "*:0/10" });

    expect(getSystemdServiceName()).toBe("vision-blog-publisher");
    expect(timer).toContain("OnCalendar=*:0/10");
    expect(timer).toContain("Persistent=true");
    expect(timer).toContain("Unit=vision-blog-publisher.service");
  });

  it("defaults to a one-minute polling timer for lower publish latency", () => {
    const timer = buildSystemdTimer({});

    expect(timer).toContain("OnCalendar=*:0/1");
  });
});
