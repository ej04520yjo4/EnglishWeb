# Product Plan

## Product Direction

EnglishWeb is a Traditional Chinese, keyboard-first English learning site. It teaches sentence production by moving from individual word recall to whole-sentence and passage understanding. A1 is the current complete content level; the architecture must remain extendable through CEFR A2–C2.

## Milestones

### M0 — A1 MVP Foundation (complete)

- One official v3 CSV builds 8 units, 32 lessons, and 145 word occurrences.
- Word/token, chunk, sentence pattern, lesson, and passage layers remain separate.
- Course map, recall, detail, sentence rebuild, reviewed reading exercises, review scheduling, assessment, local progress, and content QA are connected.
- Desktop and mobile browser flows have automated coverage.

### M1 — Reviewed A1 Practice Expansion (current)

- Expand transfer practice in small, manually reviewed batches.
- Next batch: `name-identification`, `demonstrative-identification`, `be-identification` in review mode, and `go-to-place`.
- Require learned lexeme/chunk checks, natural Taiwan Chinese, non-source variations, and matching source patterns.
- Finish when every enabled A1 pattern has validated exercises and browser coverage.

### M2 — Pronunciation Asset Completion

- Keep Web Speech API only as a temporary word/sentence fallback.
- Produce or select free/open American-English audio with attribution.
- QA standalone KK symbols, word audio, and sentence audio separately.
- Mark audio `ready` only when a real playable source and license exist.

### M3 — A2 Curriculum Design

- Define A2 vocabulary, grammar, length, tense, chunk, prompt, and speed limits.
- Create content in a new versioned source; do not weaken the A1 v3 contract.
- Validate 70/20/10 old/new/challenge balance and prerequisite order before UI rollout.

### M4 — Learning Depth and Release Readiness

- Improve delayed review and mastery evidence across lexeme, sense, pattern, and passage.
- Reduce the size of the central page component without changing behavior.
- Complete accessibility, responsive, import/export, licensing, and recovery checks.

## Milestone Rules

A milestone closes only after its acceptance tests pass, `PROGRESS.md` records the outcome, `CHANGELOG.md` records user-visible effects, and this plan names the next active milestone.
