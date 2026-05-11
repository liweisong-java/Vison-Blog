import { dirname, join } from "node:path";

export function getLaunchdLabel() {
  return "com.liweisong.vision-blog.publisher";
}

export function getLaunchdPaths({
  homeDir,
  workspaceRoot
}: {
  homeDir: string;
  workspaceRoot: string;
}) {
  return {
    plistPath: join(homeDir, "Library", "LaunchAgents", `${getLaunchdLabel()}.plist`),
    logPath: join(homeDir, "Library", "Logs", "vision-blog-auto-publish.log"),
    statePath: join(workspaceRoot, ".superpowers", "publisher", "auto-state.json"),
    lockPath: join(workspaceRoot, ".superpowers", "publisher", "auto.lock")
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildLaunchdPlist({
  label,
  program,
  args,
  workingDirectory,
  watchPaths,
  standardLogPath,
  intervalSeconds
}: {
  label: string;
  program: string;
  args: string[];
  workingDirectory: string;
  watchPaths: string[];
  standardLogPath: string;
  intervalSeconds: number;
}) {
  const programArguments = [program, ...args]
    .map((value) => `    <string>${escapeXml(value)}</string>`)
    .join("\n");
  const watchPathsXml = watchPaths
    .map((value) => `    <string>${escapeXml(value)}</string>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${escapeXml(label)}</string>
  <key>ProgramArguments</key>
  <array>
${programArguments}
  </array>
  <key>WorkingDirectory</key>
  <string>${escapeXml(workingDirectory)}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>${intervalSeconds}</integer>
  <key>WatchPaths</key>
  <array>
${watchPathsXml}
  </array>
  <key>StandardOutPath</key>
  <string>${escapeXml(standardLogPath)}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(standardLogPath)}</string>
</dict>
</plist>
`;
}

export function getLaunchdParentDirectories(paths: {
  plistPath: string;
  logPath: string;
}) {
  return [dirname(paths.plistPath), dirname(paths.logPath)];
}
