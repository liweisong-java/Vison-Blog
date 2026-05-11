import { simpleGit } from "simple-git";
import { relative } from "node:path";

async function resolvePushTarget({
  git,
  branch,
  remote
}: {
  git: ReturnType<typeof simpleGit>;
  branch?: string;
  remote: string;
}) {
  const currentBranch = (await git.raw(["branch", "--show-current"])).trim();
  const upstreamRef = await git
    .raw(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
    .then((value) => value.trim())
    .catch(() => "");
  const upstreamBranch = upstreamRef.startsWith(`${remote}/`)
    ? upstreamRef.slice(remote.length + 1)
    : "";

  if (branch?.trim()) {
    const requestedBranch = branch.trim();
    if (
      requestedBranch !== currentBranch &&
      requestedBranch !== upstreamBranch
    ) {
      throw new Error(
        `Unsafe publish branch "${requestedBranch}". Current branch is "${currentBranch}" and upstream is "${upstreamRef || "none"}".`
      );
    }

    return requestedBranch;
  }

  if (upstreamBranch) {
    return upstreamBranch;
  }

  if (currentBranch) {
    return currentBranch;
  }

  throw new Error("Unable to determine a safe publish branch for automatic content sync.");
}

export async function commitAndPush({
  repoRoot,
  branch,
  remote,
  message,
  includePaths
}: {
  repoRoot: string;
  branch?: string;
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

  const pushBranch = await resolvePushTarget({ git, branch, remote });
  await git.commit(message);
  await git.push(remote, `HEAD:${pushBranch}`);
  return { committed: true, stagedFiles };
}
