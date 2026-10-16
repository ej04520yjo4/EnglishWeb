import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseVocabularyTargets } from "../app/vocabulary-targets.ts";
import { parseVocabularyApplications } from "../app/vocabulary-application.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = "data-sources/vocabulary-3000/applications";
const read = (name) => fs.readFileSync(path.join(root, name), "utf8").replace(/\r\n/g, "\n");
const targets = parseVocabularyTargets(JSON.parse(read("public/data/vocabulary-targets-v2.json")));
const files = fs.readdirSync(path.join(root, sourceDirectory)).filter((file) => /^batch-\d{3}\.json$/.test(file)).sort();
const sourceHashes = {};
const entries = files.flatMap((file) => {
  const source = `${sourceDirectory}/${file}`;
  const content = read(source);
  sourceHashes[file] = crypto.createHash("sha256").update(content).digest("hex");
  const rows = JSON.parse(content);
  if (!Array.isArray(rows)) throw new Error(`${source} 必須是題目陣列。`);
  const number = Number(file.match(/\d+/)[0]);
  const expected = targets.entries.slice((number - 1) * 50, number * 50).map((entry) => entry.lexemeId);
  if (rows.length !== 50 || JSON.stringify(rows.map((row) => row.lexemeId)) !== JSON.stringify(expected)) throw new Error(`${source} 必須依目標原順序包含完整 50 字，不可缺漏、重複或挪用其他批次。`);
  return rows.map((row) => ({ ...row, id: `vocab-application:${row.lexemeId}:01`, qaStatus: "pilot_review_required", sourceType: "original_content", sourceRef: `${source}#${row.lexemeId}` }));
});
const data = parseVocabularyApplications({
  schemaVersion: 1,
  sourceVersion: "vocabulary-applications-v1",
  sourceRevision: crypto.createHash("sha256").update(JSON.stringify(entries)).digest("hex"),
  coverage: entries.length === targets.entries.length ? "complete" : "partial",
  targetCount: targets.entries.length,
  license: "CC-BY-SA-4.0",
  attribution: "EnglishWeb original machine-assisted bilingual applications; human review pending.",
  entries,
}, targets);
const manifest = { sourceVersion: data.sourceVersion, targetCount: data.targetCount, applicationCount: data.entries.length, remainingGapCount: data.targetCount - data.entries.length, qaStatus: "pilot_review_required", sourceHashes };
for (const [file, value] of [["public/data/vocabulary-applications-v1.json", data], [`${sourceDirectory}/manifest.json`, manifest]]) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (read(file) !== content) throw new Error(`${file} 與原始句子批次不同，請重新產生。`);
  } else fs.writeFileSync(path.join(root, file), content);
}
console.log(`Sentence applications ${process.argv.includes("--check") ? "verified" : "generated"}: ${entries.length}/${targets.entries.length}; gaps ${manifest.remainingGapCount}; human review pending.`);
