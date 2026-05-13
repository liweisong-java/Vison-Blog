import { join } from "node:path";

export function getSystemdServiceName() {
  return "vision-blog-publisher";
}

export function getSystemdUnitPaths() {
  const serviceName = getSystemdServiceName();
  return {
    servicePath: join("/etc/systemd/system", `${serviceName}.service`),
    timerPath: join("/etc/systemd/system", `${serviceName}.timer`)
  };
}

function escapeUnitValue(value: string) {
  return value.replace(/\n/g, " ").trim();
}

export function buildSystemdService({
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
    "Description=Vision Blog server-led publish cycle",
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

export function buildSystemdTimer({
  onCalendar = "*:0/1",
  persistent = true
}: {
  onCalendar?: string;
  persistent?: boolean;
}) {
  const lines = [
    "[Unit]",
    "Description=Run Vision Blog server-led publish cycle every few minutes",
    "",
    "[Timer]",
    `OnCalendar=${onCalendar}`,
    persistent ? "Persistent=true" : "",
    `Unit=${getSystemdServiceName()}.service`,
    "",
    "[Install]",
    "WantedBy=timers.target",
    ""
  ].filter(Boolean);

  return `${lines.join("\n")}\n`;
}
