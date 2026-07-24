import type { LearningToken, Lesson } from "./course-data";

export const OFFICIAL_A1_MVP_CSV_URL =
  "/data/A1課程內容_QA_corrected_v3.csv";
export const PILOT_LESSON_ID = "a1-u1-l1";

type CsvRow = Record<string, string>;

const parseCsvMatrix = (csvText: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = csvText.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value !== ""));
};

export const parseA1MvpCsv = (csvText: string): CsvRow[] => {
  const matrix = parseCsvMatrix(csvText);
  const headers = matrix[0] ?? [];
  if (headers[0] !== "level") {
    throw new Error("A1 MVP CSV 的第一個欄位必須是 level。");
  }
  return matrix.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
};

const numberValue = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const tokenFromRow = (row: CsvRow): LearningToken => ({
  id: row.occurrence_id,
  occurrenceId: row.occurrence_id,
  tokenId: row.token_id,
  answer: row.answer,
  prompt: row.prompt,
  promptType: row.prompt_type as LearningToken["promptType"],
  partOfSpeech: row.context_pos,
  dictionaryPos: row.dictionary_pos,
  contextPos: row.context_pos,
  semanticRole: row.semanticRole,
  lexemeId: row.lexeme_id,
  senseId: row.sense_id,
  kk: row.kk_us,
  ipa: row.ipa_standalone || row.ipa_us,
  ipaStandalone: row.ipa_standalone,
  ipaInSentence: row.ipa_in_sentence,
  syllables: row.display_syllables || row.syllables,
  stress: row.stress_syllable,
  lemma: row.lemma,
  note: row.note,
  chunk: row.chunk_id
    ? {
        id: row.chunk_id,
        text: row.chunk_text,
        translation: row.chunk_translation,
        order: numberValue(row.chunk_order, 0),
        note: row.chunk_note,
      }
    : undefined,
  audioStatus: row.audio_status as LearningToken["audioStatus"],
  wordAudioSource: row.word_audio_source,
});

export const buildPilotLessonFromRows = (allRows: CsvRow[]): Lesson => {
  const rows = allRows
    .filter((row) => row.lesson_id === PILOT_LESSON_ID)
    .sort((left, right) => numberValue(left.token_order, 0) - numberValue(right.token_order, 0));

  if (rows.length === 0) {
    throw new Error("A1 MVP CSV 找不到單元 1 第 1 課。");
  }
  if (rows.some((row) => !/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer))) {
    throw new Error("A1 單元 1 第 1 課必須維持逐字作答。");
  }

  const first = rows[0];
  const reconstructed = `${rows.map((row) => row.answer).join(" ")}.`;
  if (reconstructed !== first.sentence) {
    throw new Error("第一課 token 無法還原完整句子。");
  }

  const required = [
    "context_pos",
    "prompt",
    "prompt_type",
    "lexeme_id",
    "sense_id",
    "sentence_pattern_id",
    "passage_id",
  ];
  if (rows.some((row) => required.some((field) => !row[field]))) {
    throw new Error("第一課缺少前端學習流程需要的 v3 欄位。");
  }

  return {
    id: first.lesson_id,
    number: 1,
    title: first.lesson_title,
    sentence: first.sentence,
    translation: first.translation,
    grammar: first.grammar,
    minutes: Math.max(4, Math.ceil(rows.length * 1.25)),
    tokens: rows.map(tokenFromRow),
    passageId: first.passage_id,
    passageOrder: numberValue(first.passage_order, 1),
    sentenceId: first.sentence_id,
    sentenceOrder: numberValue(first.sentence_order, 1),
    sentencePatternId: first.sentence_pattern_id,
    patternName: first.pattern_name,
    patternCefr: first.pattern_cefr,
    sentenceAudioSource: first.sentence_audio_source,
    audioStatus: first.audio_status as Lesson["audioStatus"],
    sourceVersion: "A1課程內容_QA_corrected_v3.csv",
  };
};

export const loadPilotLesson = async (
  fetcher: typeof fetch = fetch,
): Promise<Lesson> => {
  const response = await fetcher(OFFICIAL_A1_MVP_CSV_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`A1 MVP CSV 載入失敗（${response.status}）。`);
  }
  return buildPilotLessonFromRows(parseA1MvpCsv(await response.text()));
};
