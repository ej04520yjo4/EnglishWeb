# Design Decisions

Durable decisions are recorded here so later work does not reopen settled questions without new evidence.

## ADR-001 - One Official A1 Source

**Status:** Accepted

**Decision:** `public/data/a1-course-v3.csv` is the only official A1 curriculum. All 32 lessons are built from it.

**Reason:** Two hand-maintained sources previously caused inconsistent lessons and tests.

## ADR-002 - Word Input and Chunk Meaning Are Separate

**Status:** Accepted

**Decision:** An ordinary answer row contains exactly one English word. `chunk_*` groups related rows for whole-phrase meaning and teaching notes.

**Reason:** Learners need unambiguous input boxes without losing phrasal-verb or collocation meaning.

## ADR-003 - Text-First MVP

**Status:** Accepted

**Decision:** Current learning prioritizes reading and typed production. Microphone input, speech recognition, pronunciation scoring, and universal dictation are deferred.

**Reason:** The core learning loop must be reliable before platform-dependent voice assessment is added.

## ADR-004 - Local-First Progress

**Status:** Accepted

**Decision:** Progress and settings use browser `localStorage`; no account is required. Course overrides include version, revision, and update time.

**Reason:** The current product is for personal learning and must work without backend identity.

## ADR-005 - Free/Open American-English Audio

**Status:** Accepted

**Decision:** Prefer open-license recorded audio. Use Web Speech API only as a fallback and never claim pending audio is ready. KK symbols are taught separately from A-Z letter names.

**Reason:** Avoid paid dependencies, copyright risk, and confusion between letters, words, and phonetic symbols.

## ADR-006 - Reviewed Exercise Expansion

**Status:** Accepted

**Decision:** Enable sentence-pattern transfer in small batches after checking prerequisites, slots, meaning, and non-source variation.

**Reason:** Automated bulk generation can introduce untaught vocabulary and mismatched sentence patterns.

## ADR-007 - Documentation Is Working State

**Status:** Accepted

**Decision:** `AGENTS.md`, `PLAN.md`, `PROGRESS.md`, `DECISIONS.md`, `TASKS.md`, `MEMORY.md`, `CHANGELOG.md`, and `ARCHITECTURE.md` are the durable project context. Each work cycle reads them and updates only the files whose facts changed.

**Reason:** Maintained files are more reliable than long chat history.

## ADR-008 - Windows Launchers Stay Thin

**Status:** Accepted

**Decision:** Root BAT files establish UTF-8 and delegate checks to one shared PowerShell launcher. Existing npm and Vinext commands remain unchanged.

**Reason:** This supports Chinese and spaced paths without duplicating launch logic.

## ADR-009 - Milestone-Bounded Conversation Handoffs

**Status:** Accepted

**Decision:** Start a fresh conversation when a milestone closes or the work moves to a different problem domain. The new conversation reads the context files before acting.

**Reason:** Smaller conversations reduce context drift while the files preserve continuity.

## ADR-010 - Versioned Level Catalog

**Status:** Accepted

**Decision:** `public/data/course-catalog.json` declares each CEFR level, source files, version, and release status. A1 remains production on v3; A2 uses an independent v1 pilot.

**Reason:** Adding a level must not mutate A1 or create another hidden curriculum source.

## ADR-011 - Isolated Level Loading and Failure

**Status:** Accepted

**Decision:** Each level loads and validates independently. An A2 error is shown in Traditional Chinese and must not prevent A1 study, restoration, or progress access.

**Reason:** Pilot data has a higher change rate and must not destabilize the production course.

## ADR-012 - Multi-Level Progress v4

**Status:** Accepted

**Decision:** Progress schema v4 stores level records separately. Migration from v3 copies the complete A1 state without resetting IDs, schedules, familiarity, or completion, then initializes an empty A2 record.

**Reason:** A2 activity and curriculum changes must never corrupt established A1 learning history.

## ADR-013 - A2 Pilot Access Is Not Formal Unlock

**Status:** Accepted

**Decision:** Formal A2 access requires an A1 level pass. A local QA preview may temporarily display the pilot, but it never changes `passedLevelIds` or learner mastery.

**Reason:** Content review needs direct access without weakening the learner progression rule.

## ADR-014 - Related Vocabulary Is a Reference Tool

**Status:** Accepted

**Decision:** Related-vocabulary topics are versioned reference data, not a second curriculum. Opening, searching, filtering, or playing a word never increments attempts, completes lessons, marks mastery, or changes review intervals.

**Reason:** The page should help learners compare words without weakening the evidence required by the formal course.

## ADR-015 - Formal Curriculum Wins Lexeme Conflicts

**Status:** Accepted

**Decision:** When a lexeme exists in formal A1 and reference vocabulary, the complete formal record wins, including an intentionally pending audio field. Reference-only data may fill only lexemes absent from formal curriculum; conflicts fail validation.

**Reason:** Mixing individual fields from two records creates inconsistent pronunciation, meaning, QA, and licensing claims.

## ADR-016 - Related Vocabulary Reveals Only After Recall

**Status:** Accepted

**Decision:** The course shortcut appears only in a successfully answered A1 word-detail stage for a validated topic lexeme. It preserves the lesson, token index, and detail stage on return. The initial version 1 release enabled only days of the week and times of day.

**Reason:** This prevents answer leakage during recall or assessments while keeping topic comparison close to the learned word.

## ADR-017 - Months and Family Share One Review Batch

**Status:** Accepted

**Decision:** After explicit user approval, version 1 adds months and family members together as a second review batch. Existing formal A1 records remain authoritative, while all new gaps and their chunks stay reference-only or review-required until the user checks them. Other topics remain excluded.

**Reason:** The user prefers one combined content review, while the reference boundary prevents unreviewed vocabulary from being treated as completed curriculum.
