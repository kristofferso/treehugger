---
name: new-task
question: Task workflow – map, clarify, sketch, plan, approval, code, final report
description: How a task is started and carried through – worktree, mapping, clarifications, sketches, plan, approval, implementation and final report. Use when the user says "start on ABC-123", asks for clarifications first, or wants a plan before code.
---

# New task

The order is fixed: worktree → mapping → clarifications → sketches → plan →
approval → code → final report. Write no code before the plan is approved.

A short request ("start on ABC-123, quick clarifications, then a plan") still
means the whole flow, just shorter. Skip clarifications only when the user
says so. Once the user has said go ahead, do not ask again.

## 1. Worktree

Follow the worktree instructions: clean up a free worktree, cut the branch
from the base branch, unset the upstream, and reset the database if the
worktree has its own. The first line of the first reply says which worktree,
which branch, and what was cleaned up or left alone.

## 2. Mapping

- Read the issue <in the issue tracker> with comments and related issues.
- Check the issue against the code. Issues are often written before other
  work was merged. List what is outdated or already done, with `file:line`.
- Challenge the premise. Do not build something straight from the issue text
  if it looks wrong; ask what it is for.
- Find the smallest change that gives an end-to-end PR.

The section is called **Does the task hold?** and is short.

## 3. Clarifications

In plain text, not a multiple-choice question tool.

Numbered points, 3–7 of them. With more, take the most important ones and put
the rest under "Assumptions". Each point:

```
## 2. Where the invoice due date comes from

**Background.** `createInvoice` (lib/invoices.ts:88) stores no due date. It
is computed from the customer's payment terms every time it is shown.

**Proposal.** Store the due date on the invoice when it is created, so
changing the payment terms later does not move it. Alternative: keep
computing it (simpler, but old invoices change due date).
```

Rules:
- State the rule or the consequence in one sentence before the details.
- One proposal per point, with one reason. Choices between alternatives are
  written a/b/c, ending with "I recommend b".
- Use the words from the code and the domain. No new terms.
- Include what the user would otherwise ask about, when it matters for the
  point: security, performance (table sizes, traffic), naming, and whether
  the solution is common practice or something invented here.
- Say so when something is copied from an existing pattern ("same shape as
  `X`"), so the user can ask whether it is needed.

After the points:
- **Assumptions I am going ahead with** – what you do if the user says nothing.
- **Outside the task, flagged only** – findings that belong in their own issues.

End with: "Answer the points you want different. I take the rest as given."

The user often answers point by point, without numbers, and may add
requirements or change their mind. Take the answer as it is, and follow up
only on points that are still open. If the user asks for examples, give
concrete situations (a–d) against the alternatives and end with one
recommendation.

## 4. Sketches

When the task changes the data model or the UI, before the plan:

- **Data model** as a code block: table, column, type, constraint.
- **UI** as an ASCII sketch with button texts and labels verbatim. With
  several screens or states, an HTML page can be better.

## 5. Plan

```
## Plan

1. **Data model** – `<path/to/schema>`: `winner.display_name text`
   - migration
2. **Draw** – `<path/to/draw>`: ...
3. ...

## Not in this PR
- ...

## Verification
- `<check command>`, <browser check> on <page>

## Open
- ...

Everything lands in `<worktree path>` on the branch `<branch>`.
```

- One point per commit or logical step, with file names.
- If the plan gets big, propose splitting it into stacked PRs before starting.
- Pick the simplest version. Static config before runtime machinery. Do not
  build for legacy or old data the project does not have.

Wait for approval.

## 6. Implementation

- Stay within the task. Do not simplify or tidy code outside your own work;
  mention it under "Things I noticed" instead.
- Follow the code style of the repository.
- If you deviate from the plan, say so when it happens, not only in the final
  report.

## 7. Along the way

- Answer a question before doing anything else. A question in the middle of
  an implementation is not a "continue".
- "Why X?": answer honestly. "There is no good reason" or "I copied it from
  Y" are valid answers, and better than defending it.
- "I don't understand": start with the rule in one sentence. Then the flow
  in numbered steps with `file:line` and 2–5 lines of code per step, and one
  worked example with real values.
- Commands the user runs themselves: one line, and explain flags that delete
  something before the user has to ask.
- If you are unsure about a claim about a tool, say so and check the source.
- If you have not seen it in a browser, write "not checked in a browser". Do
  not describe a visual effect you have not seen.

## 8. Wrap-up

Before the report: `<check command>`, and <browser check> for UI changes.
Give links to the pages you tested.

Final report:

```
`<worktree path>`, branch `<branch>`, commit abc1234, PR #58

**Changes** – 3–6 lines
**Tested** – what and how
**Not tested** – explicitly
**Choices I made without asking** – numbered
**Things I noticed** – belong in their own issues
```

- Keep the PR text and commit message up to date when the content changes,
  without asking.
- Issue tracker: status as a comment, not in the description. Do not move the
  status unless the user asks. Offer new issues for findings outside the task.
