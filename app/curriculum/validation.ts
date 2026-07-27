import type {
  AudioStatus,
  CourseUnit,
  LearningToken,
  Lesson,
} from "../course-data";
import type {
  CefrLevel,
  CourseCsvRow,
  CourseValidationReport,
} from "./types";

export const COURSE_CSV_HEADERS = [
  "level",
  "unit_id",
  "unit_title",
  "passage_id",
  "passage_order",
  "sentence_id",
  "sentence_order",
  "sentence_pattern_id",
  "pattern_name",
  "pattern_cefr",
  "is_new_sentence_pattern",
  "lesson_id",
  "lesson_title",
  "sentence",
  "translation",
  "grammar",
  "occurrence_id",
  "token_order",
  "token_id",
  "lexeme_id",
  "sense_id",
  "type",
  "answer",
  "lemma",
  "prompt",
  "prompt_type",
  "partOfSpeech",
  "dictionary_pos",
  "context_pos",
  "semanticRole",
  "chunk_id",
  "chunk_text",
  "chunk_translation",
  "chunk_order",
  "chunk_note",
  "pattern_id",
  "kk_us",
  "ipa_us",
  "ipa_standalone",
  "ipa_in_sentence",
  "kk",
  "ipa",
  "syllables",
  "stress_syllable",
  "display_syllables",
  "note",
  "audio_method",
  "audio_status",
  "word_audio_source",
  "audio_source",
  "sentence_audio_source",
  "license",
  "is_new_word",
  "is_new_pattern",
  "is_new_combination",
  "is_new_content",
  "qa_status",
] as const;

const REQUIRED_ROW_FIELDS = [
  "level",
  "unit_id",
  "unit_title",
  "passage_id",
  "passage_order",
  "sentence_id",
  "sentence_order",
  "sentence_pattern_id",
  "pattern_name",
  "pattern_cefr",
  "lesson_id",
  "lesson_title",
  "sentence",
  "translation",
  "grammar",
  "occurrence_id",
  "token_order",
  "token_id",
  "lexeme_id",
  "sense_id",
  "answer",
  "lemma",
  "prompt",
  "prompt_type",
  "dictionary_pos",
  "context_pos",
  "audio_status",
  "qa_status",
] as const;

export type CourseValidationOptions = {
  expectedLevel?: CefrLevel;
  expectedRows?: number;
  expectedUnits?: number;
  expectedLessons?: number;
  sourceVersion?: string;
  rejectProductionQaForPilot?: boolean;
};

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
  if (quoted) {
    throw new Error("CSV 含有未關閉的雙引號。");
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value !== ""));
};

export const parseCourseCsv = (csvText: string): CourseCsvRow[] => {
  const matrix = parseCsvMatrix(csvText);
  const headers = matrix[0] ?? [];
  if (headers[0] !== "level") {
    throw new Error("課程 CSV 的第一個欄位必須是 level。");
  }
  const missingHeaders = COURSE_CSV_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missingHeaders.length) {
    throw new Error(`課程 CSV 缺少欄位：${missingHeaders.join("、")}。`);
  }
  return matrix.slice(1).map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ),
  );
};

export const normalizeCourseRows = (
  rows: Record<string, unknown>[],
): CourseCsvRow[] =>
  rows.map((row) =>
    Object.fromEntries(
      COURSE_CSV_HEADERS.map((header) => [
        header,
        String(row[header] ?? ""),
      ]),
    ),
  );

const csvEscape = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export const serializeCourseCsv = (rows: CourseCsvRow[]) =>
  [
    COURSE_CSV_HEADERS.map(csvEscape).join(","),
    ...rows.map((row) =>
      COURSE_CSV_HEADERS.map((header) =>
        csvEscape(row[header] ?? ""),
      ).join(","),
    ),
  ].join("\r\n");

export const checksumCourseSource = async (csvText: string) => {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(csvText.replace(/^\uFEFF/, "")),
  );
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const numberValue = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const booleanValue = (value: string) =>
  value.trim().toUpperCase() === "TRUE";

const idNumber = (id: string, marker: "u" | "l") => {
  const match = id.match(new RegExp(`-${marker}(\\d+)$`));
  return match ? Number(match[1]) : 0;
};

const terminalPunctuation = (sentence: string) =>
  sentence.trim().match(/[.!?]$/)?.[0] ?? ".";

const tokenFromRow = (row: CourseCsvRow): LearningToken => ({
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
  kk: row.kk_us || row.kk,
  ipa: row.ipa_standalone || row.ipa_us || row.ipa,
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
  patternId: row.pattern_id,
  audioMethod: row.audio_method,
  audioStatus: (row.audio_status || "pending") as AudioStatus,
  wordAudioSource: row.word_audio_source,
  audioSource: row.audio_source,
  license: row.license,
  isNewWord: booleanValue(row.is_new_word),
  isNewPattern: booleanValue(row.is_new_pattern),
  isNewCombination: booleanValue(row.is_new_combination),
  isNewContent: booleanValue(row.is_new_content),
  qaStatus: row.qa_status,
});

const UNIT_PRESENTATION: Record<
  CefrLevel,
  { description: string; accent: string }
> = {
  A1: {
    description: "依序完成本單元的四個句子。",
    accent: "#f47b5b",
  },
  A2: {
    description: "描述昨天的活動、明天的計畫，並提出簡單邀請。",
    accent: "#5a95db",
  },
};

export const buildCourseUnitsFromRows = (
  rows: CourseCsvRow[],
  sourceVersion: string,
): CourseUnit[] => {
  const unitRows = new Map<string, CourseCsvRow[]>();
  rows.forEach((row) => {
    unitRows.set(row.unit_id, [
      ...(unitRows.get(row.unit_id) ?? []),
      row,
    ]);
  });

  return Array.from(unitRows.entries())
    .sort(([left], [right]) => idNumber(left, "u") - idNumber(right, "u"))
    .map(([unitId, rowsForUnit]) => {
      const lessonRows = new Map<string, CourseCsvRow[]>();
      rowsForUnit.forEach((row) => {
        lessonRows.set(row.lesson_id, [
          ...(lessonRows.get(row.lesson_id) ?? []),
          row,
        ]);
      });
      const lessons = Array.from(lessonRows.entries())
        .sort(
          ([left], [right]) =>
            idNumber(left, "l") - idNumber(right, "l"),
        )
        .map(([lessonId, rowsForLesson]): Lesson => {
          const orderedRows = [...rowsForLesson].sort(
            (left, right) =>
              numberValue(left.token_order, 0) -
              numberValue(right.token_order, 0),
          );
          const first = orderedRows[0];
          return {
            id: lessonId,
            number: idNumber(lessonId, "l"),
            title: first.lesson_title,
            sentence: first.sentence,
            translation: first.translation,
            grammar: first.grammar,
            minutes: Math.max(4, Math.ceil(orderedRows.length * 1.25)),
            tokens: orderedRows.map(tokenFromRow),
            passageId: first.passage_id,
            passageOrder: numberValue(first.passage_order, 1),
            sentenceId: first.sentence_id,
            sentenceOrder: numberValue(first.sentence_order, 1),
            sentencePatternId: first.sentence_pattern_id,
            patternName: first.pattern_name,
            patternCefr: first.pattern_cefr,
            isNewSentencePattern: booleanValue(
              first.is_new_sentence_pattern,
            ),
            sentenceAudioSource: first.sentence_audio_source,
            audioStatus: (first.audio_status || "pending") as AudioStatus,
            sourceVersion,
          };
        });
      const level =
        rowsForUnit[0]?.level === "A2" ? "A2" : "A1";
      return {
        id: unitId,
        number: idNumber(unitId, "u"),
        title: rowsForUnit[0].unit_title,
        description: UNIT_PRESENTATION[level].description,
        accent: UNIT_PRESENTATION[level].accent,
        lessons,
      };
    });
};

const addRowError = (
  rowIssues: Set<number>,
  errors: string[],
  rowIndex: number,
  message: string,
) => {
  rowIssues.add(rowIndex);
  errors.push(`第 ${rowIndex + 2} 列：${message}`);
};

const assertStableId = (
  value: string,
  field: string,
  rowIndex: number,
  rowIssues: Set<number>,
  errors: string[],
) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    addRowError(
      rowIssues,
      errors,
      rowIndex,
      `${field} 必須是小寫 ASCII 穩定 ID。`,
    );
  }
};

export const validateCourseRows = (
  rows: CourseCsvRow[],
  options: CourseValidationOptions = {},
): CourseValidationReport => {
  const errors: string[] = [];
  const rowIssues = new Set<number>();
  const occurrenceIds = new Map<string, number>();
  const lessonRelations = new Map<string, string>();
  const sentenceRelations = new Map<string, string>();
  const unitTitles = new Map<string, string>();
  const passageRelations = new Map<string, string>();
  const tokenAnswers = new Map<string, string>();
  const tokenMetadata = new Map<string, CourseCsvRow>();
  const pilotQaValues = new Set([
    "pilot_review_required",
    "machine_checked",
  ]);

  rows.forEach((row, rowIndex) => {
    const missing = REQUIRED_ROW_FIELDS.filter(
      (field) => !String(row[field] ?? "").trim(),
    );
    if (missing.length) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `必要欄位不可空白：${missing.join("、")}。`,
      );
    }
    if (!["A1", "A2"].includes(row.level)) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        "level 只能是 A1 或 A2。",
      );
    }
    if (options.expectedLevel && row.level !== options.expectedLevel) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `level 必須是 ${options.expectedLevel}。`,
      );
    }
    if (row.pattern_cefr !== row.level) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        "pattern_cefr 必須和課程 level 一致。",
      );
    }
    if (!/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer ?? "")) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        "answer 必須只有一個英文單字。",
      );
    }
    if (!["meaning", "grammar", "context"].includes(row.prompt_type)) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        "prompt_type 必須是 meaning、grammar 或 context。",
      );
    }
    [
      "unit_id",
      "lesson_id",
      "passage_id",
      "sentence_id",
      "occurrence_id",
      "token_id",
      "lexeme_id",
      "sense_id",
      "sentence_pattern_id",
    ].forEach((field) =>
      assertStableId(
        row[field],
        field,
        rowIndex,
        rowIssues,
        errors,
      ),
    );
    if (occurrenceIds.has(row.occurrence_id)) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `occurrence_id 重複：${row.occurrence_id}。`,
      );
      rowIssues.add(occurrenceIds.get(row.occurrence_id)!);
    } else {
      occurrenceIds.set(row.occurrence_id, rowIndex);
    }
    const unitTitle = unitTitles.get(row.unit_id);
    if (unitTitle && unitTitle !== row.unit_title) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `${row.unit_id} 對應到不同單元名稱。`,
      );
    }
    unitTitles.set(row.unit_id, row.unit_title);
    const lessonUnit = lessonRelations.get(row.lesson_id);
    if (lessonUnit && lessonUnit !== row.unit_id) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `${row.lesson_id} 引用了不同 unit_id。`,
      );
    }
    lessonRelations.set(row.lesson_id, row.unit_id);
    const sentenceLesson = sentenceRelations.get(row.sentence_id);
    if (sentenceLesson && sentenceLesson !== row.lesson_id) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `${row.sentence_id} 引用了不同 lesson_id。`,
      );
    }
    sentenceRelations.set(row.sentence_id, row.lesson_id);
    const passageUnit = passageRelations.get(row.passage_id);
    if (passageUnit && passageUnit !== row.unit_id) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `${row.passage_id} 不可跨單元共用。`,
      );
    }
    passageRelations.set(row.passage_id, row.unit_id);
    if (row.chunk_id) {
      const missingChunkFields = [
        "chunk_text",
        "chunk_translation",
        "chunk_order",
        "chunk_note",
      ].filter((field) => !row[field]);
      if (missingChunkFields.length) {
        addRowError(
          rowIssues,
          errors,
          rowIndex,
          `語塊欄位不可空白：${missingChunkFields.join("、")}。`,
        );
      }
      const chunkWords = row.chunk_text
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (!chunkWords.includes(row.answer.toLowerCase())) {
        addRowError(
          rowIssues,
          errors,
          rowIndex,
          `chunk_text「${row.chunk_text}」未包含「${row.answer}」。`,
        );
      }
    }
    if (
      options.rejectProductionQaForPilot &&
      !pilotQaValues.has(row.qa_status)
    ) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        "試行課程 qa_status 只能是 pilot_review_required 或 machine_checked。",
      );
    }
    if (
      row.audio_status !== "ready" &&
      (row.word_audio_source ||
        row.audio_source ||
        row.sentence_audio_source)
    ) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        "audio_status 不是 ready 時不可宣稱音訊可用。",
      );
    }
    const knownAnswer = tokenAnswers.get(row.token_id);
    if (
      knownAnswer &&
      knownAnswer.toLowerCase() !== row.answer.toLowerCase()
    ) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `token_id ${row.token_id} 不可對應不同 answer。`,
      );
    } else if (!knownAnswer) {
      tokenAnswers.set(row.token_id, row.answer);
    }
    const knownMetadata = tokenMetadata.get(row.token_id);
    if (!knownMetadata) {
      tokenMetadata.set(row.token_id, row);
    } else {
      const inconsistentFields = [
        "lexeme_id",
        "lemma",
        "dictionary_pos",
        "kk_us",
        "ipa_standalone",
      ].filter((field) => knownMetadata[field] !== row[field]);
      if (inconsistentFields.length) {
        addRowError(
          rowIssues,
          errors,
          rowIndex,
          `token_id ${row.token_id} 的共用欄位不一致：${inconsistentFields.join("、")}。`,
        );
      }
    }
  });

  const lessonIds = Array.from(new Set(rows.map((row) => row.lesson_id)));
  lessonIds.forEach((lessonId) => {
    const lessonRows = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.lesson_id === lessonId)
      .sort(
        (left, right) =>
          numberValue(left.row.token_order, 0) -
          numberValue(right.row.token_order, 0),
      );
    lessonRows.forEach(({ row, index }, tokenIndex) => {
      if (numberValue(row.token_order, 0) !== tokenIndex + 1) {
        addRowError(
          rowIssues,
          errors,
          index,
          `${lessonId} 的 token_order 必須從 1 連續排列。`,
        );
      }
    });
    const first = lessonRows[0]?.row;
    if (!first) return;
    const reconstructed =
      lessonRows.map(({ row }) => row.answer).join(" ") +
      terminalPunctuation(first.sentence);
    if (reconstructed !== first.sentence) {
      lessonRows.forEach(({ index }) => rowIssues.add(index));
      errors.push(
        `${lessonId} 的 occurrence 無法重建句子「${first.sentence}」。`,
      );
    }
  });

  const unitIds = Array.from(new Set(rows.map((row) => row.unit_id)));
  unitIds.forEach((unitId) => {
    const lessonNumbers = Array.from(
      new Set(
        rows
          .filter((row) => row.unit_id === unitId)
          .map((row) => idNumber(row.lesson_id, "l")),
      ),
    ).sort((left, right) => left - right);
    lessonNumbers.forEach((value, index) => {
      if (value !== index + 1) {
        errors.push(`${unitId} 的課程編號必須從 1 連續排列。`);
      }
    });
  });

  const passageIds = Array.from(
    new Set(rows.map((row) => row.passage_id)),
  );
  passageIds.forEach((passageId) => {
    const orders = Array.from(
      new Map(
        rows
          .filter((row) => row.passage_id === passageId)
          .map((row) => [
            row.sentence_id,
            numberValue(row.sentence_order, 0),
          ]),
      ).values(),
    ).sort((left, right) => left - right);
    orders.forEach((value, index) => {
      if (value !== index + 1) {
        errors.push(
          `${passageId} 的 sentence_order 必須從 1 連續排列。`,
        );
      }
    });
  });

  if (options.expectedRows !== undefined && rows.length !== options.expectedRows) {
    errors.push(
      `課程應有 ${options.expectedRows} 個 occurrences，目前為 ${rows.length}。`,
    );
  }
  if (
    options.expectedUnits !== undefined &&
    unitIds.length !== options.expectedUnits
  ) {
    errors.push(
      `課程應有 ${options.expectedUnits} 個單元，目前為 ${unitIds.length}。`,
    );
  }
  if (
    options.expectedLessons !== undefined &&
    lessonIds.length !== options.expectedLessons
  ) {
    errors.push(
      `課程應有 ${options.expectedLessons} 課，目前為 ${lessonIds.length}。`,
    );
  }

  const globalFailure = errors.length > 0 && rowIssues.size === 0;
  const failedRows = globalFailure ? rows.length : rowIssues.size;
  return {
    totalRows: rows.length,
    successfulRows: Math.max(0, rows.length - failedRows),
    failedRows,
    unmatchedIds: [],
    validationErrors: Array.from(new Set(errors)),
    valid: errors.length === 0,
  };
};

export const findCrossLevelIdCollisions = (
  leftRows: CourseCsvRow[],
  rightRows: CourseCsvRow[],
) => {
  const idFields = [
    "unit_id",
    "lesson_id",
    "passage_id",
    "sentence_id",
    "occurrence_id",
  ] as const;
  const collisions: string[] = [];
  idFields.forEach((field) => {
    const left = new Set(leftRows.map((row) => row[field]));
    rightRows.forEach((row) => {
      if (left.has(row[field])) {
        collisions.push(`${field}:${row[field]}`);
      }
    });
  });
  return Array.from(new Set(collisions)).sort();
};
