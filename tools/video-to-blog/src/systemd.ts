import { join } from "node:path";

export function getVideoToBlogServiceName() {
  return "vision-video-to-blog";
}

export function getVideoToBlogUnitPaths() {
  const serviceName = getVideoToBlogServiceName();
  return {
    servicePath: join("/etc/systemd/system", `${serviceName}.service`),
    timerPath: join("/etc/systemd/system", `${serviceName}.timer`)
  };
}

function escapeUnitValue(value: string) {
  return value.replace(/\n/g, " ").trim();
}

export function buildVideoToBlogSystemdService({
  workspaceRoot,
  user,
  group,
  environmentFile,
  command
}: {
  workspaceRoot: string;
  user: string;
  group?: string;
  environmentFile: string;
  command: string;
}) {
  const lines = [
    "[Unit]",
    "Description=Vision Blog video-to-blog queue worker",
    "After=network-online.target",
    "Wants=network-online.target",
    "",
    "[Service]",
    "Type=oneshot",
    `User=${escapeUnitValue(user)}`,
    group ? `Group=${escapeUnitValue(group)}` : "",
    `WorkingDirectory=${escapeUnitValue(workspaceRoot)}`,
    `EnvironmentFile=${escapeUnitValue(environmentFile)}`,
    `ExecStart=${escapeUnitValue(command)}`,
    ""
  ].filter(Boolean);

  return `${lines.join("\n")}\n`;
}

export function buildVideoToBlogSystemdTimer({
  onCalendar = "*:0/5",
  persistent = true
}: {
  onCalendar?: string;
  persistent?: boolean;
}) {
  const lines = [
    "[Unit]",
    "Description=Run Vision Blog video-to-blog queue worker every few minutes",
    "",
    "[Timer]",
    `OnCalendar=${onCalendar}`,
    persistent ? "Persistent=true" : "",
    `Unit=${getVideoToBlogServiceName()}.service`,
    "",
    "[Install]",
    "WantedBy=timers.target",
    ""
  ].filter(Boolean);

  return `${lines.join("\n")}\n`;
}
