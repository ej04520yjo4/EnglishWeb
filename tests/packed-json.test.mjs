import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isPackedJson,
  packJson,
  PACKED_JSON_FORMAT,
  unpackJson,
} from "../app/packed-json.ts";
import { loadVocabularyTargets } from "../app/vocabulary-targets.ts";

const sample = {
  schemaVersion: 2,
  status: "count_complete_review_required",
  entries: [
    { lexemeId: "thumb", topics: ["general-vocabulary"], qaStatus: "pilot_review_required", priority: 1, optional: null },
    { lexemeId: "tire", topics: ["general-vocabulary", "health"], qaStatus: "pilot_review_required", priority: 2, optional: true },
  ],
  mixed: [{ a: 1 }, { b: 2 }, "text", 3],
  single: [{ only: "pilot_review_required" }],
  empty: [],
  nested: { deeper: [{ x: "repeat-me" }, { x: "repeat-me" }] },
};

test("restores the exact canonical value including key order", () => {
  const packed = packJson(sample);
  assert.equal(packed.format, PACKED_JSON_FORMAT);
  assert.equal(isPackedJson(packed), true);
  const restored = unpackJson(JSON.parse(JSON.stringify(packed)));
  assert.deepEqual(restored, sample);
  assert.equal(JSON.stringify(restored), JSON.stringify(sample));
});

test("stores repeated strings once", () => {
  const packed = packJson(sample);
  assert.ok(packed.strings.includes("pilot_review_required"));
  assert.ok(packed.strings.includes("general-vocabulary"));
  assert.equal(
    JSON.stringify(packed.data).includes("pilot_review_required"),
    false,
  );
});

test("passes canonical values through unchanged", () => {
  assert.equal(unpackJson(sample), sample);
  assert.equal(isPackedJson(sample), false);
});

test("rejects strings that collide with the reference marker", () => {
  assert.throws(() => packJson({ value: "§oops" }), /Cannot pack/);
  assert.throws(() => packJson({ "§key": 1 }), /Cannot pack/);
});

test("rejects references to missing strings", () => {
  assert.throws(
    () =>
      unpackJson({ format: PACKED_JSON_FORMAT, strings: [], data: "§z" }),
    /missing string/,
  );
});

test("loads the committed packed target file into the canonical catalog", async () => {
  const [canonicalText, packedText] = await Promise.all([
    readFile(new URL("../public/data/vocabulary-targets-v2.json", import.meta.url), "utf8"),
    readFile(new URL("../public/data/packed/vocabulary-targets-v2.json", import.meta.url), "utf8"),
  ]);
  assert.ok(packedText.length < canonicalText.length / 3);
  const loaded = await loadVocabularyTargets(
    async () => new Response(packedText, { status: 200 }),
  );
  assert.deepEqual(loaded, JSON.parse(canonicalText));
});
