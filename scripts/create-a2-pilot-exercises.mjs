import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCourseCsv } from "../app/curriculum/validation.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(root, "public/data", name), "utf8"));
const rows = parseCourseCsv(
  fs.readFileSync(path.join(root, "public/data/a2-course-v1.csv"), "utf8"),
);
const patternData = readJson("a2-pattern-exercises.json");
const readingData = readJson("a2-reading-exercises.json");
const qaStatus = "pilot_review_required";

const unique = (values) => [...new Set(values.filter(Boolean))];
const lessonRows = (lessonId) =>
  rows
    .filter((row) => row.lesson_id === lessonId)
    .sort((left, right) => Number(left.token_order) - Number(right.token_order));
const sourceForLesson = (lessonId) => {
  const source = lessonRows(lessonId)[0];
  if (!source) throw new Error(`找不到課程 ${lessonId}`);
  return source;
};
const lessonMetadata = (lessonId) => {
  const sourceRows = lessonRows(lessonId);
  return {
    requiredLexemeIds: unique(sourceRows.map((row) => row.lexeme_id)),
    requiredChunkIds: unique(sourceRows.map((row) => row.chunk_id)),
  };
};
const slotValue = (slotId, text, requiredLexemeIds, requiredChunkIds = []) => ({
  slotId,
  text,
  requiredLexemeIds,
  requiredChunkIds,
});
const makeExample = (patternId, lessonId, definition) => {
  const source = sourceForLesson(lessonId);
  return {
    id: definition.id,
    practiceLessonId: lessonId,
    sourceSentenceId: source.sentence_id,
    sentencePatternId: patternId,
    passageId: source.passage_id,
    sentence: definition.sentence,
    translation: definition.translation,
    hintKeywords: definition.hintKeywords,
    skeleton: definition.skeleton,
    requiredLexemeIds: unique(
      definition.slotValues.flatMap((value) => value.requiredLexemeIds),
    ),
    requiredChunkIds: unique(
      definition.slotValues.flatMap(
        (value) => value.requiredChunkIds ?? [],
      ),
    ),
    slotValues: definition.slotValues,
    qaStatus,
  };
};
const makePattern = (definition) => ({
  id: definition.id,
  cefr: "A2",
  enabledForTransfer: true,
  template: definition.template,
  slots: definition.slots,
  examples: definition.examples.map((example) =>
    makeExample(definition.id, definition.lessonId, example),
  ),
  qaStatus,
});

const newPatterns = [
  makePattern({
    id: "how-can-get-to-place",
    lessonId: "a2-u02-l01",
    template: "How can {subject} get to {place}?",
    slots: [
      {
        slotId: "question-subject",
        role: "詢問方法與主詞",
        allowedLexemeIds: ["how", "can", "i"],
        allowedChunkIds: ["how-can-i"],
      },
      {
        slotId: "movement",
        role: "前往某地",
        allowedLexemeIds: ["get", "to"],
        allowedChunkIds: ["get-to"],
      },
      {
        slotId: "place",
        role: "已學地點",
        allowedLexemeIds: ["the", "store", "school", "station"],
        allowedChunkIds: ["the-station"],
      },
    ],
    examples: [
      {
        id: "a2-u02-l01-transfer-store",
        sentence: "How can I get to the store?",
        translation: "我要怎麼去商店？",
        hintKeywords: "怎麼／我／去商店",
        skeleton: "How can I get to ______?",
        slotValues: [
          slotValue("question-subject", "How can I", ["how", "can", "i"], [
            "how-can-i",
          ]),
          slotValue("movement", "get to", ["get", "to"], ["get-to"]),
          slotValue("place", "the store", ["the", "store"]),
        ],
      },
      {
        id: "a2-u02-l01-transfer-school",
        sentence: "How can I get to school?",
        translation: "我要怎麼去學校？",
        hintKeywords: "怎麼／我／去學校",
        skeleton: "How can I get to ______?",
        slotValues: [
          slotValue("question-subject", "How can I", ["how", "can", "i"], [
            "how-can-i",
          ]),
          slotValue("movement", "get to", ["get", "to"], ["get-to"]),
          slotValue("place", "school", ["school"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "can-take-transportation",
    lessonId: "a2-u02-l02",
    template: "{subject} can take the bus.",
    slots: [
      {
        slotId: "subject",
        role: "人物主詞",
        allowedLexemeIds: ["i", "you", "she"],
      },
      {
        slotId: "modal",
        role: "表示可採用的方式",
        allowedLexemeIds: ["can"],
      },
      {
        slotId: "transportation",
        role: "搭乘交通工具",
        allowedLexemeIds: ["take", "the", "bus"],
        allowedChunkIds: ["take-the-bus"],
      },
    ],
    examples: [
      {
        id: "a2-u02-l02-transfer-i",
        sentence: "I can take the bus.",
        translation: "我可以搭公車。",
        hintKeywords: "我／可以／搭公車",
        skeleton: "I can ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("modal", "can", ["can"]),
          slotValue("transportation", "take the bus", ["take", "the", "bus"], [
            "take-the-bus",
          ]),
        ],
      },
      {
        id: "a2-u02-l02-transfer-she",
        sentence: "She can take the bus.",
        translation: "她可以搭公車。",
        hintKeywords: "她／可以／搭公車",
        skeleton: "She can ______.",
        slotValues: [
          slotValue("subject", "She", ["she"]),
          slotValue("modal", "can", ["can"]),
          slotValue("transportation", "take the bus", ["take", "the", "bus"], [
            "take-the-bus",
          ]),
        ],
      },
    ],
  }),
  makePattern({
    id: "past-buy-ticket",
    lessonId: "a2-u02-l03",
    template: "{subject} bought a train ticket {time}.",
    slots: [
      {
        slotId: "subject",
        role: "人物主詞",
        allowedLexemeIds: ["i"],
      },
      {
        slotId: "purchase",
        role: "過去購買車票",
        allowedLexemeIds: ["buy", "a", "train", "ticket"],
        allowedChunkIds: ["bought-a-train-ticket"],
      },
      {
        slotId: "time",
        role: "已學時間",
        allowedLexemeIds: ["at", "seven", "eight"],
        allowedChunkIds: ["at-seven", "at-eight"],
      },
    ],
    examples: [
      {
        id: "a2-u02-l03-transfer-seven",
        sentence: "I bought a train ticket at seven.",
        translation: "我七點買了一張火車票。",
        hintKeywords: "我／買火車票／七點",
        skeleton: "I bought a train ticket ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue(
            "purchase",
            "bought a train ticket",
            ["buy", "a", "train", "ticket"],
            ["bought-a-train-ticket"],
          ),
          slotValue("time", "at seven", ["at", "seven"], ["at-seven"]),
        ],
      },
      {
        id: "a2-u02-l03-transfer-eight",
        sentence: "I bought a train ticket at eight.",
        translation: "我八點買了一張火車票。",
        hintKeywords: "我／買火車票／八點",
        skeleton: "I bought a train ticket ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue(
            "purchase",
            "bought a train ticket",
            ["buy", "a", "train", "ticket"],
            ["bought-a-train-ticket"],
          ),
          slotValue("time", "at eight", ["at", "eight"], ["at-eight"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "schedule-leaves-at-time",
    lessonId: "a2-u02-l04",
    template: "The train leaves at {time} tomorrow morning.",
    slots: [
      {
        slotId: "transportation",
        role: "特定交通工具",
        allowedLexemeIds: ["the", "train"],
        allowedChunkIds: ["the-train"],
      },
      {
        slotId: "schedule",
        role: "固定班次出發",
        allowedLexemeIds: ["leave"],
      },
      {
        slotId: "clock-time",
        role: "已學時刻",
        allowedLexemeIds: ["at", "seven", "eight"],
        allowedChunkIds: ["at-seven", "at-eight"],
      },
      {
        slotId: "day-period",
        role: "日期與時段",
        allowedLexemeIds: ["tomorrow", "morning"],
        allowedChunkIds: ["tomorrow-morning"],
      },
    ],
    examples: [
      {
        id: "a2-u02-l04-transfer-seven",
        sentence: "The train leaves at seven tomorrow morning.",
        translation: "火車明天早上七點出發。",
        hintKeywords: "火車／七點出發／明天早上",
        skeleton: "The train leaves at ______ tomorrow morning.",
        slotValues: [
          slotValue("transportation", "The train", ["the", "train"], [
            "the-train",
          ]),
          slotValue("schedule", "leaves", ["leave"]),
          slotValue("clock-time", "at seven", ["at", "seven"], ["at-seven"]),
          slotValue(
            "day-period",
            "tomorrow morning",
            ["tomorrow", "morning"],
            ["tomorrow-morning"],
          ),
        ],
      },
      {
        id: "a2-u02-l04-transfer-eight",
        sentence: "The train leaves at eight tomorrow morning.",
        translation: "火車明天早上八點出發。",
        hintKeywords: "火車／八點出發／明天早上",
        skeleton: "The train leaves at ______ tomorrow morning.",
        slotValues: [
          slotValue("transportation", "The train", ["the", "train"], [
            "the-train",
          ]),
          slotValue("schedule", "leaves", ["leave"]),
          slotValue("clock-time", "at eight", ["at", "eight"], ["at-eight"]),
          slotValue(
            "day-period",
            "tomorrow morning",
            ["tomorrow", "morning"],
            ["tomorrow-morning"],
          ),
        ],
      },
    ],
  }),
  makePattern({
    id: "how-much-be-item",
    lessonId: "a2-u03-l01",
    template: "How much is this {item}?",
    slots: [
      {
        slotId: "price-question",
        role: "詢問價格",
        allowedLexemeIds: ["how", "much"],
        allowedChunkIds: ["how-much"],
      },
      {
        slotId: "be",
        role: "單數 be 動詞",
        allowedLexemeIds: ["be"],
      },
      {
        slotId: "item",
        role: "已學單數商品",
        allowedLexemeIds: ["this", "book", "apple", "shirt"],
        allowedChunkIds: ["this-shirt"],
      },
    ],
    examples: [
      {
        id: "a2-u03-l01-transfer-book",
        sentence: "How much is this book?",
        translation: "這本書多少錢？",
        hintKeywords: "多少錢／這本書",
        skeleton: "How much is this ______?",
        slotValues: [
          slotValue("price-question", "How much", ["how", "much"], [
            "how-much",
          ]),
          slotValue("be", "is", ["be"]),
          slotValue("item", "this book", ["this", "book"]),
        ],
      },
      {
        id: "a2-u03-l01-transfer-apple",
        sentence: "How much is this apple?",
        translation: "這顆蘋果多少錢？",
        hintKeywords: "多少錢／這顆蘋果",
        skeleton: "How much is this ______?",
        slotValues: [
          slotValue("price-question", "How much", ["how", "much"], [
            "how-much",
          ]),
          slotValue("be", "is", ["be"]),
          slotValue("item", "this apple", ["this", "apple"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "comparative-cheaper-than",
    lessonId: "a2-u03-l02",
    template: "This {item} is cheaper than that one.",
    slots: [
      {
        slotId: "subject",
        role: "靠近說話者的商品",
        allowedLexemeIds: ["this", "book", "apple", "shirt"],
        allowedChunkIds: ["this-shirt"],
      },
      {
        slotId: "be",
        role: "單數 be 動詞",
        allowedLexemeIds: ["be"],
      },
      {
        slotId: "comparison",
        role: "比較價格",
        allowedLexemeIds: ["cheap", "than"],
        allowedChunkIds: ["cheaper-than"],
      },
      {
        slotId: "target",
        role: "代替已提商品",
        allowedLexemeIds: ["that", "one"],
        allowedChunkIds: ["that-one"],
      },
    ],
    examples: [
      {
        id: "a2-u03-l02-transfer-book",
        sentence: "This book is cheaper than that one.",
        translation: "這本書比那本便宜。",
        hintKeywords: "這本書／比／那本便宜",
        skeleton: "This book is cheaper than ______.",
        slotValues: [
          slotValue("subject", "This book", ["this", "book"]),
          slotValue("be", "is", ["be"]),
          slotValue("comparison", "cheaper than", ["cheap", "than"], [
            "cheaper-than",
          ]),
          slotValue("target", "that one", ["that", "one"], ["that-one"]),
        ],
      },
      {
        id: "a2-u03-l02-transfer-apple",
        sentence: "This apple is cheaper than that one.",
        translation: "這顆蘋果比那顆便宜。",
        hintKeywords: "這顆蘋果／比／那顆便宜",
        skeleton: "This apple is cheaper than ______.",
        slotValues: [
          slotValue("subject", "This apple", ["this", "apple"]),
          slotValue("be", "is", ["be"]),
          slotValue("comparison", "cheaper than", ["cheap", "than"], [
            "cheaper-than",
          ]),
          slotValue("target", "that one", ["that", "one"], ["that-one"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "do-you-have-size",
    lessonId: "a2-u03-l03",
    template: "Do you have {item}?",
    slots: [
      {
        slotId: "availability-question",
        role: "詢問是否有某物",
        allowedLexemeIds: ["do", "you", "have"],
        allowedChunkIds: ["do-you-have"],
      },
      {
        slotId: "item",
        role: "已學商品或代替詞",
        allowedLexemeIds: ["this", "that", "shirt", "one"],
        allowedChunkIds: ["this-shirt", "that-one"],
      },
    ],
    examples: [
      {
        id: "a2-u03-l03-transfer-shirt",
        sentence: "Do you have this shirt?",
        translation: "你們有這件襯衫嗎？",
        hintKeywords: "你們有／這件襯衫",
        skeleton: "Do you have ______?",
        slotValues: [
          slotValue(
            "availability-question",
            "Do you have",
            ["do", "you", "have"],
            ["do-you-have"],
          ),
          slotValue("item", "this shirt", ["this", "shirt"], ["this-shirt"]),
        ],
      },
      {
        id: "a2-u03-l03-transfer-that-one",
        sentence: "Do you have that one?",
        translation: "你們有那一件嗎？",
        hintKeywords: "你們有／那一件",
        skeleton: "Do you have ______?",
        slotValues: [
          slotValue(
            "availability-question",
            "Do you have",
            ["do", "you", "have"],
            ["do-you-have"],
          ),
          slotValue("item", "that one", ["that", "one"], ["that-one"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "too-adjective-for-person",
    lessonId: "a2-u03-l04",
    template: "{item} is too expensive for me.",
    slots: [
      {
        slotId: "item",
        role: "目前談論的商品",
        allowedLexemeIds: ["this", "shirt", "that", "one"],
        allowedChunkIds: ["this-shirt", "that-one"],
      },
      {
        slotId: "be",
        role: "單數 be 動詞",
        allowedLexemeIds: ["be"],
      },
      {
        slotId: "evaluation",
        role: "超出可接受價格",
        allowedLexemeIds: ["too", "expensive"],
        allowedChunkIds: ["too-expensive"],
      },
      {
        slotId: "person",
        role: "評估者",
        allowedLexemeIds: ["for", "me"],
        allowedChunkIds: ["for-me"],
      },
    ],
    examples: [
      {
        id: "a2-u03-l04-transfer-this-shirt",
        sentence: "This shirt is too expensive for me.",
        translation: "這件襯衫對我來說太貴了。",
        hintKeywords: "這件襯衫／太貴／對我來說",
        skeleton: "This shirt is ______ for me.",
        slotValues: [
          slotValue("item", "This shirt", ["this", "shirt"], ["this-shirt"]),
          slotValue("be", "is", ["be"]),
          slotValue("evaluation", "too expensive", ["too", "expensive"], [
            "too-expensive",
          ]),
          slotValue("person", "for me", ["for", "me"], ["for-me"]),
        ],
      },
      {
        id: "a2-u03-l04-transfer-that-one",
        sentence: "That one is too expensive for me.",
        translation: "那一件對我來說太貴了。",
        hintKeywords: "那一件／太貴／對我來說",
        skeleton: "That one is ______ for me.",
        slotValues: [
          slotValue("item", "That one", ["that", "one"], ["that-one"]),
          slotValue("be", "is", ["be"]),
          slotValue("evaluation", "too expensive", ["too", "expensive"], [
            "too-expensive",
          ]),
          slotValue("person", "for me", ["for", "me"], ["for-me"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "have-symptom",
    lessonId: "a2-u04-l01",
    template: "I have a headache {time}.",
    slots: [
      {
        slotId: "symptom",
        role: "描述症狀",
        allowedLexemeIds: ["i", "have", "a", "headache"],
        allowedChunkIds: ["have-a-headache"],
      },
      {
        slotId: "time",
        role: "已學時間",
        allowedLexemeIds: ["today", "at", "night"],
        allowedChunkIds: ["at-night"],
      },
    ],
    examples: [
      {
        id: "a2-u04-l01-transfer-today",
        sentence: "I have a headache today.",
        translation: "我今天頭痛。",
        hintKeywords: "我／頭痛／今天",
        skeleton: "I have a headache ______.",
        slotValues: [
          slotValue("symptom", "I have a headache", ["i", "have", "a", "headache"], [
            "have-a-headache",
          ]),
          slotValue("time", "today", ["today"]),
        ],
      },
      {
        id: "a2-u04-l01-transfer-night",
        sentence: "I have a headache at night.",
        translation: "我晚上頭痛。",
        hintKeywords: "我／頭痛／晚上",
        skeleton: "I have a headache ______.",
        slotValues: [
          slotValue("symptom", "I have a headache", ["i", "have", "a", "headache"], [
            "have-a-headache",
          ]),
          slotValue("time", "at night", ["at", "night"], ["at-night"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "should-advice",
    lessonId: "a2-u04-l02",
    template: "You should drink {content} {context}.",
    slots: [
      {
        slotId: "subject-advice",
        role: "給對方建議",
        allowedLexemeIds: ["you", "should", "drink"],
        allowedChunkIds: ["should-drink"],
      },
      {
        slotId: "content",
        role: "飲用內容",
        allowedLexemeIds: ["more", "water"],
        allowedChunkIds: ["more-water"],
      },
      {
        slotId: "context",
        role: "已學時間或地點",
        allowedLexemeIds: ["at", "home", "night"],
        allowedChunkIds: ["at-home", "at-night"],
      },
    ],
    examples: [
      {
        id: "a2-u04-l02-transfer-home",
        sentence: "You should drink water at home.",
        translation: "你在家應該喝水。",
        hintKeywords: "你／應該喝水／在家",
        skeleton: "You should drink water ______.",
        slotValues: [
          slotValue("subject-advice", "You should drink", ["you", "should", "drink"], [
            "should-drink",
          ]),
          slotValue("content", "water", ["water"]),
          slotValue("context", "at home", ["at", "home"], ["at-home"]),
        ],
      },
      {
        id: "a2-u04-l02-transfer-night",
        sentence: "You should drink more water at night.",
        translation: "你晚上應該多喝水。",
        hintKeywords: "你／應該多喝水／晚上",
        skeleton: "You should drink more water ______.",
        slotValues: [
          slotValue("subject-advice", "You should drink", ["you", "should", "drink"], [
            "should-drink",
          ]),
          slotValue("content", "more water", ["more", "water"], ["more-water"]),
          slotValue("context", "at night", ["at", "night"], ["at-night"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "have-to-necessity",
    lessonId: "a2-u04-l03",
    template: "I have to see a doctor {time}.",
    slots: [
      {
        slotId: "subject-necessity",
        role: "表達自己有必要做某事",
        allowedLexemeIds: ["i", "have", "to"],
        allowedChunkIds: ["have-to"],
      },
      {
        slotId: "medical-action",
        role: "看醫生",
        allowedLexemeIds: ["see", "a", "doctor"],
        allowedChunkIds: ["see-a-doctor"],
      },
      {
        slotId: "time",
        role: "已學時間",
        allowedLexemeIds: ["today", "at", "eight"],
        allowedChunkIds: ["at-eight"],
      },
    ],
    examples: [
      {
        id: "a2-u04-l03-transfer-today",
        sentence: "I have to see a doctor today.",
        translation: "我今天必須去看醫生。",
        hintKeywords: "我／必須看醫生／今天",
        skeleton: "I have to see a doctor ______.",
        slotValues: [
          slotValue("subject-necessity", "I have to", ["i", "have", "to"], [
            "have-to",
          ]),
          slotValue("medical-action", "see a doctor", ["see", "a", "doctor"], [
            "see-a-doctor",
          ]),
          slotValue("time", "today", ["today"]),
        ],
      },
      {
        id: "a2-u04-l03-transfer-eight",
        sentence: "I have to see a doctor at eight.",
        translation: "我八點必須去看醫生。",
        hintKeywords: "我／必須看醫生／八點",
        skeleton: "I have to see a doctor ______.",
        slotValues: [
          slotValue("subject-necessity", "I have to", ["i", "have", "to"], [
            "have-to",
          ]),
          slotValue("medical-action", "see a doctor", ["see", "a", "doctor"], [
            "see-a-doctor",
          ]),
          slotValue("time", "at eight", ["at", "eight"], ["at-eight"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "imperative-after-time",
    lessonId: "a2-u04-l04",
    template: "Take this medicine {time}.",
    slots: [
      {
        slotId: "medicine-action",
        role: "服用指定藥物",
        allowedLexemeIds: ["take", "this", "medicine"],
        allowedChunkIds: ["take-this-medicine"],
      },
      {
        slotId: "time",
        role: "已學服藥時間",
        allowedLexemeIds: ["after", "breakfast", "at", "eight"],
        allowedChunkIds: ["at-eight"],
      },
    ],
    examples: [
      {
        id: "a2-u04-l04-transfer-breakfast",
        sentence: "Take this medicine after breakfast.",
        translation: "早餐後服用這個藥。",
        hintKeywords: "服用這個藥／早餐後",
        skeleton: "Take this medicine ______.",
        slotValues: [
          slotValue(
            "medicine-action",
            "Take this medicine",
            ["take", "this", "medicine"],
            ["take-this-medicine"],
          ),
          slotValue("time", "after breakfast", ["after", "breakfast"]),
        ],
      },
      {
        id: "a2-u04-l04-transfer-eight",
        sentence: "Take this medicine at eight.",
        translation: "八點服用這個藥。",
        hintKeywords: "服用這個藥／八點",
        skeleton: "Take this medicine ______.",
        slotValues: [
          slotValue(
            "medicine-action",
            "Take this medicine",
            ["take", "this", "medicine"],
            ["take-this-medicine"],
          ),
          slotValue("time", "at eight", ["at", "eight"], ["at-eight"]),
        ],
      },
    ],
  }),
];

const recognitionDistractors = {
  "a2-u02-l01": ["你可以搭公車。", "我昨天去了車站。", "火車明天早上九點出發。"],
  "a2-u02-l02": ["你要怎麼去車站？", "我昨天買了火車票。", "你昨天搭了公車。"],
  "a2-u02-l03": ["我明天要買火車票。", "我昨天搭了公車。", "火車昨天九點出發。"],
  "a2-u02-l04": ["火車昨天早上九點出發。", "公車明天早上九點出發。", "火車明天晚上九點出發。"],
  "a2-u03-l01": ["這件襯衫比較便宜。", "這件襯衫有大一點的尺寸嗎？", "這件襯衫對我來說太貴了。"],
  "a2-u03-l02": ["那件襯衫比這件便宜。", "這件襯衫和那件一樣便宜。", "這件襯衫對我來說太貴了。"],
  "a2-u03-l03": ["這件襯衫多少錢？", "這件襯衫比那件便宜。", "你們有那件比較便宜的襯衫嗎？"],
  "a2-u03-l04": ["這對我來說太大了。", "那件襯衫比較便宜。", "我想買這件襯衫。"],
  "a2-u04-l01": ["我今天要看醫生。", "我應該多喝水。", "我晚餐後服藥。"],
  "a2-u04-l02": ["你明天應該看醫生。", "你晚餐後應該服藥。", "你有一點水。"],
  "a2-u04-l03": ["我明天應該多喝水。", "我今天已經看過醫生。", "我明天想去上班。"],
  "a2-u04-l04": ["早餐後服用這個藥。", "晚餐前服用這個藥。", "明天服用這個藥。"],
};

const newLessonIds = [
  "a2-u02-l01",
  "a2-u02-l02",
  "a2-u02-l03",
  "a2-u02-l04",
  "a2-u03-l01",
  "a2-u03-l02",
  "a2-u03-l03",
  "a2-u03-l04",
  "a2-u04-l01",
  "a2-u04-l02",
  "a2-u04-l03",
  "a2-u04-l04",
];

const recognition = newLessonIds.map((lessonId) => {
  const source = sourceForLesson(lessonId);
  const metadata = lessonMetadata(lessonId);
  return {
    id: `recognition-${lessonId}`,
    lessonId,
    sentenceId: source.sentence_id,
    sentencePatternId: source.sentence_pattern_id,
    passageId: source.passage_id,
    type: "english-to-chinese",
    instruction: "請選出最符合英文句子的中文意思。",
    stem: source.sentence,
    ...metadata,
    options: [
      {
        id: "correct",
        text: source.translation,
        sourceSentenceId: source.sentence_id,
      },
      ...recognitionDistractors[lessonId].map((text, index) => ({
        id: `distractor-${index + 1}`,
        text,
      })),
    ],
    correctOptionId: "correct",
    qaStatus,
  };
});

const coreOption = (lessonId, id) => {
  const source = sourceForLesson(lessonId);
  return {
    id,
    text: source.sentence,
    ...lessonMetadata(lessonId),
  };
};
const exampleOption = (example, id) => ({
  id,
  text: example.sentence,
  requiredLexemeIds: example.requiredLexemeIds,
  requiredChunkIds: example.requiredChunkIds,
});
const previousLesson = {
  "a2-u02-l01": "a2-u01-l04",
  "a2-u02-l02": "a2-u02-l01",
  "a2-u02-l03": "a2-u02-l02",
  "a2-u02-l04": "a2-u02-l03",
  "a2-u03-l01": "a2-u02-l04",
  "a2-u03-l02": "a2-u03-l01",
  "a2-u03-l03": "a2-u03-l02",
  "a2-u03-l04": "a2-u03-l03",
  "a2-u04-l01": "a2-u03-l04",
  "a2-u04-l02": "a2-u04-l01",
  "a2-u04-l03": "a2-u04-l02",
  "a2-u04-l04": "a2-u04-l03",
};
const patternByLesson = new Map(
  newPatterns.map((pattern) => [
    pattern.examples[0].practiceLessonId,
    pattern,
  ]),
);
const textResponses = newLessonIds.map((lessonId) => {
  const source = sourceForLesson(lessonId);
  const pattern = patternByLesson.get(lessonId);
  if (!pattern) throw new Error(`找不到 ${lessonId} 的句型換字資料`);
  return {
    id: `response-${lessonId}`,
    lessonId,
    sourceSentenceId: source.sentence_id,
    sentencePatternId: source.sentence_pattern_id,
    passageId: source.passage_id,
    promptLanguage: "zh-Hant",
    prompt: `請選出符合「${source.translation.replace(/[。！？.!?]+$/g, "")}」的英文句子。`,
    targetTranslation: source.translation,
    format: "choice",
    options: [
      coreOption(lessonId, "correct"),
      exampleOption(pattern.examples[0], "transfer-1"),
      exampleOption(pattern.examples[1], "transfer-2"),
      coreOption(previousLesson[lessonId], "previous"),
    ],
    correctOptionId: "correct",
    qaStatus,
  };
});

const passageSentence = (
  id,
  order,
  sentence,
  translation,
  lessonId,
  requiredLexemeIds,
  requiredChunkIds = [],
) => ({
  id,
  order,
  sentence,
  translation,
  lessonId,
  requiredLexemeIds,
  requiredChunkIds,
  qaStatus,
});
const passageQuestion = (
  id,
  sourceSentenceId,
  question,
  options,
  correctAnswer,
  evidenceSentenceIds = [sourceSentenceId],
) => ({
  id,
  sourceSentenceId,
  questionLanguage: "zh-Hant",
  question,
  options,
  correctAnswer,
  evidenceSentenceIds,
  qaStatus,
});

const newPassages = [
  {
    passageId: "a2-u02-p01",
    level: "A2",
    qaStatus,
    sentences: [
      passageSentence(
        "a2-u02-p01-s01",
        1,
        "I am going to the station tomorrow.",
        "我明天要去車站。",
        "a2-u02-l04",
        ["i", "be", "go", "to", "the", "station", "tomorrow"],
        ["going-to", "the-station"],
      ),
      passageSentence(
        "a2-u02-p01-s02",
        2,
        "I can take the bus.",
        "我可以搭公車。",
        "a2-u02-l04",
        ["i", "can", "take", "the", "bus"],
        ["take-the-bus"],
      ),
      passageSentence(
        "a2-u02-p01-s03",
        3,
        "I bought a train ticket yesterday.",
        "我昨天買了一張火車票。",
        "a2-u02-l04",
        ["i", "buy", "a", "train", "ticket", "yesterday"],
        ["bought-a-train-ticket"],
      ),
      passageSentence(
        "a2-u02-p01-s04",
        4,
        "The train leaves at nine tomorrow morning.",
        "火車明天早上九點出發。",
        "a2-u02-l04",
        ["the", "train", "leave", "at", "nine", "tomorrow", "morning"],
        ["the-train", "leaves-at-nine", "tomorrow-morning"],
      ),
    ],
    questions: [
      passageQuestion(
        "a2-u02-p01-q01",
        "a2-u02-p01-s01",
        "這個人明天要去哪裡？",
        ["To the station.", "To the store.", "To school.", "To work."],
        "To the station.",
      ),
      passageQuestion(
        "a2-u02-p01-q02",
        "a2-u02-p01-s02",
        "這個人可以搭什麼交通工具？",
        ["Take the bus.", "Take the train.", "Go to school.", "Go to work."],
        "Take the bus.",
      ),
      passageQuestion(
        "a2-u02-p01-q03",
        "a2-u02-p01-s03",
        "這個人昨天買了什麼？",
        ["A train ticket.", "A book.", "An apple.", "A shirt."],
        "A train ticket.",
      ),
      passageQuestion(
        "a2-u02-p01-q04",
        "a2-u02-p01-s04",
        "火車什麼時候出發？",
        [
          "At nine tomorrow morning.",
          "At eight tomorrow morning.",
          "At nine tonight.",
          "At seven today.",
        ],
        "At nine tomorrow morning.",
      ),
      passageQuestion(
        "a2-u02-p01-q05",
        "a2-u02-p01-s01",
        "根據前兩句，這個人搭公車是要去哪裡？",
        ["To the station.", "To the store.", "To school.", "To work."],
        "To the station.",
        ["a2-u02-p01-s01", "a2-u02-p01-s02"],
      ),
    ],
  },
  {
    passageId: "a2-u03-p01",
    level: "A2",
    qaStatus,
    sentences: [
      passageSentence(
        "a2-u03-p01-s01",
        1,
        "I want this shirt.",
        "我想要這件襯衫。",
        "a2-u03-l04",
        ["i", "want", "this", "shirt"],
        ["this-shirt"],
      ),
      passageSentence(
        "a2-u03-p01-s02",
        2,
        "This shirt is cheaper than that one.",
        "這件襯衫比那件便宜。",
        "a2-u03-l04",
        ["this", "shirt", "be", "cheap", "than", "that", "one"],
        ["this-shirt", "cheaper-than", "that-one"],
      ),
      passageSentence(
        "a2-u03-p01-s03",
        3,
        "I want a larger size.",
        "我想要大一點的尺寸。",
        "a2-u03-l04",
        ["i", "want", "a", "large", "size"],
        ["a-larger-size"],
      ),
      passageSentence(
        "a2-u03-p01-s04",
        4,
        "It is too expensive for me.",
        "這對我來說太貴了。",
        "a2-u03-l04",
        ["it", "be", "too", "expensive", "for", "me"],
        ["too-expensive", "for-me"],
      ),
    ],
    questions: [
      passageQuestion(
        "a2-u03-p01-q01",
        "a2-u03-p01-s01",
        "這個人想要哪一件商品？",
        ["This shirt.", "That book.", "An apple.", "A train ticket."],
        "This shirt.",
      ),
      passageQuestion(
        "a2-u03-p01-q02",
        "a2-u03-p01-s02",
        "哪一件襯衫比較便宜？",
        ["This shirt.", "That one.", "Both shirts.", "The passage does not say."],
        "This shirt.",
      ),
      passageQuestion(
        "a2-u03-p01-q03",
        "a2-u03-p01-s03",
        "這個人想要什麼尺寸？",
        ["A larger size.", "A smaller size.", "A train ticket.", "More water."],
        "A larger size.",
      ),
      passageQuestion(
        "a2-u03-p01-q04",
        "a2-u03-p01-s04",
        "根據第一句和第四句，這個人可能為什麼不買？",
        ["Too expensive.", "Too small.", "No ticket.", "No bus."],
        "Too expensive.",
        ["a2-u03-p01-s01", "a2-u03-p01-s04"],
      ),
    ],
  },
  {
    passageId: "a2-u04-p01",
    level: "A2",
    qaStatus,
    sentences: [
      passageSentence(
        "a2-u04-p01-s01",
        1,
        "I have a headache today.",
        "我今天頭痛。",
        "a2-u04-l04",
        ["i", "have", "a", "headache", "today"],
        ["have-a-headache"],
      ),
      passageSentence(
        "a2-u04-p01-s02",
        2,
        "You should drink more water.",
        "你應該多喝一點水。",
        "a2-u04-l04",
        ["you", "should", "drink", "more", "water"],
        ["should-drink", "more-water"],
      ),
      passageSentence(
        "a2-u04-p01-s03",
        3,
        "I have to see a doctor tomorrow.",
        "我明天必須去看醫生。",
        "a2-u04-l04",
        ["i", "have", "to", "see", "a", "doctor", "tomorrow"],
        ["have-to", "see-a-doctor"],
      ),
      passageSentence(
        "a2-u04-p01-s04",
        4,
        "Take this medicine after dinner.",
        "晚餐後服用這個藥。",
        "a2-u04-l04",
        ["take", "this", "medicine", "after", "dinner"],
        ["take-this-medicine", "after-dinner"],
      ),
    ],
    questions: [
      passageQuestion(
        "a2-u04-p01-q01",
        "a2-u04-p01-s01",
        "這個人今天哪裡不舒服？",
        ["A headache.", "A cold.", "A larger size.", "More water."],
        "A headache.",
      ),
      passageQuestion(
        "a2-u04-p01-q02",
        "a2-u04-p01-s02",
        "對方給了什麼建議？",
        ["Drink more water.", "Take the bus.", "Buy a shirt.", "Go to work."],
        "Drink more water.",
      ),
      passageQuestion(
        "a2-u04-p01-q03",
        "a2-u04-p01-s03",
        "這個人什麼時候要看醫生？",
        ["Tomorrow.", "Today.", "Last night.", "After dinner."],
        "Tomorrow.",
      ),
      passageQuestion(
        "a2-u04-p01-q04",
        "a2-u04-p01-s04",
        "這個藥要什麼時候服用？",
        ["After dinner.", "After breakfast.", "At seven.", "Tomorrow morning."],
        "After dinner.",
      ),
      passageQuestion(
        "a2-u04-p01-q05",
        "a2-u04-p01-s01",
        "根據第一句和第三句，這個人為什麼要看醫生？",
        ["A headache.", "A train ticket.", "A larger size.", "A bus."],
        "A headache.",
        ["a2-u04-p01-s01", "a2-u04-p01-s03"],
      ),
    ],
  },
];

patternData.patterns = [
  ...patternData.patterns.filter((pattern) =>
    pattern.examples.every((example) =>
      example.practiceLessonId.startsWith("a2-u01-"),
    ),
  ),
  ...newPatterns,
];
readingData.recognition = [
  ...readingData.recognition.filter((exercise) =>
    exercise.lessonId.startsWith("a2-u01-"),
  ),
  ...recognition,
];
readingData.textResponses = [
  ...readingData.textResponses.filter((exercise) =>
    exercise.lessonId.startsWith("a2-u01-"),
  ),
  ...textResponses,
];
readingData.passages = [
  ...readingData.passages.filter(
    (passage) => passage.passageId === "a2-u01-p01",
  ),
  ...newPassages,
];

fs.writeFileSync(
  path.join(root, "public/data/a2-pattern-exercises.json"),
  `${JSON.stringify(patternData, null, 2)}\n`,
  "utf8",
);
fs.writeFileSync(
  path.join(root, "public/data/a2-reading-exercises.json"),
  `${JSON.stringify(readingData, null, 2)}\n`,
  "utf8",
);
