# treehugger 🌳

Running several AI agents on the same repo at once gets messy fast: they
trample each other's files, fight over ports, and wipe each other's database.
Git worktrees fix that. Setting them up well is fiddly, though.

treehugger asks you a few questions and hands you a prompt. Paste it into
your coding agent (Claude Code, Codex, Cursor, whatever you use), and the
agent sets everything up for your repo.

## Try it

From the root of your repo:

```
npx github:kristofferso/treehugger
```

Answer the questions (Enter takes the default). The prompt is printed and
copied to your clipboard. Paste it into your agent.

The agent looks around your repo first, then shows you a plan and waits. It
changes nothing until you say go.

## What you end up with

- **A few permanent worktrees**, `a`, `b` and `c` by default. One agent per
  worktree. You don't make a new worktree per task. You start a new branch in
  a free one, so dependencies and env files are already there.
- **Shared env files** stay in your main checkout. The worktrees symlink to
  them, so you only update secrets in one place.
- **Optional: own database and ports per worktree**, so three dev servers can
  run side by side without stepping on each other.
- **Instructions your agent follows**: how to start a task, how to clean up
  after a merge, the squash-merge traps, stacked PRs. Written to `AGENTS.md`,
  `CLAUDE.md` or as Claude Code skills, in the language you pick.

## Optional extras

You can also have the agent write these:

- **new-task**: a task workflow. The agent maps the task, asks clarifying
  questions, shows a plan, waits for your OK, codes, and ends with a short
  report on what was tested and what wasn't.

More are coming.

## Add your own

Drop a markdown file in `skills/` and it shows up as an option. No code
changes.

```markdown
---
name: pr-review
question: PR review – one step at a time
description: How a change is walked through for review. Use when the user asks to review a branch or PR.
---

# PR review

...
```

- `name`: the skill's name.
- `question`: the line shown in the CLI.
- `description`: tells the agent when to use the skill.
- The rest is a template. Keep it free of anything project-specific, and use
  `<placeholders>` like `<test command>` for things the agent should fill in.

PRs welcome.

## Good to know

- Needs Node 18 or newer. No dependencies.
- Want the prompt in a file instead? `npx github:kristofferso/treehugger > prompt.md`
