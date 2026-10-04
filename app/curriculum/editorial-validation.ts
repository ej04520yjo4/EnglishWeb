import type { CourseCsvRow } from "./types";

const CANONICAL_VERB_FORMS: Record<string, string> = {
  am: "be", is: "be", are: "be", was: "be", were: "be", been: "be",
  has: "have", had: "have",
};

export type EditorialIssue = { rowIndex: number; message: string };

// Deliberately bounded checks for documented regressions. These do not claim
// to parse arbitrary English or replace content review.
export const validateEditorialRows = (rows: CourseCsvRow[]): EditorialIssue[] => {
  const issues: EditorialIssue[] = [];
  const lemmaByLexeme = new Map<string, string>();
  const bySentence = new Map<string, { row: CourseCsvRow; index: number }[]>();
  const add = (row: CourseCsvRow, rowIndex: number, message: string) => {
    issues.push({ rowIndex, message: `${row.level}/${row.unit_id}/${row.lesson_id}/${row.occurrence_id}：${message}` });
  };
  rows.forEach((row, index) => {
    const answer = String(row.answer ?? "").toLowerCase();
    const expected = CANONICAL_VERB_FORMS[answer];
    if (expected && (row.lexeme_id !== expected || row.lemma !== expected)) {
      add(row, index, `${row.answer} 的 lexeme_id 與 lemma 必須使用原形 ${expected}。`);
    }
    if (row.lexeme_id === "i" && row.lemma !== "I") {
      add(row, index, "第一人稱代名詞的 lemma 必須保留大寫 I。");
    }
    const lemma = String(row.lemma ?? "").toLowerCase();
    const known = lemmaByLexeme.get(row.lexeme_id);
    if (known && known !== lemma) {
      add(row, index, `lexeme_id ${row.lexeme_id} 對應不同 lemma：${known}／${lemma}。`);
    }
    lemmaByLexeme.set(row.lexeme_id, lemma);
    bySentence.set(row.sentence_id, [...(bySentence.get(row.sentence_id) ?? []), { row, index }]);
  });
  bySentence.forEach((entries) => {
    entries.sort((a, b) => Number(a.row.token_order) - Number(b.row.token_order));
    entries.forEach(({ row, index }, position) => {
      const word = String(row.answer ?? "").toLowerCase();
      const next = entries[position + 1]?.row;
      const previous = entries[position - 1]?.row;
      if (word === "to" && next && /^verb\b/.test(next.context_pos) &&
          String(next.answer ?? "").toLowerCase() === String(next.lemma ?? "").toLowerCase() &&
          !/不定詞/.test(row.context_pos)) {
        add(row, index, "to 後接原形動詞時，context_pos 必須標示不定詞標記。");
      }
      const relativeThat = word === "that" && next && /^verb\b/.test(next.context_pos);
      const clauseThat = word === "that" && previous &&
        (["argue", "suggest", "claim", "ensure"].includes(previous.lemma) ||
          String(previous.answer ?? "").toLowerCase() === "provided");
      if ((relativeThat || clauseThat) && /determiner|限定詞/.test(row.context_pos)) {
        add(row, index, "引導子句的 that 不可標示為限定詞；請依句中功能標記關係代名詞或連接詞。");
      }
      if (word === "after" && next && /^pronoun\b/.test(next.context_pos) &&
          entries[position + 2] && /^verb\b/.test(entries[position + 2].row.context_pos) &&
          !/conjunction|連接詞/.test(row.context_pos)) {
        add(row, index, "after 引導主詞與動詞構成的子句時，應標示連接詞。");
      }
      if (row.lexeme_id === "be" && next) {
        const complement = /^adverb\b/.test(next.context_pos) ? entries[position + 2]?.row : next;
        if (complement && /^(adjective|noun|determiner)\b/.test(complement.context_pos) &&
            /auxiliary|助動詞/.test(row.context_pos)) {
          add(row, index, "be 連接主詞與名詞或形容詞補語時，不是進行式或被動式的助動詞。");
        }
      }
    });
  });
  return issues;
};
