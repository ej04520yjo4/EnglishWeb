import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(
  root,
  "data-sources",
  "vocabulary-3000",
  "phonetics",
  "source-manifest.json",
);
const mappingPath = path.join(
  root,
  "data-sources",
  "vocabulary-3000",
  "phonetics",
  "arpabet-to-kk-v1.json",
);
const targetsPath = path.join(root, "public", "data", "vocabulary-targets-v2.json");
const defaultOutputPath = path.join(
  root,
  "public",
  "data",
  "vocabulary-phonetics-v1.json",
);

const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const checkOnly = args.includes("--check");
const outputPath = path.resolve(root, valueAfter("--output") ?? defaultOutputPath);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const mapping = JSON.parse(await readFile(mappingPath, "utf8"));
const targets = JSON.parse(await readFile(targetsPath, "utf8"));
const explicitSource = valueAfter("--source");
const sourcePath = path.resolve(root, explicitSource ?? manifest.snapshotFile);
const snapshotPath = path.resolve(root, manifest.snapshotFile);
const sourceIsSnapshot = sourcePath === snapshotPath;

const fail = (message) => {
  throw new Error(`詞彙發音候選產生失敗：${message}`);
};

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

if (!isRecord(manifest) || manifest.schemaVersion !== 1) {
  fail("source-manifest.json schemaVersion 必須是 1。");
}
if (!isRecord(mapping) || mapping.schemaVersion !== 1) {
  fail("arpabet-to-kk-v1.json schemaVersion 必須是 1。");
}
if (mapping.status !== "derived_review_required") {
  fail("KK mapping 必須維持 derived_review_required。");
}
const expectedCmuPhones = [
  "AA", "AE", "AH", "AO", "AW", "AY", "B", "CH", "D", "DH", "EH", "ER",
  "EY", "F", "G", "HH", "IH", "IY", "JH", "K", "L", "M", "N", "NG",
  "OW", "OY", "P", "R", "S", "SH", "T", "TH", "UH", "UW", "V", "W",
  "Y", "Z", "ZH",
];
if (
  !isRecord(mapping.phones) ||
  Object.keys(mapping.phones).length !== expectedCmuPhones.length ||
  expectedCmuPhones.some((phone) =>
    !Object.prototype.hasOwnProperty.call(mapping.phones, phone),
  )
) {
  fail("KK mapping 必須包含完整 39 個 CMUdict ARPAbet base phone。");
}
if (!isRecord(targets) || !Array.isArray(targets.entries)) {
  fail("vocabulary-targets-v2.json 缺少 entries。");
}
if (targets.entries.length !== manifest.targetCount) {
  fail(`target 數量必須是 ${manifest.targetCount}，實際為 ${targets.entries.length}。`);
}

const targetIds = new Set();
const targetLemmas = new Set();
for (const target of targets.entries) {
  if (!isRecord(target) || typeof target.lexemeId !== "string" || typeof target.lemma !== "string") {
    fail("每個 target 必須有 lexemeId 與 lemma 字串。");
  }
  if (targetIds.has(target.lexemeId)) {
    fail(`target lexemeId 重複：${target.lexemeId}。`);
  }
  targetIds.add(target.lexemeId);
  targetLemmas.add(target.lemma.toLowerCase());
}

const rawBytes = await readFile(sourcePath);
const bytes = sourceIsSnapshot
  ? Buffer.from(rawBytes.toString("utf8").replaceAll("\r\n", "\n"), "utf8")
  : rawBytes;
const sourceHash = createHash("sha256").update(bytes).digest("hex").toUpperCase();
const expectedHash = sourceIsSnapshot ? manifest.snapshotSha256 : manifest.sourceSha256;
const expectedBytes = sourceIsSnapshot ? manifest.snapshotBytes : manifest.sourceBytes;
const expectedLines = sourceIsSnapshot ? manifest.snapshotLineCount : manifest.sourceLineCount;
if (sourceHash !== String(expectedHash).toUpperCase()) {
  fail(`CMUdict input SHA-256 不符合 manifest（${sourceHash}）。`);
}
if (bytes.byteLength !== expectedBytes) {
  fail(`CMUdict input 大小不符合 manifest（${bytes.byteLength} bytes）。`);
}

const phoneBase = (phone) => phone.replace(/[012]$/, "");
const variantSuffix = /^(.*)\((\d+)\)$/;
const sourceVariants = new Map();
let parsedLineCount = 0;
const sourceText = bytes.toString("utf8");
const lines = sourceText.split("\n");
const sourceLineCount = lines.length - (sourceText.endsWith("\n") ? 1 : 0);
if (sourceLineCount !== expectedLines) {
  fail(`CMUdict input 行數不符合 manifest：預期 ${expectedLines}，實際 ${sourceLineCount}。`);
}
for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line || line.startsWith(";;;") || line.startsWith("#")) continue;
  const fields = line.split(/\s+/);
  if (fields.length < 2) {
    fail(`CMUdict 行格式錯誤：${line}`);
  }
  const sourceEntry = fields.shift();
  const commentIndex = fields.indexOf("#");
  if (commentIndex >= 0) fields.splice(commentIndex);
  if (fields.length === 0) {
    fail(`CMUdict 行缺少 pronunciation：${line}`);
  }
  const arpabetTokens = fields;
  const suffixMatch = sourceEntry.match(variantSuffix);
  const baseSourceWord = (suffixMatch ? suffixMatch[1] : sourceEntry).toLowerCase();
  const variantIndex = suffixMatch ? Number(suffixMatch[2]) : 1;
  if (!baseSourceWord || !Number.isInteger(variantIndex) || variantIndex < 1) {
    fail(`CMUdict variant 格式錯誤：${sourceEntry}`);
  }
  const phones = [];
  for (const token of arpabetTokens) {
    const base = phoneBase(token);
    if (!Object.prototype.hasOwnProperty.call(mapping.phones, base)) {
      fail(`CMUdict 出現未收錄 phone ${token}（${sourceEntry}）。`);
    }
    const suffix = token.slice(base.length);
    if (mapping.phones[base].type === "vowel") {
      if (!/^[012]$/.test(suffix)) {
        fail(`母音 phone 缺少 0/1/2 stress：${token}（${sourceEntry}）。`);
      }
    } else if (suffix !== "") {
      fail(`子音 phone 不可帶 stress：${token}（${sourceEntry}）。`);
    }
    phones.push({ token, base, stress: suffix || null });
  }
  const variants = sourceVariants.get(baseSourceWord) ?? [];
  if (variants.some((variant) => variant.variantIndex === variantIndex)) {
    fail(`CMUdict 出現重複 pronunciation variant：${sourceEntry}。`);
  }
  variants.push({ sourceEntry, variantIndex, phones, arpabet: arpabetTokens.join(" ") });
  sourceVariants.set(baseSourceWord, variants);
  parsedLineCount += 1;
}

if (sourceIsSnapshot) {
  if (parsedLineCount !== manifest.snapshotVariantCount) {
    fail(
      `target snapshot pronunciation variant 數量必須是 ${manifest.snapshotVariantCount}，實際為 ${parsedLineCount}。`,
    );
  }
  for (const sourceWord of sourceVariants.keys()) {
    if (!targetLemmas.has(sourceWord)) {
      fail(`target snapshot 含有非目標 lemma：${sourceWord}。`);
    }
  }
  for (const targetLemma of targetLemmas) {
    if (!sourceVariants.has(targetLemma)) {
      fail(`target snapshot 缺少目標 lemma：${targetLemma}。`);
    }
  }
}

const stressMarks = mapping.stressMarks;
const overrides = mapping.unstressedOverrides;
const stressPlacementNote =
  "候選：以 CMUdict 母音核與合法起始音節尾端規則推導；重讀後 R/L 暫保留為前一音節尾音，需人工複核。";
// Do not treat every CMU consonant as a legal English onset.  In particular,
// NG/ZH are not productive word-initial onsets in this learner-facing
// heuristic.  A cluster is accepted only when its complete suffix is in this
// explicit candidate inventory; otherwise the stress mark stays before the
// vowel rather than displaying a known-invalid onset.
const legalOnsetSingles = new Set([
  "B", "CH", "D", "DH", "F", "G", "HH", "JH", "K", "L", "M", "N",
  "P", "R", "S", "SH", "T", "TH", "V", "W", "Y", "Z",
]);
const legalOnsetClusters = new Set([
  ...legalOnsetSingles,
  "P R", "P L", "T R", "K R", "K L", "G R", "G L", "B R", "B L", "D R",
  "F R", "F L", "TH R", "SH R", "S P", "S T", "S K", "S M", "S N", "S W", "S L",
  "S P R", "S T R", "S K R", "S P L", "S K L", "S K W",
  "P Y", "B Y", "K Y", "G Y", "F Y", "V Y", "M Y", "N Y", "HH Y", "L Y", "S Y",
]);
const findMaximalLegalOnsetStart = (clusterBases) => {
  for (let suffixStart = 0; suffixStart < clusterBases.length; suffixStart += 1) {
    const suffix = clusterBases.slice(suffixStart).join(" ");
    if (legalOnsetClusters.has(suffix)) return suffixStart;
  }
  return clusterBases.length;
};
const deriveSyllableLayout = (variant) => {
  const vowelPositions = variant.phones
    .map((phone, index) =>
      mapping.phones[phone.base].type === "vowel" ? index : -1,
    )
    .filter((index) => index >= 0);
  const onsetStarts = new Map();
  const stressSyllableIndexes = [];
  vowelPositions.forEach((vowelPosition, syllableOffset) => {
    const previousVowelPosition = vowelPositions[syllableOffset - 1];
    let clusterStart = previousVowelPosition === undefined
      ? 0
      : previousVowelPosition + 1;
    const previousVowel = previousVowelPosition === undefined
      ? undefined
      : variant.phones[previousVowelPosition];
    const intervening = variant.phones.slice(clusterStart, vowelPosition);
    // Candidate maximal-onset rule: R/L after a stressed vowel are retained
    // as a coda before assigning the remaining consonants to the next onset.
    if (
      previousVowel &&
      previousVowel.stress !== "0" &&
      intervening.length > 0 &&
      (intervening[0].base === "R" || intervening[0].base === "L")
    ) {
      clusterStart += 1;
    }
    const clusterBases = variant.phones
      .slice(clusterStart, vowelPosition)
      .map((phone) => phone.base);
    const onsetStart = clusterStart + findMaximalLegalOnsetStart(clusterBases);
    onsetStarts.set(vowelPosition, onsetStart);
    if (variant.phones[vowelPosition].stress === "1" || variant.phones[vowelPosition].stress === "2") {
      stressSyllableIndexes.push(syllableOffset + 1);
    }
  });
  const stressByPhoneIndex = new Map();
  if (vowelPositions.length > 1) {
    vowelPositions.forEach((vowelPosition) => {
      const stress = variant.phones[vowelPosition].stress;
      if (stress === "1" || stress === "2") {
        stressByPhoneIndex.set(onsetStarts.get(vowelPosition), stressMarks[stress]);
      }
    });
  }
  return {
    syllableCount: vowelPositions.length,
    stressSyllableIndexes,
    stressByPhoneIndex,
    syllabificationStatus: "heuristic_candidate",
    stressPlacementStatus: "heuristic_candidate",
  };
};
const renderCandidates = (variant) => {
  const layout = deriveSyllableLayout(variant);
  let ipa = "";
  let kk = "";
  variant.phones.forEach((phone, index) => {
    const descriptor = mapping.phones[phone.base];
    const override = phone.stress === "0" ? overrides?.[phone.base] : undefined;
    const ipaPhone = override?.ipa ?? descriptor.ipa;
    const kkPhone = override?.kk ?? descriptor.kk;
    const stress = layout.stressByPhoneIndex.get(index) ?? "";
    ipa += `${stress}${ipaPhone}`;
    kk += `${stress}${kkPhone}`;
  });
  return {
    ipaCandidate: `/${ipa}/`,
    kkCandidate: `/${kk}/`,
    syllableCount: layout.syllableCount,
    stressSyllableIndexes: layout.stressSyllableIndexes,
    syllabificationStatus: layout.syllabificationStatus,
    stressPlacementStatus: layout.stressPlacementStatus,
    stressPlacementNote,
  };
};

const outputEntries = [];
let missingCount = 0;
let variantCount = 0;
for (const target of targets.entries) {
  const lookup = String(target.lemma).toLowerCase();
  const variants = sourceVariants.get(lookup);
  if (!variants || variants.length === 0) {
    missingCount += 1;
    continue;
  }
  variants.sort((left, right) => left.variantIndex - right.variantIndex);
  variants.forEach((variant, index) => {
    if (variant.variantIndex !== index + 1) {
      fail(`${target.lexemeId} 的 CMUdict variant 不連續：${variant.variantIndex}。`);
    }
  });
  variantCount += variants.length;
  outputEntries.push({
    lexemeId: target.lexemeId,
    lemma: target.lemma,
    status: variants.length === 1 ? "derived_review_required" : "variant_review_required",
    variants: variants.map((variant) => ({
      variantIndex: variant.variantIndex,
      sourceEntry: variant.sourceEntry,
      arpabet: variant.arpabet,
      ...renderCandidates(variant),
      candidateStatus: "derived_review_required",
      selectionStatus: "not_selected",
    })),
  });
}

if (missingCount !== manifest.missingTargetCount) {
  fail(`target missing 數量為 ${missingCount}，manifest 預期 ${manifest.missingTargetCount}。`);
}
if (outputEntries.length !== targets.entries.length) {
  fail(`輸出 entry 數量為 ${outputEntries.length}，預期 ${targets.entries.length}。`);
}

const output = {
  schemaVersion: 1,
  sourceVersion: manifest.sourceVersion,
  sourceRevision: manifest.sourceRevision,
  sourceFile: manifest.sourceFile,
  sourceSha256: manifest.sourceSha256,
  inputSourceFile: sourceIsSnapshot ? manifest.snapshotFile : manifest.sourceFile,
  inputSourceSha256: sourceHash,
  sourceSnapshotFile: manifest.snapshotFile,
  sourceSnapshotSha256: manifest.snapshotSha256,
  mappingId: mapping.mappingId,
  mappingStatus: "derived_review_required",
  candidateStatus: "pilot_review_required",
  phoneticQaStatus: "candidate_only",
  audioStatus: "unchanged",
  stressPolicy:
    "monosyllables_unmarked; multisyllables_maximal_onset_candidate_with_r_l_coda_candidate",
  targetCount: outputEntries.length,
  missingCount,
  parsedSourceEntryCount: parsedLineCount,
  pronunciationVariantCount: variantCount,
  entries: outputEntries,
};
const rendered = `${JSON.stringify(output, null, 2)}\n`;

if (checkOnly) {
  const current = await readFile(outputPath, "utf8");
  if (current.replaceAll("\r\n", "\n") !== rendered) {
    fail(`${path.relative(root, outputPath)} 與可重現產出不同，請重新執行 build。`);
  }
  console.log(`vocabulary phonetics build check passed：${path.relative(root, outputPath)}`);
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered, "utf8");
  console.log(`已產生 ${path.relative(root, outputPath)}`);
  console.log(`target=${output.targetCount} missing=${output.missingCount} variants=${output.pronunciationVariantCount}`);
}
