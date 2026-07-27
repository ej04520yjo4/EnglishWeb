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
