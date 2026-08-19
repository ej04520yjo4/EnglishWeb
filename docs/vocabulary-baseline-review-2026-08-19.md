# 126-entry Vocabulary Baseline QA

## Review Scope

- Reviewed file: `public/data/vocabulary-targets-v1.json`
- Reviewed SHA-256: `c1342d65a8aa6f39cf5efa6e40ca5fc68cabf536e92af46dcd1ff122b6d4afc1`
- Total reviewed: 126
- Curriculum-covered: 100 active candidates
- Reference-only: 26 receptive candidates
- General-vocabulary exclusions confirmed: `amy`, `ben`
- Review date: 2026-08-19

This pass inspected every target ID, canonical lemma, source alias, capitalization, apostrophe/dash normalization, CEFR placement, mastery target, topic, curriculum/reference identity, source reference, license value, and QA status. It is a repository maintenance QA, not a claim of human language approval or legal clearance.

## Result Summary

| Result | Count | Meaning |
| --- | ---: | --- |
| Identity/normalization accepted | 126 | No duplicate target, alias collision, invalid capitalization, apostrophe, or dash issue found. |
| CEFR placement accepted for the current pilot | 126 | A1 everyday/function vocabulary and A2 unit vocabulary match the current staged curriculum. |
| Mastery target accepted | 126 | Curriculum items remain active; reference-only topic items remain receptive. |
| Topic and source classification accepted | 126 | 100 curriculum-covered and 26 reference-only identities are not mixed. |
| Needs source review | 26 | Reference-only entries cite only the internal reference file, not an external lexical/content source. |
| Needs license review | 126 | Curriculum rows use `pending`; reference rows describe Web Speech fallback rather than lexical-content licensing. |
| Needs human language/phonetic review | 26 | Reference-only Taiwan Chinese is plausible, but the related-vocabulary source still has blank KK/IPA and remains user-review-required. |
| Needs CEFR follow-up | 0 | No target-level change was justified by current repository evidence. |
| Rejected | 0 | No entry required removal or replacement. |
| Duplicates | 0 | `me -> i` is an intentional alias, not a second target. |

The target count remains 126. All entries remain `pilot_review_required`, and the file remains `partial_review_required`.

## Entry Findings

### Curriculum entries requiring license evidence (100)

Each item below has a valid internal occurrence reference, but at least one curriculum source reference still has `license: pending`. Identity, target level, mastery target, and topic were accepted; licensing was not.

- A1 (66): `i`, `be`, `my`, `name`, `nice`, `to`, `meet`, `you`, `from`, `taiwan`, `this`, `a`, `book`, `have`, `pen`, `that`, `bag`, `the`, `cellphone`, `on`, `table`, `she`, `wife`, `he`, `friend`, `two`, `brother`, `mother`, `at`, `home`, `an`, `apple`, `like`, `coffee`, `want`, `some`, `water`, `eat`, `breakfast`, `go`, `work`, `get`, `up`, `seven`, `play`, `badminton`, `watch`, `tv`, `night`, `it`, `eight`, `o'clock`, `today`, `monday`, `birthday`, `in`, `may`, `friday`, `store`, `near`, `station`, `bathroom`, `left`, `school`, `by`, `bus`.
- A2 (34): `last`, `yesterday`, `tomorrow`, `would`, `with`, `how`, `can`, `take`, `buy`, `train`, `ticket`, `leave`, `nine`, `morning`, `much`, `shirt`, `cheap`, `than`, `one`, `do`, `large`, `size`, `too`, `expensive`, `for`, `headache`, `should`, `drink`, `more`, `see`, `doctor`, `medicine`, `after`, `dinner`.

### Reference-only entries requiring source, license, and human language/phonetic review (26)

The following entries resolve correctly and are suitable receptive A1 topic candidates. Their `sourceName` points only to the project-authored reference file, while `license: not_applicable_web_speech_fallback` describes the temporary audio method rather than provenance for the lexical fields. They therefore remain `source_required`, `license_required`, and `review_required` in this review record:

- Days: `tuesday`, `wednesday`, `thursday`, `saturday`, `sunday`.
- Times of day: `noon`, `afternoon`, `evening`.
- Months: `january`, `february`, `march`, `april`, `june`, `july`, `august`, `september`, `october`, `november`, `december`.
- Family: `family`, `father`, `parent`, `sister`, `husband`, `son`, `daughter`.

## Normalization and Boundary Notes

- `I`, `TV`, `Taiwan`, weekdays, and months intentionally preserve display capitalization while target IDs remain lowercase.
- `o'clock` uses the normalized ASCII apostrophe; dash/apostrophe normalization produced no collisions.
- `me` is an A2 occurrence/source alias of canonical target `i`; it does not increase the target count.
- Inflected course answers such as `brothers`, `cheaper`, and `larger` continue to resolve to canonical lemmas `brother`, `cheap`, and `large`.
- Amy and Ben remain valid course exercise content but are excluded from the general 3000-word count.
- No A1/A2 curriculum sentence, stable ID, target count, or runtime level status changed during this QA.

## Follow-up Gate

Before promoting the baseline beyond `partial_review_required`:

1. Record a legally reusable lexical/content source and exact license/version for the 26 reference-only entries.
2. Resolve the 100 curriculum `license: pending` values with documented ownership or source terms.
3. Have the user manually review the 26 reference-only Traditional Chinese and their missing KK/IPA fields.
4. Rerun `npm run audit:vocabulary`, `npm run report:vocabulary`, and the complete shared verification gate.
