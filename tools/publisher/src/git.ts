import { simpleGit } from "simple-git";
import { relative } from "node:path";

export async function commitAndPush({
  repoRoot,
  branch,
  remote,
  message,
  includePaths
}: {
  repoRoot: string;
  branch: string;
  remote: string;
  message: string;
  includePaths: string[];
}) {
  const git = simpleGit(repoRoot);
  const relativePaths = includePaths.map((path) => relative(repoRoot, path)).filter(Boolean);

  if (!relativePaths.length) {
    return { committed: false, stagedFiles: [] };
  }

  await git.add(relativePaths);
  const stagedOutput = await git.raw(["diff", "--cached", "--name-only"]);
  const stagedFiles = stagedOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!stagedFiles.length) {
    return { committed: false, stagedFiles: [] };
  }

  await git.commit(message);
  await git.push(remote, branch);
  return { committed: true, stagedFiles };
}
