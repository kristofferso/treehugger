# treehugger

Asks a few questions about how you want git worktrees set up, then prints a
prompt you paste into a coding agent (Claude Code, Codex, Cursor, …). The
agent maps the repository, proposes a plan, waits for approval, sets up the
worktrees and writes instructions for using them.

```
npx github:<owner>/treehugger
```

Run it from the repository you want to set up. Questions go to stderr and the
prompt to stdout, so `npx github:<owner>/treehugger > prompt.md` also works.
The prompt is copied to the clipboard when `pbcopy`, `clip`, `wl-copy`,
`xclip` or `xsel` is available.

## The setup it describes

- A fixed number of permanent worktrees (`a`, `b`, `c` by default). A task gets
  a new branch in a free worktree, never a new worktree.
- Gitignored files every checkout needs are real files in the main checkout
  and symlinks in the worktrees.
- Values that differ per worktree (database, dev ports) go in a real,
  gitignored `.env.worktree.local` per worktree, loaded last by the scripts.
- Instructions for starting a task, cleaning up after merge, squash-merge
  pitfalls and stacking, written to `AGENTS.md`, `CLAUDE.md` or a skill.

## Questions

1. How many worktrees
2. Their names
3. Where they live: `.worktrees/<name>`, `../<repo>-<name>`, `.claude/worktrees/<name>` or a path
4. Which branch new branches start from (default: `origin/HEAD`)
5. Whether PRs are squash-merged
6. Branch naming
7. Own database per worktree
8. Own dev ports per worktree
9. Where the instructions go
10. Language of the instructions
11. Anything else the agent should know

Requires Node 18 or newer. No dependencies.
