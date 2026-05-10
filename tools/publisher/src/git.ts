import { simpleGit } from "simple-git";

export async function commitAndPush({
  repoRoot,
  branch,
  remote,
  message
}: {
  repoRoot: string;
  branch: string;
  remote: string;
  message: string;
}) {
  const git = simpleGit(repoRoot);
  await git.add(".");
  const status = await git.status();
  if (!status.files.length) {
    return { committed: false };
  }

  await git.commit(message);
  await git.push(remote, branch);
  return { committed: true };
}
