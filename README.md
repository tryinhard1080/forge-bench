# Forge Bench

A test bench for comparing coding-agent skill stacks on the same frozen work. It has a synthetic app, tasks with hidden acceptance tests and reference solutions, and a grader that weakened tests or gates can't fool. It is built for the Forge Build bake-off and is reusable for any stack: Matt Pocock's skills, Addy Osmani's agent-skills, FORGE, or none.

Zero dependencies. Node 22 or later and git are all it needs.

```
npm run check                                        # validate every task, then test the harness
node scripts/bench.mjs list                          # the tasks
node scripts/bench.mjs materialize <task> <dir>      # a fresh one-commit repo in the task's starting state
node scripts/bench.mjs grade <task> <dir> [--json f] # score a candidate tree; exit 0 only when it passes
```

## What is in it
- **`app/` (Larder):** a small order-management app with pricing, inventory, orders, monthly reports, sessions and a migration. It has its own CI, lint, `.claude/forge.json` and seeded synthetic data (`app/data/generate.mjs`): 40 customers, 25 products and 300 orders. The data plants edge cases on purpose: names with commas and quotes, prices that produce half-cent discounts, out-of-stock products, and orders in the first hours of a month in UTC.
- **`tasks/<id>/`:** one frozen task each.
  - `task.json`: the issue text the agent receives, plus its kind, split and whether it is protected.
  - `start/`: files laid over the app to create the starting state, such as an injected bug.
  - `oracle/`: the reference solution.
  - `hidden/`: acceptance tests the agent never sees.
- **`scripts/bench.mjs`:** materialize, grade and validate.
- **`test/`:** tests for the harness itself, including attempts to game the grader.

## Tasks

| Task | Split | Kind | What it probes |
|---|---|---|---|
| bug-discount-rounding | tune | bugfix | Diagnose from a user report; a regression test first |
| bug-oversell | tune | bugfix | A state bug across calls |
| feature-csv-export | tune | feature | A small, clear spec: no artificial grill or spec phase |
| ci-red-lint | tune | ci-repair | Fix CI at the cause without weakening the gate |
| protected-session-ttl | tune | protected | Make the change, but never auto-merge a `src/auth/**` change |
| bug-report-timezone | holdout | bugfix | Time-zone month boundaries in real data |
| feature-low-stock | holdout | feature | A spec with ordering and error rules |

Tune skills on the `tune` tasks only. Run `holdout` tasks once, at the end of a round. Looking at their hidden tests while tuning spoils them.

## How grading works
`grade` copies the candidate tree and runs four checks:
1. the hidden tests;
2. the **original** visible tests, so a deleted or loosened test can't hide a regression;
3. the candidate's own tests, which must pass, and any it added are counted;
4. the **original** lint script.

A candidate passes only if all four pass and no gate file changed (`scripts/lint.mjs`, the CI workflow, `package.json`). The report also lists changed files and protected paths touched. No model is in the grade path.

`validate` checks the tasks themselves:
- the data matches its seed;
- every task's hidden tests fail on its starting state;
- the visible tests and lint match the declared starting state;
- the oracle passes;
- the `protected` flag matches the paths the oracle touches.

A task that can't fail tests nothing, so `validate` blocks it.

## How the bake-off uses it
For each arm (a skill stack) and task:
1. `materialize` the task;
2. run the agent in that directory with the task's `instruction`;
3. `grade` the result;
4. add the run's process metrics: commits, pushes, CI runs, cancelled runs, interventions and time;
5. have a different model family judge the diffs blind.

Live CI and merge behavior is tested on `tryinhard1080/forge-shepherd-sandbox`.

Skill routing (did the right skill fire?) is a different question. That suite lives with the plugin under test and runs on `claude plugin eval`, using its with/without baseline.

Design sources and what each one contributed are in [docs/sources.md](docs/sources.md).

## Adding a task
1. Create `tasks/<id>/task.json` with `id`, `title`, `kind` (bugfix, feature, ci-repair or protected), `split` (tune or holdout), `protected`, `start` (`{ "visible": "pass", "lint": "pass" }` or `"fail"`), `expected_route` and `instruction`.
2. Put the injected change in `start/`, the solution in `oracle/` and the acceptance tests in `hidden/`. Hidden tests import from `../src/...`, as if they sat in `test/`.
3. Run `npm run check`. Iterate until it says every task is valid.
