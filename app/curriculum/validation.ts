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
import { CEFR_LEVELS } from "./types.ts";
import { validateEditorialRows } from "./editorial-validation.ts";
import {
  hasSupportedSentenceCharacters,
  sentenceSpellingUnits,
} from "./sentence-words.ts";

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

const UNIT_PRESENTATION: Record<string, { description: string; accent: string }> = {
  A1: {
    description: "依序完成本單元的四個句子。",
    accent: "#f47b5b",
  },
  B1: {
    description: "透過連貫句子練習敘事、理由與獨立表達。",
    accent: "#4aa88f",
  },
  B2: {
    description: "透過複合句練習觀點比較、協商與精準表達。",
    accent: "#5889c7",
  },
  "a2-u01": {
    description: "描述昨天的活動、明天的計畫，並提出簡單邀請。",
    accent: "#5a95db",
  },
  "a2-u02": {
    description: "詢問交通方式、購買車票，並理解簡單班次資訊。",
    accent: "#5a95db",
  },
  "a2-u03": {
    description: "詢問價格、比較商品，並表達尺寸與價格需求。",
    accent: "#5a95db",
  },
  "a2-u04": {
    description: "描述身體狀況、給予建議，並理解簡單服藥指示。",
    accent: "#5a95db",
  },
  "a2-u05": {
    description: "安排工作會面、確認時間，並練習更改約會日期。",
    accent: "#5a95db",
  },
  "a2-u06": {
    description: "聊聊日常家務、說明分工，並禮貌請求協助。",
    accent: "#5a95db",
  },
  "a2-u07": {
    description: "分享去過的地方、詢問別人的經驗，並描述生活近況與改變。",
    accent: "#5a95db",
  },
  "a2-u08": {
    description: "說明日常問題與原因、提出簡單建議，並描述接下來的行動。",
    accent: "#5a95db",
  },
  "a2-u09": {
    description: "提出邀請、接受或婉拒邀請，並安排替代時間。",
    accent: "#5a95db",
  },
  "a2-u10": {
    description: "讀懂回信和交通行程，確認見面地點，並說明行程怎麼改變。",
    accent: "#5a95db",
  },
  "a2-u11": {
    description: "用英文找人接電話、請對方重複或說慢一點，再約好回電時間。",
    accent: "#5a95db",
  },
  "a2-u12": {
    description: "請店員拿菜單、點餐、更正送錯的品項，並開口結帳。",
    accent: "#5a95db",
  },
  "a2-u13": {
    description: "告知有住宿預訂，詢問行李安放位置，並請旅館協助處理房間問題。",
    accent: "#5a95db",
  },
  "a2-u14": {
    description: "詢問退貨，說明尺寸不合、出示收據並詢問其他尺寸。",
    accent: "#5a95db",
  },
  "a2-u15": {
    description: "聽懂誤點，詢問下一班發車時間與票券能否改用，再決定改搭。",
    accent: "#5a95db",
  },
  "a2-u16": {
    description: "回報完成報告、寄送檔案、請同事在期限前確認，並告知可交接。",
    accent: "#5a95db",
  },
  "a2-u17": {
    description: "用地標問路，理解直走、左右轉，以及在某處對面的說法。",
    accent: "#5a95db",
  },
  "a2-u18": {
    description: "描述無法開機、請人查看、建議換一條線，並回報裝置可用。",
    accent: "#5a95db",
  },
  "a2-u19": {
    description: "通報遺失、描述物品外觀，並詢問去哪裡領回及要帶什麼。",
    accent: "#5a95db",
  },
  "a2-u20": {
    description: "詢問借書的資格、借書證與還書期限，理解何時可以歸還。",
    accent: "#5a95db",
  },
  "a2-u21": {
    description: "說明要改期、詢問是否還有空檔、表示哪個時段可以並確認新時間。",
    accent: "#5a95db",
  },
  "a2-u22": {
    description: "比較喜好、說出較想做的事、提出安排並回應他人的提議。",
    accent: "#5a95db",
  },
  "a2-u23": {
    description: "詢問餐點成分，表達飲食偏好、提出調整並選擇替代餐點。",
    accent: "#5a95db",
  },
  "a2-u24": {
    description: "說明需要更多時間、協商最晚期限，並答應有消息再通知。",
    accent: "#5a95db",
  },
  "a2-u25": {
    description: "依序敘述到達、遇到的情況、後來採取的行動與結果。",
    accent: "#5a95db",
  },
  "a2-u26": {
    description: "表達不確定，核對對方的原意或日期，請對方出示訊息並確認聽懂。",
    accent: "#5a95db",
  },
  "a2-u27": {
    description: "禮貌請人幫忙搬東西，提出能做的事，確認分工再一起完成。",
    accent: "#5a95db",
  },
  "a2-u28": {
    description: "說明可能下雨，提出條件式備案，改約並約定確認天氣的時點。",
    accent: "#5a95db",
  },
  "a2-u29": {
    description: "說明要寄什麼、聽懂地址的位置、詢問費用並確認金額。",
    accent: "#5a95db",
  },
  "a2-u30": {
    description: "請求借物，解釋原因，問清借用多久並承諾歸還。",
    accent: "#5a95db",
  },
  "a2-u31": {
    description: "簡短說明身體不舒服和提早離開；練習報備及後續聯絡，不做醫療判斷。",
    accent: "#5a95db",
  },
  "a2-u32": {
    description: "說明商品份量，詢問店裡有沒有賣，再選定數量與付款方式。",
    accent: "#5a95db",
  },
  "a2-u33": {
    description: "詢問活動報到地點，說明來意，確認幾點開始及結束。",
    accent: "#5a95db",
  },
  "a2-u34": {
    description: "告知可能晚到、提出稍晚見面、估計抵達時間並向對方道謝。",
    accent: "#5a95db",
  },
  "a2-u35": {
    description: "詢問桌位與要等多久，說明會在哪裡等，並請店員叫名字。",
    accent: "#5a95db",
  },
  "a2-u36": {
    description: "說明會寄檔案，請對方查看重點與提出問題，再約定回覆時間。",
    accent: "#5a95db",
  },
  "a2-u37": {
    description: "區分必須遵守的場所規則、禮貌禁止事項和允許的行為。",
    accent: "#5a95db",
  },
  "a2-u38": {
    description: "比較兩種路線、問哪種比較快，並根據車程提出交通建議。",
    accent: "#5a95db",
  },
  "a2-u39": {
    description: "分配收碗盤和倒垃圾等家事，說明能在什麼時候完成。",
    accent: "#5a95db",
  },
  "a2-u40": {
    description: "提出取消或更改訂單，請客服寄電子郵件並核對細節。",
    accent: "#5a95db",
  },
  "a2-u41": {
    description: "在售票口選擇票數、詢問單張票價，並確認免費入場條件與入口樓層。",
    accent: "#5a95db",
  },
  "a2-u42": {
    description: "詢問何時方便拜訪，分辨忙到幾點、約在幾點與能待多久。",
    accent: "#5a95db",
  },
  "a2-u43": {
    description: "在櫃台說明想領包裹、找到包裹編號、出示郵件並簽名。",
    accent: "#5a95db",
  },
  "a2-u44": {
    description: "分辨第一步和下一步，選擇洗衣水溫，並說明何時回來。",
    accent: "#5a95db",
  },
  "a2-u45": {
    description: "詢問租車時間和每小時租金，確認最晚歸還時刻及地點。",
    accent: "#5a95db",
  },
  "a2-u46": {
    description: "聽懂填表指示、確認必填欄位，並詢問是否可用電子郵件交表單。",
    accent: "#5a95db",
  },
  "a2-u47": {
    description: "讀懂分類標示，詢問紙類與塑膠瓶的處理方式，確認哪一個桶子適用。",
    accent: "#5a95db",
  },
  "a2-u48": {
    description: "委婉說明聲音太大，請對方調小音量、道歉並答應保持小聲。",
    accent: "#5a95db",
  },
  "a2-u49": {
    description: "回答內用或外帶，請店員把醬料另放或把飲料另外裝一袋。",
    accent: "#5a95db",
  },
  "a2-u50": {
    description: "詢問幾點開門、確認營業起迄時間，並依公休日改選日期。",
    accent: "#5a95db",
  },
  "a2-u51": {
    description: "用建築正面、對面與門旁位置來約集合，確認雙方看見同一個地標。",
    accent: "#5a95db",
  },
  "a2-u52": {
    description: "請對方慢慢拼出名字或重念號碼末兩位，再把收到的資訊念回去確認。",
    accent: "#5a95db",
  },
  "a2-u53": {
    description: "問店家接受哪些付款方式，刷卡不成功時改用現金並索取找零。",
    accent: "#5a95db",
  },
  "a2-u54": {
    description: "聽懂班次延誤多久，詢問下一班的發車時間和月台。",
    accent: "#5a95db",
  },
  "a2-u55": {
    description: "說明自己剛加入團隊、介紹合作對象、確認座位並主動幫忙。",
    accent: "#5a95db",
  },
  "a2-u56": {
    description: "問出門需要帶什麼、確認袋子裝不裝得下，以及行李是不是重到提不動。",
    accent: "#5a95db",
  },
  "a2-u57": {
    description: "詢問住處設備、描述房間相對位置，並比較採光與喜好。",
    accent: "#5a95db",
  },
  "a2-u58": {
    description: "說明不小心掉了物品、何時破掉，再主動提出收拾或換一個。",
    accent: "#5a95db",
  },
  "a2-u59": {
    description: "讀懂設備停用告示、詢問能否換用另一台，並確認所在樓層。",
    accent: "#5a95db",
  },
  "a2-u60": {
    description: "詢問課程有沒有名額，改報另一個班別，並確認何時需要繳費。",
    accent: "#5a95db",
  },
  "a2-u61": {
    description: "用多久一次、通常何時和每週幾次描述家事，並提議輪流分工。",
    accent: "#5a95db",
  },
  "a2-u62": {
    description: "讀懂簡單食譜的步驟：先切、放進碗裡、加一點糖，再用湯匙拌勻。",
    accent: "#5a95db",
  },
  "a2-u63": {
    description: "詢問能否剪髮，說明想剪多短、只修一點，以及哪個部位要留長。",
    accent: "#5a95db",
  },
  "a2-u64": {
    description: "問退房時間、交回鑰匙、寄放行李，並說明何時回來領取。",
    accent: "#5a95db",
  },
  "a2-u65": {
    description: "到藥局說明症狀，聽懂一天吃幾次、飯前或飯後，以及沒效時要看醫生。",
    accent: "#5a95db",
  },
  "a2-u66": {
    description: "描述外面的天氣，建議對方穿什麼、帶什麼，並預告明天的變化。",
    accent: "#5a95db",
  },
  "a2-u67": {
    description: "告訴司機目的地、詢問車程、說明在哪裡下車，付款後索取收據。",
    accent: "#5a95db",
  },
  "a2-u68": {
    description: "到診所掛號，說明哪裡痛、從何時開始，並確認能看診的時間。",
    accent: "#5a95db",
  },
  "a2-u69": {
    description: "在水果攤問單價、決定買幾個、算出總價，再請店家給袋子。",
    accent: "#5a95db",
  },
  "a2-u70": {
    description: "聊週末習慣與喜歡的活動，並輕鬆邀請對方一起去。",
    accent: "#5a95db",
  },
  "a2-u71": {
    description: "介紹和誰同住、有哪些兄弟姊妹，以及家人住在哪裡、在哪裡工作。",
    accent: "#5a95db",
  },
  "a2-u72": {
    description: "在賣場問商品放在哪裡、今天有沒有特價，並請店員找便宜一點的。",
    accent: "#5a95db",
  },
  "a2-u73": {
    description: "向房東回報壞掉的設備和積水，詢問何時能修，並說明自己何時在家。",
    accent: "#5a95db",
  },
  "a2-u74": {
    description: "向主管請假、簡短說明原因，交代誰能接手並承諾完成時間。",
    accent: "#5a95db",
  },
  "a2-u75": {
    description: "到服務台說明正在找人，描述身高、髮型、穿著與最後出現的地點。",
    accent: "#5a95db",
  },
  "a2-u76": {
    description: "餐點送錯或冷掉時禮貌反映，請對方加熱，並聽懂店員的處理。",
    accent: "#5a95db",
  },
  "a2-u77": {
    description: "到銀行說明想開戶，確認要帶的證件、需要多少錢，以及何時能用卡。",
    accent: "#5a95db",
  },
  "a2-u78": {
    description: "對帳單提出疑問，指出金額錯誤與重複收費，並請客服查明。",
    accent: "#5a95db",
  },
  "a2-u79": {
    description: "安排短途旅行，詢問費用、是否包含早餐，並說明出發時間。",
    accent: "#5a95db",
  },
  "a2-u80": {
    description: "徵求對方意見、表達贊成或保留，並委婉提議換個做法。",
    accent: "#5a95db",
  },
  "a2-u81": {
    description: "打電話說明機器故障，詢問何時能來修，確認時間並請對方到前先聯絡。",
    accent: "#5a95db",
  },
  "a2-u82": {
    description: "提議辦小聚會，分配誰帶食物和飲料，並請對方邀請朋友。",
    accent: "#5a95db",
  },
  "a2-u83": {
    description: "用過去式分享假期去了哪裡、待多久、天氣如何，以及玩得開不開心。",
    accent: "#5a95db",
  },
  "a2-u84": {
    description: "請教學習方法與第一步該做什麼，聽懂建議並表達感謝。",
    accent: "#5a95db",
  },
  "a2-u85": {
    description: "確認東西是不是鄰居的，說明造成的問題，禮貌請對方移開並回應道歉。",
    accent: "#5a95db",
  },
  "a2-u86": {
    description: "用現在式描述一天的作息：起床、上班、午餐、下班與睡覺時間。",
    accent: "#5a95db",
  },
  "a2-u87": {
    description: "比較兩種手機方案的價錢與流量，並決定要選哪一個。",
    accent: "#5a95db",
  },
  "a2-u88": {
    description: "開口請路人幫忙拍照，說明怎麼按鍵，並真誠地道謝。",
    accent: "#5a95db",
  },
  "a2-u89": {
    description: "問對方做什麼工作、在哪裡上班、喜不喜歡，以及一週工作幾天。",
    accent: "#5a95db",
  },
  "a2-u90": {
    description: "聊喜歡和不喜歡的食物，並邀請對方嚐嚐看。",
    accent: "#5a95db",
  },
  "a2-u91": {
    description: "在建築物內指出電梯、樓層與第幾扇門，說明左右方向。",
    accent: "#5a95db",
  },
  "a2-u92": {
    description: "用過去式說明以前在哪裡工作、做了多久，以及工作內容。",
    accent: "#5a95db",
  },
  "a2-u93": {
    description: "詢問交通票卡、有效期限與適用範圍，並找到儲值的地方。",
    accent: "#5a95db",
  },
  "a2-u94": {
    description: "約朋友下班後見面，確認地點時間，提醒可能晚到並道別。",
    accent: "#5a95db",
  },
  "a2-u95": {
    description: "詢問課程開始和結束時間、要帶什麼，以及能否免費試上。",
    accent: "#5a95db",
  },
  "a2-u96": {
    description: "到櫃台寄包裹到國外，說明內容物，並詢問何時送達。",
    accent: "#5a95db",
  },
  "a2-u97": {
    description: "問對方週末過得如何，用過去式分享活動並把話題丟回去。",
    accent: "#5a95db",
  },
  "a2-u98": {
    description: "問房租、包含哪些費用與何時能搬入，並決定要租。",
    accent: "#5a95db",
  },
  "a2-u99": {
    description: "分享走路、喝水、早睡等健康習慣，並說明身體好轉。",
    accent: "#5a95db",
  },
  "a2-u100": {
    description: "問下個月的安排，用 be going to 說計畫，並表示之後再回覆。",
    accent: "#5a95db",
  },
  "a2-u101": {
    description: "請鄰居代收包裹，說明自己不在家、何時來拿，並表達感謝。",
    accent: "#5a95db",
  },
  "a2-u102": {
    description: "用現在進行式說自己和家人此刻正在做什麼。",
    accent: "#5a95db",
  },
  "a2-u103": {
    description: "向銀行掛失卡片，回答最後使用時間，並聽懂補發說明。",
    accent: "#5a95db",
  },
  "a2-u104": {
    description: "說明自己會什麼、擅長和不擅長的事，以及某件事容易學。",
    accent: "#5a95db",
  },
  "a2-u105": {
    description: "提出退款、說明原因、出示收據，並聽懂店家的處理。",
    accent: "#5a95db",
  },
  "a2-u106": {
    description: "請朋友順路載一程，說明原因並約定接人的時間和地點。",
    accent: "#5a95db",
  },
  "a2-u107": {
    description: "在職場禮貌徵求同意，說明原因，並聽懂主管的回覆。",
    accent: "#5a95db",
  },
  "a2-u108": {
    description: "比較兩個住處的大小、距離與新舊，並說出比較喜歡哪一間。",
    accent: "#5a95db",
  },
  "a2-u109": {
    description: "用 always、sometimes、never 說明生活習慣，並詢問頻率。",
    accent: "#5a95db",
  },
  "a2-u110": {
    description: "詢問生日、聊想要的禮物，並答應買禮物給對方。",
    accent: "#5a95db",
  },
  "a2-u111": {
    description: "向老師提問、說明不懂或忘了帶書，並請對方再解釋一次。",
    accent: "#5a95db",
  },
  "a2-u112": {
    description: "請店員暫時保留商品，說明何時回來並確認保留期限。",
    accent: "#5a95db",
  },
  "a2-u113": {
    description: "介紹最喜歡的地方，說明位置、環境和什麼時候最舒服。",
    accent: "#5a95db",
  },
  "a2-u114": {
    description: "請教網站怎麼用，聽懂點選、輸入和登入的步驟。",
    accent: "#5a95db",
  },
  "a2-u115": {
    description: "主動幫迷路的訪客，問目的地、說明距離並帶路。",
    accent: "#5a95db",
  },
  "a2-u116": {
    description: "聊有沒有養動物、描述牠的個性，並說明照顧的習慣。",
    accent: "#5a95db",
  },
  "a2-u117": {
    description: "問哪一路公車到目的地、路線號碼，以及要在哪一站下車。",
    accent: "#5a95db",
  },
  "a2-u118": {
    description: "用過去式說昨天和誰見面、聊了多久、之後去了哪裡。",
    accent: "#5a95db",
  },
  "a2-u119": {
    description: "在簡單面試中說明上一份工作、強項、動機與可到職時間。",
    accent: "#5a95db",
  },
  "a2-u120": {
    description: "回診時說明好轉與仍不舒服的地方，並聽懂下次回診安排。",
    accent: "#5a95db",
  },
  "a2-u121": {
    description: "出發前確認對方有空、討論出發時間，並提醒別忘了帶東西。",
    accent: "#5a95db",
  },
  "a2-u122": {
    description: "介紹家的大小、房間數量與格局，並說明自己的感受。",
    accent: "#5a95db",
  },
  "a2-u123": {
    description: "聊喜歡的季節，比較夏天和冬天，並說明天氣感受。",
    accent: "#5a95db",
  },
  "a2-u124": {
    description: "主動泡茶招待朋友，詢問喜好、說明份量並稱讚味道。",
    accent: "#5a95db",
  },
  "a2-u125": {
    description: "聊打球與跑步的習慣，並說明運動對健康的好處。",
    accent: "#5a95db",
  },
  "a2-u126": {
    description: "向旅館反映沒熱水或燈壞了，請人處理或要求換房。",
    accent: "#5a95db",
  },
  "a2-u127": {
    description: "說明哪幾天有課、幾點上課、何時考試與讀書計畫。",
    accent: "#5a95db",
  },
  "a2-u128": {
    description: "聊看過的電影，說出喜歡和不喜歡的地方，並推薦給朋友。",
    accent: "#5a95db",
  },
  "a2-u129": {
    description: "安排家人來訪的聚餐，請朋友幫忙並確認還缺什麼。",
    accent: "#5a95db",
  },
  "a2-u130": {
    description: "比較兩家店的價錢和水果新鮮度，並決定在哪裡買。",
    accent: "#5a95db",
  },
  "a2-u131": {
    description: "介紹住家附近有什麼、交通方便與否，以及環境是否適合居住。",
    accent: "#5a95db",
  },
  "a2-u132": {
    description: "向客服追問沒送到的包裹，提供訂購時間並確認何時送達。",
    accent: "#5a95db",
  },
  "a2-u133": {
    description: "說明假期要去哪裡、住哪裡、何時回來，以及期待的心情。",
    accent: "#5a95db",
  },
  "a2-u134": {
    description: "試穿衣服、說明尺寸不合、詢問顏色，並決定要哪一件。",
    accent: "#5a95db",
  },
  "a2-u135": {
    description: "在電話中說明自己的位置，用看到的地標幫對方找到你。",
    accent: "#5a95db",
  },
  "a2-u136": {
    description: "承認錯誤、說明忘了做的事、真誠道歉並保證不再發生。",
    accent: "#5a95db",
  },
  "a2-u137": {
    description: "談今年的目標，說明希望達成的事、為什麼重要，以及如何努力。",
    accent: "#5a95db",
  },
  "a2-u138": {
    description: "到銀行預約，說明要更改的資料，並聽懂要帶什麼證件。",
    accent: "#5a95db",
  },
  "a2-u139": {
    description: "詳細描述遺失的袋子、裡面的東西、地點與時間，並留下聯絡方式。",
    accent: "#5a95db",
  },
  "a2-u140": {
    description: "聊喜歡的音樂、聽音樂的時間，以及家人的才藝。",
    accent: "#5a95db",
  },
  "a2-u141": {
    description: "向同事說明電腦變慢，照著建議關機重開並確認恢復。",
    accent: "#5a95db",
  },
  "a2-u142": {
    description: "和朋友祕密籌備驚喜聚會，分工買蛋糕並確認到場時間。",
    accent: "#5a95db",
  },
  "a2-u143": {
    description: "詢問明天的天氣，聽懂下雨與強風的預報，並決定怎麼安排。",
    accent: "#5a95db",
  },
  "a2-u144": {
    description: "比較計程車和公車的速度與價錢，依時間決定怎麼去。",
    accent: "#5a95db",
  },
  "a2-u145": {
    description: "出門前交代關窗、關燈、鎖門，以及鑰匙放在哪裡。",
    accent: "#5a95db",
  },
  "a2-u146": {
    description: "向同事借充電線，說明需要並答應很快歸還。",
    accent: "#5a95db",
  },
  "a2-u147": {
    description: "用過去式聊小時候住哪裡、怎麼上學與養過的寵物。",
    accent: "#5a95db",
  },
  "a2-u148": {
    description: "宣布行程變動、說明原因和新時間，並請對方轉告大家。",
    accent: "#5a95db",
  },
  "a2-u149": {
    description: "請朋友推薦餐廳，問什麼好吃，並說明價錢與決定。",
    accent: "#5a95db",
  },
  "a2-u150": {
    description: "逾期還書時說明原因、詢問要付多少錢與付款方式。",
    accent: "#5a95db",
  },
  "a2-u151": {
    description: "描述跌倒的小意外，說明哪裡痛並請人幫忙。",
    accent: "#5a95db",
  },
  "a2-u152": {
    description: "聊喜歡和不喜歡的家事，請對方幫忙並提議分工。",
    accent: "#5a95db",
  },
  "a2-u153": {
    description: "詢問有沒有運費、金額、免運條件與送達時間。",
    accent: "#5a95db",
  },
  "a2-u154": {
    description: "和同事聊週末、問忙不忙、邀休息喝咖啡並道別。",
    accent: "#5a95db",
  },
  "a2-u155": {
    description: "詢問游泳池開放時間、會員規定與要帶的東西。",
    accent: "#5a95db",
  },
  "a2-u156": {
    description: "留語音訊息時說明身分、來電原因並請對方回電。",
    accent: "#5a95db",
  },
  "a2-u157": {
    description: "邀同學一起準備考試，約時間地點並提醒帶筆記。",
    accent: "#5a95db",
  },
  "a2-u158": {
    description: "在餐廳說明想坐的位置、反映桌子太小並確認位子是否有人。",
    accent: "#5a95db",
  },
  "a2-u159": {
    description: "請同事代班，說明原因並告知主管。",
    accent: "#5a95db",
  },
  "a2-u160": {
    description: "在店裡說明要送誰、喜好，挑選禮物並請店員包裝。",
    accent: "#5a95db",
  },
  "a2-u161": {
    description: "詢問能不能停車、可以停哪裡與每小時費用。",
    accent: "#5a95db",
  },
  "a2-u162": {
    description: "認識新鄰居，自我介紹、說明住處並主動提供協助。",
    accent: "#5a95db",
  },
  "a2-u163": {
    description: "說明借了對方的東西，歸還物品並回應對方。",
    accent: "#5a95db",
  },
  "a2-u164": {
    description: "向管理員回報電梯故障，問修理時間並請對方通知。",
    accent: "#5a95db",
  },
  "a2-u165": {
    description: "更改已訂的晚餐時間，提議新時間並確認到達。",
    accent: "#5a95db",
  },
  "a2-u166": {
    description: "聊最喜歡的老師、老師的個性與從老師身上學到的事。",
    accent: "#5a95db",
  },
  "a2-u167": {
    description: "回想小時候家人做的食物，說明味道與還記得的事。",
    accent: "#5a95db",
  },
  "a2-u168": {
    description: "提議去海邊，提醒天氣、該帶的東西與活動。",
    accent: "#5a95db",
  },
  "a2-u169": {
    description: "在機場櫃檯出示護照、回答行李數量並確認登機門與起飛時間。",
    accent: "#5a95db",
  },
  "a2-u170": {
    description: "在飛機上向空服員要東西、說明身體感覺並問抵達時間。",
    accent: "#5a95db",
  },
  "a2-u171": {
    description: "回答入境官員的來訪目的、停留天數與住宿地點。",
    accent: "#5a95db",
  },
  "a2-u172": {
    description: "到櫃檯換錢，詢問匯率、領取現金與收據。",
    accent: "#5a95db",
  },
  "a2-u173": {
    description: "說明搬家、請朋友幫忙搬東西並介紹新家。",
    accent: "#5a95db",
  },
  "a2-u174": {
    description: "說明牙痛、到診所看診並聽懂簡單指示。",
    accent: "#5a95db",
  },
  "a2-u175": {
    description: "到店裡買手機，比較功能、詢問顏色並做決定。",
    accent: "#5a95db",
  },
  "a2-u176": {
    description: "邀朋友逛夜市，問食物、試吃並點餐。",
    accent: "#5a95db",
  },
  "a2-u177": {
    description: "討論暴風雨天的上班安排、關窗與待在室內。",
    accent: "#5a95db",
  },
  "a2-u178": {
    description: "到便利商店繳帳單，操作機器並回答是否需要收據。",
    accent: "#5a95db",
  },
  "a2-u179": {
    description: "買火車票、選靠窗座位，並確認車廂與車程時間。",
    accent: "#5a95db",
  },
  "a2-u180": {
    description: "向外國朋友介紹台灣的景色、食物與有名的地方。",
    accent: "#5a95db",
  },
  "a2-u181": {
    description: "報名當志工，確認時間、工作內容並留下名字。",
    accent: "#5a95db",
  },
  "a2-u182": {
    description: "外出前請鄰居幫忙澆水，交代頻率並說明回來會帶禮物。",
    accent: "#5a95db",
  },
  "a2-u183": {
    description: "聊新開始的興趣、練習時間與感受，並邀對方試試看。",
    accent: "#5a95db",
  },
  "a2-u184": {
    description: "用先後順序說明線上預約的步驟與收到通知。",
    accent: "#5a95db",
  },
  "a2-u185": {
    description: "聊朋友的新生寶寶，問性別、描述寶寶並提議探望。",
    accent: "#5a95db",
  },
  "a2-u186": {
    description: "聊早餐吃什麼、有時沒時間，以及早餐的重要性。",
    accent: "#5a95db",
  },
  "a2-u187": {
    description: "一起看老照片，問照片裡的人並描述外表。",
    accent: "#5a95db",
  },
  "a2-u188": {
    description: "收到送錯的包裹時說明問題、請司機帶回並追問自己的包裹。",
    accent: "#5a95db",
  },
  "a2-u189": {
    description: "出門前找鑰匙，問哪裡找過並建議固定放的位置。",
    accent: "#5a95db",
  },
  "a2-u190": {
    description: "邀同事吃午餐，討論餐廳、時間並表示要請客。",
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
      const level = CEFR_LEVELS.includes(
        rowsForUnit[0]?.level as CefrLevel,
      )
        ? (rowsForUnit[0].level as CefrLevel)
        : "A1";
      const presentation =
        UNIT_PRESENTATION[unitId] ?? UNIT_PRESENTATION[level];
      return {
        id: unitId,
        number: idNumber(unitId, "u"),
        title: rowsForUnit[0].unit_title,
        description: presentation.description,
        accent: presentation.accent,
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
  if (
    !/^[a-z0-9]+(?:'[a-z0-9]+)?(?:-[a-z0-9]+(?:'[a-z0-9]+)?)*$/.test(
      value,
    )
  ) {
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

  validateEditorialRows(rows).forEach(({ rowIndex, message }) =>
    addRowError(rowIssues, errors, rowIndex, message),
  );

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
    if (!CEFR_LEVELS.includes(row.level as CefrLevel)) {
      addRowError(
        rowIssues,
        errors,
        rowIndex,
        `level 只能是 ${CEFR_LEVELS.join("、")}。`,
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
    ["chunk_id", "pattern_id"].forEach((field) => {
      if (row[field]) assertStableId(row[field], field, rowIndex, rowIssues, errors);
    });
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
      const chunkWords = sentenceSpellingUnits(row.chunk_text.toLowerCase());
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
    const reconstructed = lessonRows.map(({ row }) => row.answer).join(" ");
    const expectedWords = sentenceSpellingUnits(first.sentence).join(" ");
    if (
      !hasSupportedSentenceCharacters(first.sentence) ||
      !/[.!?]$/.test(first.sentence) ||
      reconstructed !== expectedWords
    ) {
      lessonRows.forEach(({ index }) => rowIssues.add(index));
      errors.push(
        `${lessonId} 的 occurrence 無法重建句子「${first.sentence}」。`,
      );
    }
    for (const { row, index } of lessonRows) {
      const sharedFields = [
        "sentence_id", "sentence", "translation", "grammar", "lesson_title",
        "passage_id", "passage_order", "sentence_order", "sentence_pattern_id",
        "pattern_name", "pattern_cefr",
      ];
      const differences = sharedFields.filter((field) => row[field] !== first[field]);
      if (differences.length) {
        addRowError(rowIssues, errors, index,
          `${row.level}/${row.unit_id}/${lessonId}/${row.occurrence_id} 的句子共用欄位不一致：${differences.join("、")}。`);
      }
    }
    const chunks = new Map<string, typeof lessonRows>();
    lessonRows.forEach((entry) => {
      if (entry.row.chunk_id) {
        chunks.set(entry.row.chunk_id, [...(chunks.get(entry.row.chunk_id) ?? []), entry]);
      }
    });
    chunks.forEach((entries, chunkId) => {
      const chunk = entries[0].row;
      const actual = entries.map(({ row }) => row.answer.toLowerCase()).join(" ");
      const expected = sentenceSpellingUnits(chunk.chunk_text.toLowerCase()).join(" ");
      const contiguous = entries.every(({ row }, index) =>
        Number(row.token_order) === Number(chunk.token_order) + index);
      const consistent = entries.every(({ row }) =>
        ["chunk_text", "chunk_translation", "chunk_order", "chunk_note"].every(
          (field) => row[field] === chunk[field],
        ));
      if (actual !== expected || !contiguous || !consistent) {
        entries.forEach(({ index }) => rowIssues.add(index));
        errors.push(`${first.level}/${first.unit_id}/${lessonId}/${chunkId} 的語塊必須由連續且一致的逐字 occurrence 完整重建。`);
      }
    });
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
