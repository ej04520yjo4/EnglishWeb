# CMUdict pronunciation candidates

Source: CMU Pronouncing Dictionary, pinned revision
`74790861f652b15e4ac49015a90074ad62a27690` (2025-10-24).
The full source URL/hash and redistribution notice are recorded in
`source-manifest.json` and `public/licenses/vocabulary-3000/cmudict-license.txt`.
The tracked subset contains 3,627 source variants for all 3,000 canonical targets.
The subset hash normalizes CRLF to LF; the original full download hash does not.

```powershell
npm run fetch:vocabulary-phonetics
npm run build:vocabulary-phonetics
npm run check:vocabulary-phonetics
```

Default fetch verifies the offline subset only. An explicit
`npm run fetch:vocabulary-phonetics -- --refresh` verifies/downloads the pinned
full source into ignored `tmp/`; it does not silently upgrade the revision or
replace the tracked subset. Default build always uses the subset.

`arpabet-to-kk-v1.json` is an independently authored mapping of CMU's 39 base
phones, not a copied dictionary or GPL conversion implementation. The generator
preserves stress digits and all source alternatives. It derives KK and US IPA,
using explicit candidate onset clusters for stress placement. CMUdict supplies
neither contextual part-of-speech selection nor authoritative syllable boundaries.

All strings are `derived_review_required`; 559 multivariant words also need
contextual selection. No candidate is human-approved, no audio is generated,
and existing KK-symbol recordings/course audio statuses are unchanged.
