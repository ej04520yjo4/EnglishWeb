# Original sentence applications

The 60 `batch-NNN.json` files contain exactly 50 canonical targets each, in the
order of `public/data/vocabulary-targets-v2.json`. Each target has one original
English context sentence, Taiwan Chinese translation, actual target word form
and usage note. They are machine-assisted drafts, not copied dictionary examples.
License: CC-BY-SA-4.0. Human language, sense and difficulty review remains pending.

Edit a batch with the same stable `lexemeId`; never change target/course IDs to
make a check pass. Keep `targetForm` equal to the complete word actually used in
the sentence. Multiword meaning may be explained in `noteZhTw`, but the target
remains a canonical word. The source is independent guided practice, not a new
CEFR course or proof that every surrounding word has already been taught.

```powershell
npm run build:vocabulary-applications
npm run check:vocabulary-applications
npm run test:unit
```

The generator validates each batch, stamps stable exercise IDs and pending QA,
records normalized-LF source hashes and a content revision, then produces
`public/data/vocabulary-applications-v1.json` and `manifest.json`. CI reproduces
the output offline. Do not directly edit the generated runtime JSON.

Changing a source revision invalidates an open old-version question. Learning
history remains canonical and same-day first-attempt IDs do not reset just
because an editor changed a sentence.
