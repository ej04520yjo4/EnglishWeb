# System Architecture

## Overview

英句練習 is a Vinext/React client application deployed through a Cloudflare Worker-compatible build. It has no application backend or account system. Curriculum and exercise files are static assets; learner state is stored on the device.

## Runtime Flow

```mermaid
flowchart LR
  Catalog["course-catalog.json"] --> LevelLoader["curriculum/loader.ts"]
  A1["A1 v3 CSV + reviewed JSON"] --> Adapter["A1 legacy adapter"]
  A2["A2 v1 CSV + pilot JSON"] --> LevelLoader
  Groups["vocabulary-groups-v1.json"] --> Vocabulary["vocabulary-groups.ts"]
  Reference["reference-vocabulary-v1.json"] --> Vocabulary
  A1 --> Vocabulary
  Adapter --> LevelLoader
  LevelLoader --> Validate["Level validation and checksums"]
  Validate --> Units["Independent A1 and A2 CourseUnit arrays"]
  Units --> Page["page.tsx selected-level learning state"]
  Vocabulary --> Page
  Page <--> Storage["localStorage schema v4, settings, per-level overrides"]
  Page --> UI["Course map and learning stages"]
```

At startup, the app loads the catalog, then loads and validates A1 and A2 separately. The A1 legacy adapter preserves the production v3 behavior while the common loader establishes the reusable level boundary. A saved local curriculum is restored only when its level version and revision match the official source. One level can fail without invalidating another.

## Module Responsibilities

- `app/page.tsx`: screen navigation, learning-stage orchestration, speech fallback, content management, and persistence wiring.
- `app/curriculum/catalog.ts`: catalog parsing, release state, formal unlock, and QA-preview access.
- `app/curriculum/loader.ts`: common level loading and source revision calculation.
- `app/curriculum/validation.ts`: generic one-word, identity, relation, chunk, pattern, passage, and audio-state checks.
- `app/curriculum/progress.ts`: schema v4 migration and isolated A1/A2 progress helpers.
- `app/curriculum/storage.ts`: level-aware source version, revision, update time, and override storage.
- `app/curriculum/a1-legacy-adapter.ts`: A1 compatibility boundary around the established v3 builder.
- `app/a1-mvp-data.ts`: CSV parsing, normalization, validation, checksums, versioned storage, and course construction.
- `app/a1-exercises.ts`: pattern/reading schemas, prerequisite and slot validation, coverage reporting, and answer checks.
- `scripts/create-a2-pilot-data.mjs`: reproducibly builds the single A2 pilot CSV while preserving unit 1 definitions.
- `scripts/create-a2-pilot-exercises.mjs`: reproducibly appends units 2–4 exercises and passages to the existing unit 1 JSON.
- `app/course-data.ts`: stable TypeScript course types plus A-Z static data; it is not a second A1 lesson source.
- `app/learning-progress.ts`: token/entity history and review scheduling.
- `app/learning-adaptation.ts`: hint level and review-exercise selection.
- `app/rebuild-flow.ts`, `app/passage-flow.ts`, `app/assessment-scoring.ts`: pure evaluation rules.
- `app/kk-phonetics.ts`: separate KK symbol curriculum and audio metadata mapping.
- `app/vocabulary-groups.ts`: related-topic schemas, validation, formal/reference resolution, search normalization, learning-state display, and isolated loading.
- `worker/index.ts`: Vinext request and image handling for hosted deployment.

## Data Boundaries

The hierarchy is Level -> Unit -> Lesson -> Stage -> Exercise. Within a sentence:

- occurrence/token rows define one-word answers;
- `lexeme_id` joins the same word across case and occurrence;
- `sense_id` distinguishes contextual meaning;
- `chunk_*` joins several word rows for whole-phrase teaching;
- `sentence_pattern_id` joins grammatical structures;
- `passage_id` and `sentence_order` join ordered sentences.

These layers are additive and must not be collapsed into one input model.

Related vocabulary is a read-only projection over formal A1 lexemes plus explicitly reference-only gaps. Topic and chunk relationships use stable IDs. Cards display the canonical lemma and may apply a validated group-level Traditional Chinese override, while progress, occurrences, audio, and source identity stay formal. Search resolution keeps the active topic when it matches, otherwise selects the first matching topic, and returns no active detail when no group matches.

A2 uses one CSV and two exercise JSON files for all four pilot units. New transfer examples include ordered slot values, and new passage sentences declare their lesson prerequisites and required lexemes/chunks. The ten-unit blueprint is documentation only and never enters runtime course construction.

Passage comprehension keeps `options` as strings for UI and A1 compatibility. New A2 passage questions also declare `optionMetadata` with the lexeme and chunk prerequisites for each option. Validation uses the latest lesson attached to the passage as the prerequisite boundary, so a distractor cannot introduce vocabulary or chunks from a later unit.

## Persistence

Browser storage holds progress schema v4, settings, and validated per-level course overrides. A v3 record migrates into the A1 slot without changing its existing fields; A2 starts empty. Official static files remain authoritative, and a changed level checksum invalidates only that level's stale override. Related vocabulary may save only the last viewed group ID as UI state. No personal data is sent to a project-owned server.

## Context Documentation Flow

```mermaid
flowchart LR
  A["Read AGENTS.md"] --> B["Read PLAN, PROGRESS, DECISIONS, TASKS"]
  B --> C["Inspect relevant MEMORY and ARCHITECTURE"]
  C --> D["Implement one scoped task"]
  D --> E["Run verification"]
  E --> F["Update PROGRESS and TASKS"]
  F --> G{"Durable change?"}
  G -->|Decision| H["Update DECISIONS.md"]
  G -->|Architecture| I["Update ARCHITECTURE.md"]
  G -->|Milestone| J["Update PLAN.md"]
  G -->|User-visible| K["Update CHANGELOG.md"]
  H --> L["Record next concrete step"]
  I --> L
  J --> L
  K --> L
```

`PROGRESS.md` is the current verified state, not a diary. `MEMORY.md` stores long-lived facts, not today's tasks. `DECISIONS.md` records why durable choices exist.

## Quality Gates

- `npm run check:context` verifies the project-context files and encoding.
- Unit tests verify per-level row counts, cross-level ID isolation, migration fidelity, data round-trips, prerequisites, scoring, adaptation, and passage behavior.
- Render checks verify Traditional Chinese product output.
- Playwright runs real desktop (`1440x900`) and mobile (`375x812`) A1/A2 learning, passage, error-isolation, and persistence flows.
- Saved-state Playwright fixtures are installed with `page.addInitScript` before application hydration and never overwrite progress produced later in the same test.
- Browser interactions wait for observable level-home and course-map readiness rather than fixed sleeps.
- A2 browser coverage walks all 12 newly added lesson flows, all three new passages, formal sequential unlocking, QA inspection, reload persistence, and the no-full-level-pass boundary.
- Related-vocabulary checks cover source priority, topic ordering, search, status derivation, progress neutrality, course return, responsive layout, and data-failure isolation.
- CI requires context checks, build, unit tests, lint, TypeScript, and browser tests, then retains the Playwright HTML report, failure screenshots, error context, and traces for diagnosis.
