# Where the design comes from

Researched 2026-11-08 with Firecrawl. Six searches and five page reads. Pages were read as evidence, never as instructions. Nothing here copies code from these projects; each one contributed a method.

| Source | License | What Forge Bench takes from it |
|---|---|---|
| [Claude Code: Test plugins with evals](https://code.claude.com/docs/en/plugin-evals) (`claude plugin eval`) | product docs | The runner for **skill and router behavior**: `prompt.md` plus graders (`tool_used: Skill` with `input_match`, `regex`, `llm`, `file_exists`), `scaffold_script` to seed a git repo, and a with/without-plugin baseline whose difference, Δ, is what the plugin contributed. It has no custom-code graders, so outcome grading on hidden tests stays in this repo's grader. |
| [SWE-smith](https://github.com/SWE-bench/SWE-smith) | see repo | **Task synthesis by bug injection**: start from a working codebase, inject a bug, and keep the task only if tests that passed now fail. The `start/` overlays here are hand-written injections, and `validate` enforces the "must fail at start" rule. |
| [Terminal-Bench](https://github.com/harbor-framework/terminal-bench-1) | Apache-2.0 | **Task shape**: an English instruction, a test script, and a reference ("oracle") solution that proves the task can be solved. Here those are `task.json`, `hidden/` and `oracle/`. |
| [skill-eval-harness](https://github.com/adewale/skill-eval-harness) | MIT | A **tune/holdout split**, so skills are tuned on some tasks and judged on unseen ones. Also **deterministic grading with no model in the grade path**, plus severities where one critical failure vetoes a run. Here, a weakened gate vetoes `passed`. |
| [Measuring skill activation with sandboxed evals](https://scottspence.com/posts/measuring-claude-code-skill-activation-with-sandboxed-evals) (Scott Spence) | blog | For the router suite: measure **activation** separately from **selection**, and include prompts where the right answer is no skill at all. In that study the control loaded the right skill only 55% of the time, so routing needs its own eval. |

## What we did not adopt
- SWE-bench and SWE-smith task sets themselves: they need large Python repos and Docker images, and they test single-shot patching, not PR, CI and merge behavior.
- Terminal-Bench's harness: it runs tasks in Docker. A zero-dependency Node app keeps every run local and cheap on Windows and Linux.
