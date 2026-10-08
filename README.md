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
9. Optional skills to write as well (see below)
10. Where the instructions go: `AGENTS.md`, `CLAUDE.md`, `.claude/skills/<name>/SKILL.md` or a path
11. Language of the instructions
12. Anything else the agent should know

Requires Node 18 or newer. No dependencies.

## Optional skills

Every file in `skills/` shows up as a choice in question 9. The agent writes
the chosen ones next to the worktree instructions, translated and adapted to
the repository.

| File | What it is |
|---|---|
| `skills/new-task.md` | Task workflow: worktree, mapping, clarifications, sketches, plan, approval, implementation, final report |

### Adding one

Add `skills/<name>.md`. No code changes.

```markdown
---
name: pr-review
question: PR review – one step at a time, ordered by data flow
description: How a change is walked through for review. Use when the user asks to review a branch or PR.
---

# PR review

...
```

- `name` is the skill's name, and its path when the instructions go in
  `.claude/skills/<name>/SKILL.md`.
- `question` is the line shown in the CLI.
- `description` becomes the skill's frontmatter description.
- The body is a template. Write it in English and keep it free of anything
  specific to one project or person. Put what the agent must fill in as
  `<placeholder>`, e.g. `<check command>`; the prompt tells the agent to
  replace those and drop parts that do not apply.
- Each line of the frontmatter is `key: value` on one line.
