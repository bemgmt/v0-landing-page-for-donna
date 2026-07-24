---
name: signoff-qa-planning
description: Plan, author, and verify user-facing product work with Signoff. Use for any new or changed user-facing behavior, bug fix, product creation, release, or QA request when the Signoff MCP server is available.
---

# Signoff QA Planning

Treat Signoff as the executable specification of what a person can do and observe in the product.

## Plan the product

1. Call `whoami`, then `get_project_plan` for the current product.
2. If the product or a slice lacks an intent anchor, draft one in plain user-facing language.
3. Map the names, boundaries, and order of every durable user journey before implementation.
4. Keep exactly one ordered queue. Position 1 is At Bat, position 2 is On Deck, position 3 is In the Hole, and the remainder is Later.
5. Expand detailed checks only for At Bat. Do not scaffold detailed checks across every future slice.
6. Activate authorized project and slice planning changes immediately with truthful authorship and immutable history. Create an inactive draft only when the user explicitly asks for one.

When an intent is new or changed, read this warning before the acting human or agent confirms the exact revision:

> This intent determines every downstream QA check. It is vital to get it right.

Then explicitly supply the acknowledgement `intent-is-vital` in the planning call. The server must never infer this acknowledgement for you.

## Write filmable checks

- Write one check for one action a person performs and one result they can observe.
- Convert implementation language into observable behavior. Keep internal tasks and untestable ideas in private planning notes, never on the visible QA board.
- Cover every applicable tenet: happy path, boundaries and limits, invalid or empty input, persistence, navigation, lifecycle and teardown, permissions and privacy, failure and recovery, regression, UI quality, accessibility, and responsive or platform behavior.
- Give each check a severity. Use dealbreaker only when the user cannot complete the core task, data or money is unsafe, or the product crashes.
- Do not weaken or delete historical expectations to obtain a passing result. Revise the catalog and retest through a new immutable snapshot.

## Open the run

1. After the plan is active, call `get_slice_plan` for At Bat.
2. Create a run from the current catalog revisions and pin it to the exact build under test.
3. Prefer a commit SHA when available, but never require Git. A deployment URL, build label, release identifier, or timestamped environment is valid.
4. Make the new run the slice's explicit current run.

## Verify through the product

- Perform every action through the real browser, app, device, or public feature exactly as a person would.
- Code review, unit tests, handlers, database queries, and internal state are supporting context, never a passing verdict.
- Record the real verification actor and method. An agent may earn a verdict by operating the user interface, but must never claim to be human.
- Attach screenshots or other evidence to the exact item. Complete the upload before citing it.
- Approve what passed, reject what failed, and include reproducible steps.

## Learn from failures

Before another fix attempt, read the check's private diagnostic context.
After a failed attempt, append the observation, telemetry, hypothesis, attempted change, build identity, retest result, and learning.
Do not overwrite prior attempts or expose diagnostic metadata on the ordinary board.

## Finish the slice

1. Call `reflect` on the current run.
2. Resolve or explicitly retain every uncovered applicable tenet.
3. Never close a run with an unapproved dealbreaker.
4. Close the run only after real UI verification and reproducible evidence.
5. Explicitly advance the queue after At Bat is verified, then continue the same loop for the next slice.
6. Never stop merely because a human has not intervened. A human may inspect, edit, reverify, or reorder the work at any point.
