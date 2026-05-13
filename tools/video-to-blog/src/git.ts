import { simpleGit } from "simple-git";
import { relative } from "node:path";

export async function commitAndPushManagedPaths({
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
  await git.add(relativePaths);
  const stagedOutput = await git.raw(["diff", "--cached", "--name-only"]);
  const stagedFiles = stagedOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!stagedFiles.length) {
    return { committed: false, pushed: false, stagedFiles };
  }

  await git.commit(message);
  const commitHash = (await git.raw(["rev-parse", "HEAD"])).trim();
  await git.push(remote, `HEAD:${branch}`);
  return {
    committed: true,
    pushed: true,
    stagedFiles,
    commitHash
  };
}
