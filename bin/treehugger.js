#!/usr/bin/env node
// Asks a few questions, then prints a setup prompt for a coding agent.
// Questions go to stderr and the prompt to stdout, so `treehugger > prompt.md` works.

import { spawnSync } from "node:child_process";
import { basename, dirname } from "node:path";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stderr });
// An iterator instead of rl.question, so piped input is not dropped.
const lines = rl[Symbol.asyncIterator]();

async function ask(question, fallback = "") {
  const hint = fallback ? ` (${fallback})` : "";
  rl.setPrompt(`${question}${hint}: `);
  rl.prompt();
  const next = await lines.next();
  if (next.done) {
    process.stderr.write("\n");
    return fallback;
  }
  return next.value.trim() || fallback;
}

async function confirm(question, fallback) {
  const answer = await ask(`${question} [y/n]`, fallback ? "y" : "n");
  return /^[yj]/i.test(answer);
}

async function choose(question, options) {
  process.stderr.write(`${question}\n`);
  options.forEach((option, i) => process.stderr.write(`  ${i + 1}) ${option}\n`));
  const answer = await ask("Choose", "1");
  const index = Number(answer) - 1;
  if (options[index]) {
    return { index, value: options[index] };
  }
  return { index: -1, value: answer };
}

function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    return "";
  }
  return result.stdout.trim();
}

// The main checkout's name, also when run from inside a worktree.
function repoName() {
  const commonDir = git("rev-parse", "--path-format=absolute", "--git-common-dir");
  if (!commonDir) {
    return "repo";
  }
  return basename(dirname(commonDir));
}

function defaultBase() {
  return git("symbolic-ref", "--short", "refs/remotes/origin/HEAD") || "origin/main";
}

function letters(count) {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(97 + i));
}

function copyToClipboard(text) {
  const tools = {
    darwin: [["pbcopy"]],
    win32: [["clip"]],
  };
  const candidates = tools[process.platform] ?? [["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]];
  for (const [command, ...args] of candidates) {
    const result = spawnSync(command, args, { input: text });
    if (result.status === 0) {
      return command;
    }
  }
  return null;
}

async function collectAnswers() {
  const repo = repoName();
  process.stderr.write(`treehugger – fixed git worktrees for ${repo}\n\n`);

  const count = Number(await ask("How many worktrees", "3")) || 3;
  const names = (await ask("Names, space separated", letters(count).join(" "))).split(/\s+/);

  const locations = [".worktrees/<name>", `../${repo}-<name>`, ".claude/worktrees/<name>", "Other (type a path with <name>)"];
  const location = await choose("Where should they live?", locations);
  let path = location.value;
  if (location.index === 3) {
    path = await ask("Path", ".worktrees/<name>");
  }

  const base = await ask("New branches start from", defaultBase());
  const squash = await confirm("Are PRs squash-merged", true);
  const branchNames = await ask(
    "Branch naming",
    "2–3 words in kebab-case describing the change, issue key last if there is one, no prefix",
  );
  const database = await confirm("Own database per worktree", false);
  const ports = await confirm("Own dev ports per worktree", true);

  const targets = ["AGENTS.md", "CLAUDE.md", ".claude/skills/worktrees/SKILL.md", "Other (type a path)"];
  const target = await choose("Where should the agent write the worktree instructions?", targets);
  let instructions = target.value;
  if (target.index === 3) {
    instructions = await ask("Path", "AGENTS.md");
  }

  const language = await ask("Language of the instructions", "English");
  const notes = await ask("Anything else the agent should know", "");

  return { repo, names, path, base, squash, branchNames, database, ports, instructions, language, notes };
}

function section(condition, text) {
  if (!condition) {
    return "";
  }
  return text;
}

function buildPrompt(a) {
  const first = a.names[0];
  const firstPath = a.path.replace("<name>", first);
  const insideRepo = !a.path.startsWith("../") && !a.path.startsWith("/");
  const resetLine = section(a.database, "<db reset command>   # see below\n");

  return `Set up a fixed set of git worktrees in this repository, then write instructions for using them. Do the steps in order and stop where it says so.

## Choices

- Worktrees: ${a.names.join(", ")}
- Location: \`${a.path}\` (the first one is \`${firstPath}\`)
- New branches start from: \`${a.base}\`
- PRs are squash-merged: ${a.squash ? "yes" : "no"}
- Branch names: ${a.branchNames}
- Own database per worktree: ${a.database ? "yes" : "no"}
- Own dev ports per worktree: ${a.ports ? "yes" : "no"}
- Instructions go in: \`${a.instructions}\`
- Language of the instructions: ${a.language}
${section(a.notes, `- Other: ${a.notes}\n`)}
## How the setup works

The worktrees are permanent. A task never gets a new worktree; it gets a new branch inside a free one. Each worktree keeps its installed dependencies and local env files, so switching tasks is cheap. A worktree is never deleted, only switched to another branch.

Gitignored files that every checkout needs (env files from a secrets tool, local config) live as real files in the main checkout. The worktrees symlink to them, so they are refreshed in one place. Values that must differ per worktree go in one real, gitignored file per worktree, \`.env.worktree.local\`, which the dev and db scripts load last so it wins.

## Step 1: Map the repository

Change nothing yet. Find and report:

- Gitignored files a fresh checkout needs in order to run: env files, local config, certificates. For each path, say what creates it (a CLI such as \`vercel env pull\`, a setup script, by hand) and whether that tool rewrites the whole file.
- How dependencies are installed.
- How every dev, test and db script loads env files, and how to make them load \`.env.worktree.local\` last.
${section(a.database, `- The database: engine, where the connection string is read, how migrations and seeds run, and whether a reset command exists. Whether reset refuses non-local hosts. Whether the migration tool silently skips migrations older than the newest one applied.\n`)}${section(a.ports, `- Every dev server and how its port is set, plus every place one local app points at another (for example \`NEXT_PUBLIC_*_URL\`).\n`)}${section(insideRepo, `- Whether \`${a.path.replace("/<name>", "")}\` is gitignored, and whether tools that walk the tree (type checker, linter, test runner, bundler, file watcher) would pick up the nested worktrees.\n`)}- Anything else that collides when two worktrees run at the same time: shared caches, fixed container names, lock files.

## Step 2: Propose, then wait

Write a short plan:

- Which files are symlinked from the main checkout, and which are real per-worktree files.
- The full contents of \`${firstPath}/.env.worktree.local\`, with real values.
- Every script change, as a diff.
${section(a.database, `- Database per worktree: \`${a.repo}_<name>\`. The main checkout keeps its own.\n`)}${section(a.ports, `- Ports per worktree: the default port + 10·n, where n is the worktree's position (${a.names.slice(0, 2).map((name, i) => `${name}=${i + 1}`).join(", ")}, …). The main checkout keeps the defaults.\n`)}- Anything you could not decide.

Stop and wait for approval.

## Step 3: Set up

After approval:

1. Cut a branch from \`${a.base}\` in the main checkout. Commit the script changes${section(insideRepo, ", the .gitignore entry")} and the instructions from step 4 there. Ask before pushing.
2. For each worktree: \`git worktree add --detach <path> ${a.base}\`, create the symlinks (relative paths), write \`.env.worktree.local\`, install dependencies${section(a.database, ", create the database, migrate and seed")}.
3. Check out the setup branch in \`${firstPath}\` and verify it: ${a.ports ? "start the dev servers and confirm they answer on the new ports" : "start the dev servers and confirm they answer"}${section(a.database, ", and confirm it uses its own database and that a reset there leaves the main checkout's database alone")}. Switch it back to \`--detach ${a.base}\` afterwards.

## Step 4: Write the instructions

Write them to \`${a.instructions}\` in ${a.language}${section(a.instructions.endsWith("SKILL.md"), ", with `name` and `description` frontmatter so the agent loads it when a task starts or a PR is merged")}. Short, with exact commands for this repository. Cover:

**Layout.** Names and paths. What is symlinked and what is per worktree. How to add another worktree, with the commands from step 3. Tools that rewrite a shared env file run in the main checkout only.${section(a.database, " Without `.env.worktree.local` a worktree falls back to the main checkout's database, and reset wipes it: check the file exists before resetting.")}

**Starting a task.**
\`\`\`
cd ${firstPath}
git status                      # must be clean
git switch -c <branch> ${a.base}
git branch --unset-upstream
${resetLine}\`\`\`
- Always pass \`${a.base}\`: the worktree still sits on the previous task, so without it the branch starts from the wrong place.
- \`git switch -c\` with a remote branch as start point sets it as upstream. Unset it, or push and pull go against \`${a.base.replace(/^origin\//, "")}\`.
${section(a.database, "- If the migration tool skips older migrations it has not run, reset the database after every switch. Say so with the actual command.\n")}- Branch names: ${a.branchNames}.
- All worktrees busy: clean up a finished one, or add one.

**Cleaning up after merge.**
\`\`\`
git status                      # uncommitted work: commit it or discard it on purpose
git clean -nd                   # lists untracked files, deletes nothing
git clean -fd                   # deletes them, if the list looks right
git switch --detach ${a.base}
git fetch -p
${a.squash ? "git branch -vv | grep ': gone]'" : `git branch --merged ${a.base}`}
git branch -D <branch>
\`\`\`
- Never \`git clean -x\`: it also deletes ignored files, which means the symlinks, \`.env.worktree.local\` and dependencies.
- \`--detach\` because the main branch is checked out in the main checkout, and git refuses the same branch in two worktrees.
${a.squash ? "- `gone` means the host deleted the branch on merge. It is the only reliable signal. Check that the host deletes branches on merge, and say so if it does not.\n" : ""}- Never delete a worktree; switch it to another branch.
${section(a.squash, `
**Do not trust a diff against main.** A squash merge gets a new commit id, so \`git log main..<branch>\`, \`git diff main..<branch>\` and \`git branch --merged\` show work that is already merged. Ask the host instead, for example \`gh pr view <branch> --json state -q .state\` on GitHub. With several PRs from one branch: \`gh pr list -s all -H <branch>\`.
`)}
**Stacking.** A branch built on another unmerged branch gets that branch as its PR base. Once the parent is merged: \`git rebase --onto ${a.base} <parent> <branch>\`.

**Handoff.** When reporting finished work, give the worktree path and the branch.
`;
}

const answers = await collectAnswers();
rl.close();

const prompt = buildPrompt(answers);
const copiedWith = copyToClipboard(prompt);
const where = copiedWith ? `, also copied to the clipboard (${copiedWith})` : "";
process.stderr.write(`\nPaste this into your coding agent${where}:\n\n`);
process.stdout.write(prompt);
