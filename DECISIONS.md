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

**Decision:** `public/data/course-catalog.json` declares each CEFR level, source files, version, expected counts, and release status. A1 remains production on v3, A2 is the only runtime v1 pilot, and B1/B2 v1 sources are retained with `disabled` status for direct audit only.

**Reason:** Adding a level must not mutate A1 or create another hidden curriculum source.

## ADR-011 - Isolated Level Loading and Failure

**Status:** Accepted

**Decision:** Each level loads and validates independently. An advanced-level error is shown in Traditional Chinese and must not prevent A1 study, restoration, or progress access. A dependent pilot does not load when its prerequisite source is invalid.

**Reason:** Pilot data has a higher change rate and must not destabilize the production course.

## ADR-012 - Multi-Level Progress v6

**Status:** Accepted

**Decision:** Progress schema v6 stores A1, A2, B1, and B2 course records separately and adds top-level `vocabularyProgress` keyed by canonical lexeme. Migration from v3 preserves A1, v4 preserves A1/A2, and v5 preserves all levels; legacy records initialize empty global vocabulary evidence and do not invent mastery.

**Reason:** Activity or curriculum changes at one level must never corrupt established progress at another level.

## ADR-013 - Advanced Pilot Access Is Not Formal Unlock

**Status:** Accepted

**Decision:** Formal access follows prerequisites, but only catalog entries marked `production` or `pilot` can load. `showAdvancedPilots` currently exposes A2 QA only and never changes `passedLevelIds`; old `showA2Pilot` settings remain readable, while new exports write only `showAdvancedPilots`. A preview flag can never bypass `disabled`.

**Reason:** Content review needs direct access without weakening the learner progression rule.

## ADR-014 - Related Vocabulary Is a Reference Tool

**Status:** Accepted

**Decision:** Related-vocabulary topics are versioned reference data, not a second curriculum. Search, filtering, scrolling, and audio never create learning evidence. Explicitly opening an item detail records only global exposure; it never records recognition, spelling, application, course completion, accuracy, passed IDs, or review changes.

**Reason:** The page should help learners compare words without weakening the evidence required by the formal course.

## ADR-015 - Formal Curriculum Wins Lexeme Conflicts

**Status:** Accepted

**Decision:** When a lexeme exists in formal A1 and reference vocabulary, formal A1 remains authoritative for progress, occurrences, audio, phonetics, licensing, and source identity. Reference-only data may fill only lexemes absent from formal curriculum; conflicts fail validation. Related-vocabulary display labels follow the canonical projection in ADR-018.

**Reason:** This prevents unreviewed reference fields from replacing formal learning evidence while allowing a classification page to show a stable dictionary form.

## ADR-016 - Related Vocabulary Reveals Only After Recall

**Status:** Accepted

**Decision:** The course shortcut appears only in a successfully answered A1 word-detail stage for a validated topic lexeme. It preserves the lesson, token index, and detail stage on return. The initial version 1 release enabled only days of the week and times of day.

**Reason:** This prevents answer leakage during recall or assessments while keeping topic comparison close to the learned word.

## ADR-017 - Months and Family Share One Review Batch

**Status:** Accepted

**Decision:** 月份與家庭成員目前作為第二批試行內容，仍待使用者人工複核。Existing formal A1 records remain authoritative, while all new gaps and their chunks stay reference-only or review-required. Other topics remain excluded.

**Reason:** The reference boundary prevents trial vocabulary from being treated as reviewed or completed curriculum.

## ADR-018 - Related Vocabulary Uses Canonical Display Forms

**Status:** Accepted

**Decision:** Related-vocabulary cards display the lexeme lemma, while course recall and assessment continue to use the occurrence `answer`. A group item may provide `canonicalTranslationZhTw` when a formal prompt is inflected or context-specific. This display projection never replaces formal progress, occurrence, audio, or source records.

**Reason:** Classification labels must remain consistent with their chunks without weakening the sentence-specific course model or adding lexeme-specific code branches.

## ADR-019 - A2 Expands by Reviewed Pilot Unit

**Status:** Accepted

**Decision:** A2 units 2–4 extend the existing v1 pilot source. Every row and new exercise remains `pilot_review_required`; units 5–10 stay blueprint-only until manual review authorizes another batch.

**Reason:** A single level source preserves stable IDs and progress while staged review limits unverified language content.

## ADR-020 - Current A2 Pilot Completion Is Not a Level Pass

**Status:** Accepted

**Decision:** Completing or passing all currently available A2 pilot units displays `你已完成目前的A2試行內容`. It does not set A2 `levelPassed`, add A2 to `passedLevelIds`, run an A2 level assessment, or unlock B1.

**Reason:** Four pilot units do not represent the full CEFR A2 scope.

## ADR-021 - New A2 Transfers Declare Actual Slot Values

**Status:** Accepted

**Decision:** New transfer examples declare ordered `slotValues`. Validation checks that each slot uses only its own allowed lexemes and chunks and that the ordered values rebuild the displayed sentence.

**Reason:** Aggregate allowlists could accept a learned word in the wrong grammatical position.

## ADR-022 - A2 Inflections Reuse Lemmas and Health Content Stays Educational

**Status:** Accepted

**Decision:** Inflected A2 answers reuse dictionary-form `lexeme_id` values such as `buy`, `leave`, `cheap`, and `large`. Health lessons teach general language only and must not diagnose illness, prescribe doses, or provide medical treatment advice.

**Reason:** Stable lexical identity prevents duplicate progress records, while a strict educational boundary keeps the health unit safe and in scope.

## ADR-023 - Passage Options Keep Strings with Optional Prerequisite Metadata

**Status:** Accepted

**Decision:** Passage comprehension continues to expose `options` as strings. New A2 passage questions add matching `optionMetadata` entries with required lexemes and chunks, while legacy A1 passages may omit the metadata.

**Reason:** The UI and A1 data remain backward compatible, and validation can still prevent a new distractor from introducing content taught only in a later lesson or unit.

## ADR-024 - Browser Fixtures Precede Application Hydration

**Status:** Accepted

**Decision:** Playwright fixtures that require saved settings or progress use `page.addInitScript` before navigation. They initialize only missing storage keys so that later navigation and reload preserve progress created by the test. Browser flows wait for observable level and course-map UI states instead of fixed delays.

**Reason:** Writing storage after an initial page load races React hydration on slower mobile CI workers, while reapplying the fixture on every navigation can erase the progress being tested.

## ADR-025 - B1 and B2 Sources Are Retained but Runtime Disabled

**Status:** Accepted

**Decision:** B1 and B2 each retain one catalog-declared v1 CSV plus pattern and reading JSON. Every row and exercise remains `pilot_review_required`, both catalog entries are `disabled`, startup does not fetch them, and general selectors or advanced preview cannot open them. Direct validators and generators continue to protect the data.

**Reason:** Retaining the audited sources preserves prior work while preventing unreviewed language from appearing as an available learner route.

## ADR-026 - Project Data Audit Protects Single Sources

**Status:** Accepted

**Decision:** `npm run audit:project` fails on catalog-orphaned curriculum files, identical duplicate data files, cross-level structural ID collisions, unsafe duplicate sentences, generator dictionary key collisions, or tracked build/test artifacts. A repeated lesson sentence is allowed only when the later rows explicitly mark it as review content.

**Reason:** Lint and TypeScript do not detect silent object-key replacement or redundant static data, while legitimate A1 review repetition must not be deleted as accidental duplication.

## ADR-027 - Canonical A1/A2 Vocabulary Target Contract

**Status:** Accepted

**Decision:** `public/data/vocabulary-targets-v1.json` defines cumulative A1/A2 goals using canonical single-word lexemes: A1 1200 (700 active, 500 receptive) and A2 3000 cumulative (1500 active, 1500 receptive). Occurrences, word forms, senses, and chunks never add separate target counts. The file remains `partial_review_required` until every entry is sourced and reviewed.

**Reason:** A stable vocabulary contract prevents inflated counts and separates the long-term target from current course size.

## ADR-028 - Vocabulary Mastery Requires Cross-Date Evidence

**Status:** Accepted

**Decision:** Global mastery uses stable evidence IDs shared across A1/A2. Exposure needs an explicit course/reference detail; receptive needs two correct recognition records on two dates; active also needs two clean spelling records on two dates and one correct application. Revealed or pasted spellings never count as clean spelling evidence.

**Reason:** Seeing a card or completing one assisted attempt is not durable recall or productive ability.

## ADR-029 - Vocabulary Expansion Is Sourced and Batched

**Status:** Accepted

**Decision:** The baseline contains only current A1/A2 curriculum and reference vocabulary. Future additions must arrive in small deduplicated batches with source version, reference, license, topic, target level, mastery target, and QA state. The project will not copy protected lists or generate filler entries to reach 3000.

**Reason:** Legal provenance and human language review are product requirements, not cleanup work after bulk generation.

## ADR-030 - Study Dates Use the Learner's Local Calendar Day

**Status:** Accepted

**Decision:** ISO timestamps continue to record exact instants, but course study days and new vocabulary evidence dates use `localDateKey()` from device-local year, month, and day. Each new evidence record preserves its local date in `evidenceStudyDates`; existing dates are never recomputed after import or timezone changes.

**Reason:** UTC slicing assigns early Taiwan-morning study to the previous day and can corrupt cross-date mastery evidence. Preserving the date at creation keeps backup/import behavior stable without schema v7.

## ADR-031 - Daily Session Persistence Is an Isolated Temporary Record

**Status:** Accepted

**Decision:** Active Daily Learning position is stored in versioned key `yingju-daily-session-v3`, restored only when its local date equals today, and removed after the summary is completed or when stale/invalid. The record binds `lessonId` to its originating CEFR `level` and stores stable review/weakness queue identity, completed IDs, hint-safety state, and active-time fields. Remaining work is derived from IDs rather than transient array indexes. Restore must find the exact lesson in that level and must never fall back to another course. Legacy v1/v2 session records are discarded. The record sequences UI work but does not replace scores, evidence, or progress schema v6.

**Reason:** F5 should not discard the learner's place, but resuming UI position must never become a second progress truth source or invent learning results.

## ADR-032 - Local and CI Quality Gates Share One Command

**Status:** Accepted

**Decision:** `npm run verify` owns context checks, project and vocabulary audits/report, curriculum validation, build, unit, lint, and TypeScript. `npm test` adds Playwright. GitHub's quality job calls `verify`, while its dependent Playwright job remains separate for browser setup and artifacts.

**Reason:** One maintained command prevents local documentation and GitHub Actions from silently enforcing different release standards.

## ADR-033 - Current Week Uses the Learner's Local Monday-to-Sunday Calendar

**Status:** Accepted

**Decision:** The learner-facing “本週學習” count uses unique study-date keys from the currently selected CEFR level that fall inside the device-local Monday-to-Sunday week containing today. It is not a rolling last-seven-record count and does not combine global vocabulary evidence dates.

**Reason:** A calendar-week label must exclude older and future-week activity, remain stable around UTC/Taiwan date boundaries, and agree everywhere it is displayed.

## ADR-034 - Daily Sessions Expire at the Device-Local Midnight Boundary

**Status:** Accepted

**Decision:** Every Daily Learning resume, answer, continue, and finish path reuses `isDailySessionCurrentDay()` before writing evidence or completion. A stale record is removed and returns to the home page; its lesson, completed review/weakness IDs, and time are never migrated to the new day.

**Reason:** Hydration-only validation cannot protect a page left open across midnight. A Daily Session belongs to one local calendar day and must fail closed before any learning side effect.

## ADR-035 - Daily Time Measures Visible Active Learning Segments

**Status:** Accepted

**Decision:** Temporary Daily Session v3 accumulates `activeStudySeconds` only while a Daily review, its exact lesson, or Daily weakness practice is visible. `visibilitychange` and `pagehide` flush the current segment; restore always starts a fresh segment. User interactions checkpoint at most every 15 seconds, and each uninterrupted segment contributes at most five minutes. Home, summary, hidden, closed, sleeping, and offline time do not count.

**Reason:** This deliberately simple estimate reflects actual learning far better than wall-clock time while avoiding invasive activity surveillance. The cap prevents a forgotten visible page from becoming hours of false study time.

## ADR-036 - Daily Review Is an Evidence-Backed Active Queue

**Status:** Accepted

**Decision:** `buildDailyReviewQueue()` selects at most five due formal occurrences in deterministic order, deduplicates canonical lexemes, prioritizes the strongest existing evidence weakness, and otherwise rotates spelling, recognition, and safe formal-sentence application. The temporary session stores only stable queue identity, completion IDs, attempts, reveal state, and paste state; answers are resolved from authoritative curriculum data. Attempts and correct results use the existing global vocabulary evidence and review schedule, not a second mastery model.

**Reason:** Daily review must require a learner response, survive F5 without duplicate credit, preserve clean-spelling safeguards, and remain consistent with the site's cross-level evidence and mastery rules.
