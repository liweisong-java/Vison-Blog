import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type RunCommand = (
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  }
) => Promise<{ stdout: string; stderr: string }>;

export const runCommand: RunCommand = async (command, args, options = {}) => {
  const result = await execFileAsync(command, args, {
    cwd: options.cwd,
    env: options.env,
    maxBuffer: 20 * 1024 * 1024
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
};
