# Repository Guidelines

## Project Structure

`app/page.tsx` coordinates the client UI and learning stages. Keep reusable rules in focused modules such as `a1-mvp-data.ts`, `a1-exercises.ts`, `learning-progress.ts`, and `passage-flow.ts`. The only official A1 curriculum source is `public/data/a1-course-v3.csv`; reviewed practice questions live in the two `public/data/a1-*-exercises.json` files. Tests belong in `tests/`, utilities in `scripts/`, and topic specifications in `docs/`.

## Required Context Workflow

Before changing the project, read `PLAN.md`, `PROGRESS.md`, `DECISIONS.md`, `TASKS.md`, and the relevant sections of `MEMORY.md` and `ARCHITECTURE.md`. Continue from the recorded state; do not reconstruct decisions from chat history.

After work:

- Update `PROGRESS.md` with verified results and the next concrete step.
- Update `DECISIONS.md` only when a durable product or technical choice changes.
- Update `PLAN.md` when a milestone changes.
- Update `CHANGELOG.md` for user-visible changes.
- Keep `TASKS.md` prioritized and remove stale work.

## Commands

Run from the repository root:

```powershell
npm ci
npm run dev
npm run build
npm run test:unit
npm run test:e2e
npm run lint
npx tsc --noEmit --incremental false
```

## Code and Data Rules

Use TypeScript/React, two-space indentation, semicolons, and double quotes. Use `PascalCase` for components/types and `camelCase` for functions/state. Preserve stable IDs such as `a1-u4-l2-t03`.

Never create a second course-data source or silently change the v3 schema. Each answer row represents one word; multiword meaning belongs in `chunk_*`. Display `context_pos`, use `lexeme_id` for word progress, and retain `sense_id`, `sentence_pattern_id`, and passage ordering. Keep Traditional Chinese natural for Taiwan and American-English pronunciation data legally sourced.

## Verification and Commits

Add focused unit and Playwright coverage for changed behavior. Verify keyboard-first use, reload persistence, desktop Chrome, and mobile width when learning flow changes. Use short imperative commits, keep unrelated user changes intact, and report actual checks rather than changing tests merely to pass.
