# Vocabulary Expansion Source Review

## Scope

Research for the next small batch, not a vocabulary import or legal clearance. The runtime still contains 132 target lexemes, including 24 reference-only targets. Existing licenses and review statuses are unchanged.

## Candidate Sources

- **Princeton WordNet 3.0**: preferred initial lemma/morphology cross-check. Its [official license](https://wordnet.princeton.edu/license-and-commercial-use) permits reuse and modification without a fee subject to retaining the copyright, terms, and disclaimer, and prohibits using the institution's name in advertising. Before importing, pin the actual release artifact and checksum and retain its full LICENSE. It is not a frequency ranking or CEFR curriculum.
- **wordfreq**: possible later frequency ordering aid. Its [NOTICE](https://raw.githubusercontent.com/rspeer/wordfreq/master/NOTICE.md) distinguishes Apache-licensed software from CC BY-SA 4.0 data and requires attribution to Robyn Speer and underlying sources. The [README](https://raw.githubusercontent.com/rspeer/wordfreq/master/README.md) describes a usage snapshot through approximately 2021. The inspected [project metadata](https://raw.githubusercontent.com/rspeer/wordfreq/master/pyproject.toml) says 3.2.0, but master URLs are mutable: this is not a pinned release artifact. Do not redistribute a bare frequency CSV without its attribution/share-alike obligations. This source is not imported in this round.

Neither source establishes Taiwan Chinese translations, KK/IPA accuracy, learner suitability, or CEFR placement. External source terms do not retroactively clear the provenance of existing content. No paid dictionary, protected dictionary list, audio file, or bulk corpus was copied.

## Next Import Gate

1. Pin a WordNet release archive and digest; preserve its source notice before deriving candidate data.
2. Prepare 50 practical candidate lemmas, not 2868 filler entries. Deduplicate against target IDs, lemmas, aliases, and inflections; keep chunks outside the lexeme count.
3. Write original Taiwan Chinese and contextual examples, record authorship and source identity, and keep `pilot_review_required`.
4. Review word difficulty and ambiguous meanings; separately verify any phonetics/audio. Do not invent human approval.
5. Validate a repeatable candidate importer and practice coverage before adding runtime targets. Leave formal A1/A2 sources and progress identities unchanged.

This review identifies a bounded starting point; the next batch, license bundle, pinned artifacts, and content review are still unfinished.
