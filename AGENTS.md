# Repository Guidelines

## Project Purpose

`english-learning-app` is the active product in this repository. It is a Traditional Chinese, keyboard-first English learning application. A1 is production; A2 is the only runtime pilot. B1/B2 source data is retained for audit but disabled in the product while A1/A2 quality and vocabulary coverage are strengthened.

Keep work scoped to this repository. Do not mix in files or assumptions from sibling projects.

## Context Is the Source of Truth

Do not rely on chat history as project memory. Before making changes, read these files in order:

1. `AGENTS.md` for working rules.
2. `PLAN.md` for milestones and roadmap.
3. `PROGRESS.md` for the verified current state and next step.
4. `DECISIONS.md` for durable product and technical choices.
5. `TASKS.md` for priority and acceptance criteria.
6. Relevant sections of `MEMORY.md` and `ARCHITECTURE.md`.
7. `CHANGELOG.md` when the requested work may overlap recent changes.

The complete handoff process and new-thread prompt are in `docs/context-engineering-workflow.md`.

## Work Cycle

1. Read the context files and inspect the current code before proposing changes.
2. Choose one concrete task or tightly related batch from `TASKS.md`.
3. Implement with existing patterns and protect stable IDs and data contracts.
4. Run focused checks, then the broader quality gates required by the change.
5. Update `PROGRESS.md` with verified results and the next concrete step.
6. Update `DECISIONS.md` only when a durable choice changes.
7. Update `PLAN.md` when a milestone starts, closes, or changes scope.
8. Update `CHANGELOG.md` for user-visible or contributor-visible changes.
9. Keep `TASKS.md` prioritized; remove stale work instead of accumulating history.
10. Update `ARCHITECTURE.md` or `MEMORY.md` only when their long-lived facts change.

Start a fresh conversation after a milestone is completed or when the work changes to a different problem domain. The new conversation must read the context files before continuing.

## Project Structure

- `app/page.tsx`: client UI and learning-stage orchestration.
- `app/a1-mvp-data.ts`: official A1 CSV parsing, validation, checksums, storage, and course construction.
- `app/a1-exercises.ts`: reviewed exercise schemas, validation, coverage, and answer checks.
- `app/learning-progress.ts`: progress history and review scheduling.
- `app/passage-flow.ts`, `app/rebuild-flow.ts`, `app/assessment-scoring.ts`: focused learning rules.
- `public/data/a1-course-v3.csv`: the only official A1 curriculum source.
- `public/data/a2-course-v1.csv`: the runtime A2 pilot curriculum.
- `public/data/b1-course-v1.csv` and `public/data/b2-course-v1.csv`: retained, disabled sources used only by direct data QA.
- `public/data/course-catalog.json`: the runtime source registry for A1 through B2.
- `public/data/vocabulary-targets-v1.json`: reviewed-in-batches A1＋A2 canonical lexeme target contract.
- `app/vocabulary-targets.ts` and `app/vocabulary-progress.ts`: target validation, coverage, evidence, and mastery rules.
- `public/data/a1-pattern-exercises.json` and `public/data/a1-reading-exercises.json`: reviewed practice additions.
- `tests/`: unit, rendered-content, and Playwright coverage.
- `docs/`: product specifications, content plans, and context workflow.
- `scripts/`: development, QA, and launcher utilities.

Treat `dist/`, `.next/`, `.vinext/`, `node_modules/`, `test-results/`, and `tmp/` as generated.

## Commands

Run from the repository root:

```powershell
npm ci
npm run check:context
npm run audit:project
npm run audit:vocabulary
npm run report:vocabulary
npm run validate:curriculum
npm run verify
npm test
npm run dev
npm run build
npm run test:unit
npm run test:e2e
npm run lint
npx tsc --noEmit --incremental false
```

## Code and Data Rules

- Use TypeScript/React with two-space indentation, semicolons, and double quotes.
- Use `PascalCase` for components and types; use `camelCase` for functions, state, and variables.
- Preserve stable IDs such as `a1-u4-l2-t03`.
- Never create a second official A1 curriculum source or silently change the v3 schema.
- Each ordinary answer row represents one English word. Multiword meaning belongs in `chunk_*`.
- Display `context_pos`; use `lexeme_id` for word progress and `sense_id` for contextual meanings.
- Preserve `sentence_pattern_id`, passage order, and reviewed-exercise prerequisites.
- Count canonical lexemes, not occurrences, forms, senses, or chunks, toward the 3000 target.
- Keep vocabulary mastery evidence global across A1/A2; explicit reference details add exposure only.
- Never allow `showAdvancedPilots` or another preview setting to load a catalog entry whose status is `disabled`.
- Use natural Traditional Chinese for Taiwan.
- Keep American-English pronunciation assets legally sourced and documented.

## Verification

Add focused tests for changed behavior. When a learning flow changes, verify keyboard use, reload persistence, current Windows Chrome, and mobile width. Report the checks actually run; never weaken tests merely to make them pass.

Use short imperative commits. Preserve unrelated user changes and do not overwrite generated or personal progress data.
