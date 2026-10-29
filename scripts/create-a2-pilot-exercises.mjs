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
  makePattern({
    id: "present-continuous-arrangement",
    lessonId: "a2-u05-l01",
    template: "I am meeting {person} at ten tomorrow.",
    slots: [
      {
        slotId: "arrangement",
        role: "已安排的見面",
        allowedLexemeIds: ["i", "be", "meet"],
      },
      {
        slotId: "person",
        role: "已學人物",
        allowedLexemeIds: ["my", "manager", "friend", "wife"],
      },
      {
        slotId: "time",
        role: "已學時間",
        allowedLexemeIds: ["at", "ten", "tomorrow"],
        allowedChunkIds: ["at-ten-tomorrow"],
      },
    ],
    examples: [
      {
        id: "a2-u05-l01-transfer-friend",
        sentence: "I am meeting my friend at ten tomorrow.",
        translation: "我明天十點要和朋友見面。",
        hintKeywords: "我／要和朋友見面／明天十點",
        skeleton: "I am meeting my ______ at ten tomorrow.",
        slotValues: [
          slotValue("arrangement", "I am meeting", ["i", "be", "meet"]),
          slotValue("person", "my friend", ["my", "friend"]),
          slotValue("time", "at ten tomorrow", ["at", "ten", "tomorrow"], [
            "at-ten-tomorrow",
          ]),
        ],
      },
      {
        id: "a2-u05-l01-transfer-wife",
        sentence: "I am meeting my wife at ten tomorrow.",
        translation: "我明天十點要和太太見面。",
        hintKeywords: "我／要和太太見面／明天十點",
        skeleton: "I am meeting my ______ at ten tomorrow.",
        slotValues: [
          slotValue("arrangement", "I am meeting", ["i", "be", "meet"]),
          slotValue("person", "my wife", ["my", "wife"]),
          slotValue("time", "at ten tomorrow", ["at", "ten", "tomorrow"], [
            "at-ten-tomorrow",
          ]),
        ],
      },
    ],
  }),
  makePattern({
    id: "can-we-meet-day-time",
    lessonId: "a2-u05-l02",
    template: "Can we meet on {day} afternoon?",
    slots: [
      {
        slotId: "request",
        role: "提出共同見面安排",
        allowedLexemeIds: ["can", "we", "meet"],
        allowedChunkIds: ["can-we-meet"],
      },
      {
        slotId: "day-time",
        role: "已學星期與時段",
        allowedLexemeIds: ["on", "tuesday", "monday", "friday", "afternoon"],
      },
    ],
    examples: [
      {
        id: "a2-u05-l02-transfer-monday",
        sentence: "Can we meet on Monday afternoon?",
        translation: "我們可以星期一下午見面嗎？",
        hintKeywords: "我們可以見面嗎／星期一下午",
        skeleton: "Can we meet on ______ afternoon?",
        slotValues: [
          slotValue("request", "Can we meet", ["can", "we", "meet"], [
            "can-we-meet",
          ]),
          slotValue("day-time", "on Monday afternoon", [
            "on",
            "monday",
            "afternoon",
          ]),
        ],
      },
      {
        id: "a2-u05-l02-transfer-friday",
        sentence: "Can we meet on Friday afternoon?",
        translation: "我們可以星期五下午見面嗎？",
        hintKeywords: "我們可以見面嗎／星期五下午",
        skeleton: "Can we meet on ______ afternoon?",
        slotValues: [
          slotValue("request", "Can we meet", ["can", "we", "meet"], [
            "can-we-meet",
          ]),
          slotValue("day-time", "on Friday afternoon", [
            "on",
            "friday",
            "afternoon",
          ]),
        ],
      },
    ],
  }),
  makePattern({
    id: "have-meeting-at-time",
    lessonId: "a2-u05-l03",
    template: "I have a meeting at {time}.",
    slots: [
      {
        slotId: "schedule",
        role: "說明已有會議",
        allowedLexemeIds: ["i", "have", "a", "meeting"],
        allowedChunkIds: ["have-a-meeting"],
      },
      {
        slotId: "time",
        role: "已學鐘點",
        allowedLexemeIds: ["at", "three", "seven", "eight", "ten"],
        allowedChunkIds: ["at-three", "at-seven", "at-eight"],
      },
    ],
    examples: [
      {
        id: "a2-u05-l03-transfer-seven",
        sentence: "I have a meeting at seven.",
        translation: "我七點有一個會議。",
        hintKeywords: "我／有會議／七點",
        skeleton: "I have a meeting at ______.",
        slotValues: [
          slotValue("schedule", "I have a meeting", ["i", "have", "a", "meeting"], [
            "have-a-meeting",
          ]),
          slotValue("time", "at seven", ["at", "seven"], ["at-seven"]),
        ],
      },
      {
        id: "a2-u05-l03-transfer-eight",
        sentence: "I have a meeting at eight.",
        translation: "我八點有一個會議。",
        hintKeywords: "我／有會議／八點",
        skeleton: "I have a meeting at ______.",
        slotValues: [
          slotValue("schedule", "I have a meeting", ["i", "have", "a", "meeting"], [
            "have-a-meeting",
          ]),
          slotValue("time", "at eight", ["at", "eight"], ["at-eight"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "can-move-meeting-to-day",
    lessonId: "a2-u05-l04",
    template: "Can we move the meeting to {day}?",
    slots: [
      {
        slotId: "request",
        role: "共同提出改約",
        allowedLexemeIds: ["can", "we"],
      },
      {
        slotId: "event",
        role: "更改已知會議",
        allowedLexemeIds: ["move", "the", "meeting"],
        allowedChunkIds: ["move-the-meeting"],
      },
      {
        slotId: "new-day",
        role: "新的星期",
        allowedLexemeIds: ["to", "friday", "tuesday", "monday"],
      },
    ],
    examples: [
      {
        id: "a2-u05-l04-transfer-tuesday",
        sentence: "Can we move the meeting to Tuesday?",
        translation: "我們可以把會議改到星期二嗎？",
        hintKeywords: "我們可以／把會議改到／星期二",
        skeleton: "Can we move the meeting to ______?",
        slotValues: [
          slotValue("request", "Can we", ["can", "we"]),
          slotValue("event", "move the meeting", ["move", "the", "meeting"], [
            "move-the-meeting",
          ]),
          slotValue("new-day", "to Tuesday", ["to", "tuesday"]),
        ],
      },
      {
        id: "a2-u05-l04-transfer-monday",
        sentence: "Can we move the meeting to Monday?",
        translation: "我們可以把會議改到星期一嗎？",
        hintKeywords: "我們可以／把會議改到／星期一",
        skeleton: "Can we move the meeting to ______?",
        slotValues: [
          slotValue("request", "Can we", ["can", "we"]),
          slotValue("event", "move the meeting", ["move", "the", "meeting"], [
            "move-the-meeting",
          ]),
          slotValue("new-day", "to Monday", ["to", "monday"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "frequency-routine",
    lessonId: "a2-u06-l01",
    template: "{subject} usually clean {object}.",
    slots: [
      {
        slotId: "subject",
        role: "日常習慣的主詞",
        allowedLexemeIds: ["i", "we"],
      },
      {
        slotId: "frequency-action",
        role: "頻率與家務動作",
        allowedLexemeIds: ["usually", "clean"],
        allowedChunkIds: ["usually-clean"],
      },
      {
        slotId: "object",
        role: "已學家務對象",
        allowedLexemeIds: ["my", "the", "room"],
        allowedChunkIds: [],
      },
    ],
    examples: [
      {
        id: "a2-u06-l01-transfer-the-room",
        sentence: "I usually clean the room.",
        translation: "我通常整理那個房間。",
        hintKeywords: "我／通常／整理房間",
        skeleton: "I usually clean ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("frequency-action", "usually clean", ["usually", "clean"], ["usually-clean"]),
          slotValue("object", "the room", ["the", "room"]),
        ],
      },
      {
        id: "a2-u06-l01-transfer-we",
        sentence: "We usually clean the room.",
        translation: "我們通常整理那個房間。",
        hintKeywords: "我們／通常／整理房間",
        skeleton: "We usually clean ______.",
        slotValues: [
          slotValue("subject", "We", ["we"]),
          slotValue("frequency-action", "usually clean", ["usually", "clean"], ["usually-clean"]),
          slotValue("object", "the room", ["the", "room"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "have-to-chore",
    lessonId: "a2-u06-l02",
    template: "{subject} have to {action} {object}.",
    slots: [
      {
        slotId: "subject",
        role: "必須做家務的主詞",
        allowedLexemeIds: ["i", "we"],
      },
      {
        slotId: "necessity",
        role: "表示必須",
        allowedLexemeIds: ["have", "to"],
        allowedChunkIds: ["have-to"],
      },
      {
        slotId: "action",
        role: "家務動作",
        allowedLexemeIds: ["wash", "clean"],
      },
      {
        slotId: "object",
        role: "家務對象",
        allowedLexemeIds: ["the", "dish", "room"],
        allowedChunkIds: ["wash-the-dishes"],
      },
    ],
    examples: [
      {
        id: "a2-u06-l02-transfer-clean-room",
        sentence: "I have to clean the room.",
        translation: "我必須整理房間。",
        hintKeywords: "我／必須／整理房間",
        skeleton: "I have to ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("necessity", "have to", ["have", "to"], ["have-to"]),
          slotValue("action", "clean", ["clean"]),
          slotValue("object", "the room", ["the", "room"]),
        ],
      },
      {
        id: "a2-u06-l02-transfer-we-dishes",
        sentence: "We have to wash the dishes.",
        translation: "我們必須洗碗。",
        hintKeywords: "我們／必須／洗碗",
        skeleton: "We have to ______.",
        slotValues: [
          slotValue("subject", "We", ["we"]),
          slotValue("necessity", "have to", ["have", "to"], ["have-to"]),
          slotValue("action", "wash", ["wash"]),
          slotValue("object", "the dishes", ["the", "dish"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "can-help-with",
    lessonId: "a2-u06-l03",
    template: "Can you help me with {task}?",
    slots: [
      {
        slotId: "request",
        role: "請求對方幫忙",
        allowedLexemeIds: ["can", "you", "help", "me"],
        allowedChunkIds: ["can-you-help"],
      },
      {
        slotId: "task",
        role: "需要協助的家務",
        allowedLexemeIds: ["with", "the", "laundry", "dish", "my"],
        allowedChunkIds: ["with-the-laundry"],
      },
    ],
    examples: [
      {
        id: "a2-u06-l03-transfer-dishes",
        sentence: "Can you help me with the dishes?",
        translation: "你可以幫我洗碗嗎？",
        hintKeywords: "你可以幫我嗎／洗碗",
        skeleton: "Can you help me with ______?",
        slotValues: [
          slotValue("request", "Can you help me", ["can", "you", "help", "me"], ["can-you-help"]),
          slotValue("task", "with the dishes", ["with", "the", "dish"]),
        ],
      },
      {
        id: "a2-u06-l03-transfer-my-laundry",
        sentence: "Can you help me with my laundry?",
        translation: "你可以幫忙洗我的衣服嗎？",
        hintKeywords: "你可以幫忙嗎／我的衣服",
        skeleton: "Can you help me with ______?",
        slotValues: [
          slotValue("request", "Can you help me", ["can", "you", "help", "me"], ["can-you-help"]),
          slotValue("task", "with my laundry", ["with", "my", "laundry"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "clean-house-day",
    lessonId: "a2-u06-l04",
    template: "{subject} clean {object} on {day}.",
    slots: [
      {
        slotId: "subject",
        role: "家務習慣的主詞",
        allowedLexemeIds: ["i", "we"],
      },
      {
        slotId: "action-object",
        role: "打掃的地方",
        allowedLexemeIds: ["clean", "the", "house", "room"],
        allowedChunkIds: ["clean-the-house"],
      },
      {
        slotId: "day",
        role: "家務日期",
        allowedLexemeIds: ["on", "saturday", "friday", "monday"],
        allowedChunkIds: ["on-saturday"],
      },
    ],
    examples: [
      {
        id: "a2-u06-l04-transfer-room",
        sentence: "I clean the room on Saturday.",
        translation: "我星期六整理房間。",
        hintKeywords: "我／整理房間／星期六",
        skeleton: "I clean the room on ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("action-object", "clean the room", ["clean", "the", "room"]),
          slotValue("day", "on Saturday", ["on", "saturday"], ["on-saturday"]),
        ],
      },
      {
        id: "a2-u06-l04-transfer-friday",
        sentence: "We clean the house on Friday.",
        translation: "我們星期五打掃房子。",
        hintKeywords: "我們／打掃房子／星期五",
        skeleton: "We clean the house on ______.",
        slotValues: [
          slotValue("subject", "We", ["we"]),
          slotValue("action-object", "clean the house", ["clean", "the", "house"], ["clean-the-house"]),
          slotValue("day", "on Friday", ["on", "friday"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "present-perfect-experience",
    lessonId: "a2-u07-l01",
    template: "{subject} have been to {place}.",
    slots: [
      {
        slotId: "subject",
        role: "分享經驗的主詞",
        allowedLexemeIds: ["i", "we"],
      },
      {
        slotId: "experience",
        role: "表示曾經去過",
        allowedLexemeIds: ["have", "be", "to"],
        allowedChunkIds: ["have-been-to"],
      },
      {
        slotId: "place",
        role: "曾經去過的地點",
        allowedLexemeIds: ["taiwan", "that", "store", "school", "station"],
      },
    ],
    examples: [
      {
        id: "a2-u07-l01-transfer-we",
        sentence: "We have been to Taiwan.",
        translation: "我們去過台灣。",
        hintKeywords: "我們／曾經去過／台灣",
        skeleton: "We have been to ______.",
        slotValues: [
          slotValue("subject", "We", ["we"]),
          slotValue("experience", "have been to", ["have", "be", "to"], ["have-been-to"]),
          slotValue("place", "Taiwan.", ["taiwan"]),
        ],
      },
      {
        id: "a2-u07-l01-transfer-store",
        sentence: "I have been to that store.",
        translation: "我去過那間商店。",
        hintKeywords: "我／曾經去過／那間商店",
        skeleton: "I have been to ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("experience", "have been to", ["have", "be", "to"], ["have-been-to"]),
          slotValue("place", "that store.", ["that", "store"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "present-perfect-experience-question",
    lessonId: "a2-u07-l02",
    template: "Have you been to {place} before?",
    slots: [
      {
        slotId: "question",
        role: "詢問對方是否有經驗",
        allowedLexemeIds: ["have", "you"],
      },
      {
        slotId: "experience",
        role: "表示曾經去過",
        allowedLexemeIds: ["be", "to"],
        allowedChunkIds: ["been-to"],
      },
      {
        slotId: "place",
        role: "詢問曾經去過的地點",
        allowedLexemeIds: ["taiwan", "that", "store", "this", "station"],
      },
      {
        slotId: "time",
        role: "詢問是否曾經發生",
        allowedLexemeIds: ["before"],
      },
    ],
    examples: [
      {
        id: "a2-u07-l02-transfer-store",
        sentence: "Have you been to that store before?",
        translation: "你以前去過那間商店嗎？",
        hintKeywords: "你／以前去過／那間商店嗎",
        skeleton: "Have you been to ______ before?",
        slotValues: [
          slotValue("question", "Have you", ["have", "you"]),
          slotValue("experience", "been to", ["be", "to"], ["been-to"]),
          slotValue("place", "that store", ["that", "store"]),
          slotValue("time", "before?", ["before"]),
        ],
      },
      {
        id: "a2-u07-l02-transfer-station",
        sentence: "Have you been to this station before?",
        translation: "你以前去過這個車站嗎？",
        hintKeywords: "你／以前去過／這個車站嗎",
        skeleton: "Have you been to ______ before?",
        slotValues: [
          slotValue("question", "Have you", ["have", "you"]),
          slotValue("experience", "been to", ["be", "to"], ["been-to"]),
          slotValue("place", "this station", ["this", "station"]),
          slotValue("time", "before?", ["before"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "be-change-now",
    lessonId: "a2-u07-l03",
    template: "{subject} is different now.",
    slots: [
      {
        slotId: "subject",
        role: "描述改變的主詞",
        allowedLexemeIds: ["my", "life", "room", "house"],
      },
      {
        slotId: "be",
        role: "現在狀態的 be 動詞",
        allowedLexemeIds: ["be"],
      },
      {
        slotId: "change",
        role: "描述現在已不同",
        allowedLexemeIds: ["different", "now"],
        allowedChunkIds: ["different-now"],
      },
    ],
    examples: [
      {
        id: "a2-u07-l03-transfer-room",
        sentence: "My room is different now.",
        translation: "我的房間現在不一樣了。",
        hintKeywords: "我的房間／現在／不一樣",
        skeleton: "My ______ is different now.",
        slotValues: [
          slotValue("subject", "My room", ["my", "room"]),
          slotValue("be", "is", ["be"]),
          slotValue("change", "different now.", ["different", "now"], ["different-now"]),
        ],
      },
      {
        id: "a2-u07-l03-transfer-house",
        sentence: "My house is different now.",
        translation: "我的房子現在不一樣了。",
        hintKeywords: "我的房子／現在／不一樣",
        skeleton: "My ______ is different now.",
        slotValues: [
          slotValue("subject", "My house", ["my", "house"]),
          slotValue("be", "is", ["be"]),
          slotValue("change", "different now.", ["different", "now"], ["different-now"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "have-new-state-now",
    lessonId: "a2-u07-l04",
    template: "I have a new {item} now.",
    slots: [
      {
        slotId: "subject",
        role: "擁有新事物的主詞",
        allowedLexemeIds: ["i"],
      },
      {
        slotId: "possession",
        role: "表示擁有",
        allowedLexemeIds: ["have", "a"],
      },
      {
        slotId: "item",
        role: "新事物",
        allowedLexemeIds: ["new", "job", "book", "bag"],
        allowedChunkIds: ["new-job"],
      },
      {
        slotId: "time",
        role: "現在的時間",
        allowedLexemeIds: ["now"],
      },
    ],
    examples: [
      {
        id: "a2-u07-l04-transfer-book",
        sentence: "I have a new book now.",
        translation: "我現在有一本新書。",
        hintKeywords: "我／有一本新書／現在",
        skeleton: "I have a new ______ now.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("possession", "have a", ["have", "a"]),
          slotValue("item", "new book", ["new", "book"]),
          slotValue("time", "now.", ["now"]),
        ],
      },
      {
        id: "a2-u07-l04-transfer-bag",
        sentence: "I have a new bag now.",
        translation: "我現在有一個新包包。",
        hintKeywords: "我／有一個新包包／現在",
        skeleton: "I have a new ______ now.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("possession", "have a", ["have", "a"]),
          slotValue("item", "new bag", ["new", "bag"]),
          slotValue("time", "now.", ["now"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "have-problem-context",
    lessonId: "a2-u08-l01",
    template: "I have a problem {context}.",
    slots: [
      {
        slotId: "problem",
        role: "描述問題",
        allowedLexemeIds: ["i", "have", "a", "problem"],
        allowedChunkIds: ["have-a-problem"],
      },
      {
        slotId: "context",
        role: "問題發生的地點",
        allowedLexemeIds: ["at", "work", "home", "school"],
        allowedChunkIds: ["at-work", "at-home"],
      },
    ],
    examples: [
      {
        id: "a2-u08-l01-transfer-home",
        sentence: "I have a problem at home.",
        translation: "我在家遇到一個問題。",
        hintKeywords: "我／有一個問題／在家",
        skeleton: "I have a problem ______.",
        slotValues: [
          slotValue("problem", "I have a problem", ["i", "have", "a", "problem"], ["have-a-problem"]),
          slotValue("context", "at home", ["at", "home"], ["at-home"]),
        ],
      },
      {
        id: "a2-u08-l01-transfer-school",
        sentence: "I have a problem at school.",
        translation: "我在學校遇到一個問題。",
        hintKeywords: "我／有一個問題／在學校",
        skeleton: "I have a problem ______.",
        slotValues: [
          slotValue("problem", "I have a problem", ["i", "have", "a", "problem"], ["have-a-problem"]),
          slotValue("context", "at school", ["at", "school"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "because-reason",
    lessonId: "a2-u08-l02",
    template: "I am tired because I {action} {time}.",
    slots: [
      {
        slotId: "state",
        role: "描述感受",
        allowedLexemeIds: ["i", "be", "tire"],
      },
      {
        slotId: "reason",
        role: "說明原因",
        allowedLexemeIds: ["because"],
      },
      {
        slotId: "action",
        role: "造成疲累的活動",
        allowedLexemeIds: ["i", "work", "clean"],
      },
      {
        slotId: "time",
        role: "活動時間",
        allowedLexemeIds: ["at", "night", "on", "saturday"],
        allowedChunkIds: ["at-night", "on-saturday"],
      },
    ],
    examples: [
      {
        id: "a2-u08-l02-transfer-clean-night",
        sentence: "I am tired because I clean at night.",
        translation: "我因為晚上整理而很累。",
        hintKeywords: "我很累／因為／晚上整理",
        skeleton: "I am tired because I ______ at night.",
        slotValues: [
          slotValue("state", "I am tired", ["i", "be", "tire"]),
          slotValue("reason", "because", ["because"]),
          slotValue("action", "I clean", ["i", "clean"]),
          slotValue("time", "at night", ["at", "night"], ["at-night"]),
        ],
      },
      {
        id: "a2-u08-l02-transfer-work-saturday",
        sentence: "I am tired because I work on Saturday.",
        translation: "我因為星期六工作而很累。",
        hintKeywords: "我很累／因為／星期六工作",
        skeleton: "I am tired because I ______ on Saturday.",
        slotValues: [
          slotValue("state", "I am tired", ["i", "be", "tire"]),
          slotValue("reason", "because", ["because"]),
          slotValue("action", "I work", ["i", "work"]),
          slotValue("time", "on Saturday", ["on", "saturday"], ["on-saturday"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "should-advice-action",
    lessonId: "a2-u08-l03",
    template: "{subject} should take a break.",
    slots: [
      {
        slotId: "subject",
        role: "提出建議的主詞",
        allowedLexemeIds: ["i", "you", "we"],
      },
      {
        slotId: "advice",
        role: "提出應該做的事",
        allowedLexemeIds: ["should"],
      },
      {
        slotId: "action",
        role: "建議的休息行動",
        allowedLexemeIds: ["take", "a", "break"],
        allowedChunkIds: ["take-a-break"],
      },
    ],
    examples: [
      {
        id: "a2-u08-l03-transfer-i",
        sentence: "I should take a break.",
        translation: "我應該休息一下。",
        hintKeywords: "我／應該／休息一下",
        skeleton: "I should ______.",
        slotValues: [
          slotValue("subject", "I", ["i"]),
          slotValue("advice", "should", ["should"]),
          slotValue("action", "take a break", ["take", "a", "break"], ["take-a-break"]),
        ],
      },
      {
        id: "a2-u08-l03-transfer-we",
        sentence: "We should take a break.",
        translation: "我們應該休息一下。",
        hintKeywords: "我們／應該／休息一下",
        skeleton: "We should ______.",
        slotValues: [
          slotValue("subject", "We", ["we"]),
          slotValue("advice", "should", ["should"]),
          slotValue("action", "take a break", ["take", "a", "break"], ["take-a-break"]),
        ],
      },
    ],
  }),
  makePattern({
    id: "be-so-action",
    lessonId: "a2-u08-l04",
    template: "I am tired, so I take a break{context}.",
    slots: [
      {
        slotId: "state",
        role: "描述疲累狀態",
        allowedLexemeIds: ["i", "be", "tire"],
      },
      {
        slotId: "result",
        role: "表示結果",
        allowedLexemeIds: ["so"],
      },
      {
        slotId: "action",
        role: "採取休息行動",
        allowedLexemeIds: ["i", "take", "a", "break"],
        allowedChunkIds: ["take-a-break"],
      },
      {
        slotId: "context",
        role: "休息地點或時間",
        allowedLexemeIds: ["at", "home", "now"],
        allowedChunkIds: ["at-home"],
      },
    ],
    examples: [
      {
        id: "a2-u08-l04-transfer-home",
        sentence: "I am tired, so I take a break at home.",
        translation: "我很累，所以在家休息一下。",
        hintKeywords: "我很累／所以／在家休息",
        skeleton: "I am tired, so I take a break ______.",
        slotValues: [
          slotValue("state", "I am tired", ["i", "be", "tire"]),
          slotValue("result", "so", ["so"]),
          slotValue("action", "I take a break", ["i", "take", "a", "break"], ["take-a-break"]),
          slotValue("context", "at home", ["at", "home"], ["at-home"]),
        ],
      },
      {
        id: "a2-u08-l04-transfer-now",
        sentence: "I am tired, so I take a break now.",
        translation: "我很累，所以現在休息一下。",
        hintKeywords: "我很累／所以／現在休息",
        skeleton: "I am tired, so I take a break ______.",
        slotValues: [
          slotValue("state", "I am tired", ["i", "be", "tire"]),
          slotValue("result", "so", ["so"]),
          slotValue("action", "I take a break", ["i", "take", "a", "break"], ["take-a-break"]),
          slotValue("context", "now", ["now"]),
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
  "a2-u05-l01": ["我明天十點要去上班。", "我今天三點有一個會議。", "我星期二下午要和朋友見面。"],
  "a2-u05-l02": ["我們可以星期五下午見面嗎？", "我明天十點要和主管見面。", "我們可以把會議改到星期二嗎？"],
  "a2-u05-l03": ["我明天三點要看醫生。", "我星期二下午要和朋友見面。", "我八點去上班。"],
  "a2-u05-l04": ["我們可以星期五下午見面嗎？", "我明天十點要和主管見面。", "我三點有一個會議。"],
  "a2-u06-l01": ["我三點有一個會議。", "我明天十點要和主管見面。", "我昨晚看了電視。"],
  "a2-u06-l02": ["我通常整理我的房間。", "我們可以星期二下午見面嗎？", "我三點有一個會議。"],
  "a2-u06-l03": ["我必須洗碗。", "我通常整理我的房間。", "我們可以星期二下午見面嗎？"],
  "a2-u06-l04": ["我通常整理我的房間。", "我必須洗碗。", "你可以幫我洗衣服嗎？"],
  "a2-u07-l01": ["我以前看過這個房間。", "我的生活現在不一樣了。", "我現在有一份新工作。"],
  "a2-u07-l02": ["我去過台灣。", "我通常星期六整理房間。", "我明天要去上班。"],
  "a2-u07-l03": ["我去過那間商店。", "你以前去過這個車站嗎？", "我現在有一本新書。"],
  "a2-u07-l04": ["你以前去過台灣嗎？", "我的房間現在不一樣了。", "我通常星期六整理房間。"],
  "a2-u08-l01": ["我在家遇到一個問題。", "我因為晚上工作而很累。", "你應該休息一下。"],
  "a2-u08-l02": ["我在工作上遇到一個問題。", "你應該休息一下。", "我很累，所以休息一下。"],
  "a2-u08-l03": ["我在工作上遇到一個問題。", "我因為晚上工作而很累。", "我現在有一份新工作。"],
  "a2-u08-l04": ["我因為晚上工作而很累。", "你應該休息一下。", "我在工作上遇到一個問題。"],
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
  "a2-u05-l01",
  "a2-u05-l02",
  "a2-u05-l03",
  "a2-u05-l04",
  "a2-u06-l01",
  "a2-u06-l02",
  "a2-u06-l03",
  "a2-u06-l04",
  "a2-u07-l01",
  "a2-u07-l02",
  "a2-u07-l03",
  "a2-u07-l04",
  "a2-u08-l01",
  "a2-u08-l02",
  "a2-u08-l03",
  "a2-u08-l04",
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
  "a2-u05-l01": "a2-u04-l04",
  "a2-u05-l02": "a2-u05-l01",
  "a2-u05-l03": "a2-u05-l02",
  "a2-u05-l04": "a2-u05-l03",
  "a2-u06-l01": "a2-u05-l04",
  "a2-u06-l02": "a2-u06-l01",
  "a2-u06-l03": "a2-u06-l02",
  "a2-u06-l04": "a2-u06-l03",
  "a2-u07-l01": "a2-u06-l04",
  "a2-u07-l02": "a2-u07-l01",
  "a2-u07-l03": "a2-u07-l02",
  "a2-u07-l04": "a2-u07-l03",
  "a2-u08-l01": "a2-u07-l04",
  "a2-u08-l02": "a2-u08-l01",
  "a2-u08-l03": "a2-u08-l02",
  "a2-u08-l04": "a2-u08-l03",
};
const responseDistractorLessons = {
  // Keep the unit 8 lesson 4 choices semantically distinct from the target
  // instead of using transfer sentences that only add a location/time detail.
  "a2-u08-l04": ["a2-u08-l02", "a2-u08-l03", "a2-u08-l01"],
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
  const overriddenDistractors = responseDistractorLessons[lessonId];
  const distractorOptions = overriddenDistractors
    ? overriddenDistractors.map((sourceLessonId, index) =>
        coreOption(sourceLessonId, ["transfer-1", "transfer-2", "previous"][index]),
      )
    : [
        exampleOption(pattern.examples[0], "transfer-1"),
        exampleOption(pattern.examples[1], "transfer-2"),
        coreOption(previousLesson[lessonId], "previous"),
      ];
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
      ...distractorOptions,
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
const passageOption = (
  text,
  requiredLexemeIds,
  requiredChunkIds = [],
) => ({
  text,
  requiredLexemeIds,
  requiredChunkIds,
});
const passageQuestion = (
  id,
  sourceSentenceId,
  question,
  optionMetadata,
  correctAnswer,
  evidenceSentenceIds = [sourceSentenceId],
) => ({
  id,
  sourceSentenceId,
  questionLanguage: "zh-Hant",
  question,
  options: optionMetadata.map((option) => option.text),
  optionMetadata,
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
        [
          passageOption("To the station.", ["to", "the", "station"], [
            "the-station",
          ]),
          passageOption("To the store.", ["to", "the", "store"]),
          passageOption("To school.", ["to", "school"]),
          passageOption("To work.", ["to", "work"]),
        ],
        "To the station.",
      ),
      passageQuestion(
        "a2-u02-p01-q02",
        "a2-u02-p01-s02",
        "這個人可以搭什麼交通工具？",
        [
          passageOption("The bus.", ["the", "bus"]),
          passageOption("The train.", ["the", "train"], ["the-train"]),
          passageOption("A train ticket.", ["a", "train", "ticket"]),
          passageOption("The station.", ["the", "station"]),
        ],
        "The bus.",
      ),
      passageQuestion(
        "a2-u02-p01-q03",
        "a2-u02-p01-s03",
        "這個人昨天買了什麼？",
        [
          passageOption("A train ticket.", ["a", "train", "ticket"]),
          passageOption("A book.", ["a", "book"]),
          passageOption("An apple.", ["an", "apple"]),
          passageOption("A cellphone.", ["a", "cellphone"]),
        ],
        "A train ticket.",
      ),
      passageQuestion(
        "a2-u02-p01-q04",
        "a2-u02-p01-s04",
        "火車什麼時候出發？",
        [
          passageOption(
            "At nine tomorrow morning.",
            ["at", "nine", "tomorrow", "morning"],
            ["tomorrow-morning"],
          ),
          passageOption(
            "At eight tomorrow morning.",
            ["at", "eight", "tomorrow", "morning"],
            ["at-eight", "tomorrow-morning"],
          ),
          passageOption("At nine today.", ["at", "nine", "today"]),
          passageOption("At seven today.", ["at", "seven", "today"], [
            "at-seven",
          ]),
        ],
        "At nine tomorrow morning.",
      ),
      passageQuestion(
        "a2-u02-p01-q05",
        "a2-u02-p01-s01",
        "根據前兩句，這個人搭公車是要去哪裡？",
        [
          passageOption("To the station.", ["to", "the", "station"], [
            "the-station",
          ]),
          passageOption("To the store.", ["to", "the", "store"]),
          passageOption("To school.", ["to", "school"]),
          passageOption("To work.", ["to", "work"]),
        ],
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
        [
          passageOption("This shirt.", ["this", "shirt"], ["this-shirt"]),
          passageOption("That book.", ["that", "book"]),
          passageOption("An apple.", ["an", "apple"]),
          passageOption("A train ticket.", ["a", "train", "ticket"]),
        ],
        "This shirt.",
      ),
      passageQuestion(
        "a2-u03-p01-q02",
        "a2-u03-p01-s02",
        "哪一件襯衫比較便宜？",
        [
          passageOption("This shirt.", ["this", "shirt"], ["this-shirt"]),
          passageOption("That one.", ["that", "one"], ["that-one"]),
          passageOption("That book.", ["that", "book"]),
          passageOption("That shirt.", ["that", "shirt"]),
        ],
        "This shirt.",
      ),
      passageQuestion(
        "a2-u03-p01-q03",
        "a2-u03-p01-s03",
        "這個人想要什麼尺寸？",
        [
          passageOption("A larger size.", ["a", "large", "size"], [
            "a-larger-size",
          ]),
          passageOption("That one.", ["that", "one"], ["that-one"]),
          passageOption("A train ticket.", ["a", "train", "ticket"]),
          passageOption("This shirt.", ["this", "shirt"], ["this-shirt"]),
        ],
        "A larger size.",
      ),
      passageQuestion(
        "a2-u03-p01-q04",
        "a2-u03-p01-s04",
        "根據第一句和第四句，這個人可能為什麼不買？",
        [
          passageOption("Too expensive.", ["too", "expensive"], [
            "too-expensive",
          ]),
          passageOption("A larger size.", ["a", "large", "size"], [
            "a-larger-size",
          ]),
          passageOption("That one.", ["that", "one"], ["that-one"]),
          passageOption("A train ticket.", ["a", "train", "ticket"]),
        ],
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
        "這個人今天怎麼了？",
        [
          passageOption("A headache.", ["a", "headache"]),
          passageOption("A larger size.", ["a", "large", "size"], [
            "a-larger-size",
          ]),
          passageOption("More water.", ["more", "water"], ["more-water"]),
          passageOption("A train ticket.", ["a", "train", "ticket"]),
        ],
        "A headache.",
      ),
      passageQuestion(
        "a2-u04-p01-q02",
        "a2-u04-p01-s02",
        "對方給了什麼建議？",
        [
          passageOption("Drink more water.", ["drink", "more", "water"], [
            "more-water",
          ]),
          passageOption("Take the bus.", ["take", "the", "bus"], [
            "take-the-bus",
          ]),
          passageOption("Watch TV.", ["watch", "tv"], ["watch-tv"]),
          passageOption("Go to work.", ["go", "to", "work"], ["go-to-work"]),
        ],
        "Drink more water.",
      ),
      passageQuestion(
        "a2-u04-p01-q03",
        "a2-u04-p01-s03",
        "這個人什麼時候要看醫生？",
        [
          passageOption("Tomorrow.", ["tomorrow"]),
          passageOption("Today.", ["today"]),
          passageOption("Last night.", ["last", "night"], ["last-night"]),
          passageOption("After dinner.", ["after", "dinner"], [
            "after-dinner",
          ]),
        ],
        "Tomorrow.",
      ),
      passageQuestion(
        "a2-u04-p01-q04",
        "a2-u04-p01-s04",
        "這個藥要什麼時候服用？",
        [
          passageOption("After dinner.", ["after", "dinner"], [
            "after-dinner",
          ]),
          passageOption("After breakfast.", ["after", "breakfast"]),
          passageOption("At seven.", ["at", "seven"], ["at-seven"]),
          passageOption("Tomorrow morning.", ["tomorrow", "morning"], [
            "tomorrow-morning",
          ]),
        ],
        "After dinner.",
      ),
      passageQuestion(
        "a2-u04-p01-q05",
        "a2-u04-p01-s01",
        "根據第一句和第三句，這個人是因為什麼症狀要看醫生？",
        [
          passageOption("A headache.", ["a", "headache"]),
          passageOption("A train ticket.", ["a", "train", "ticket"]),
          passageOption("A larger size.", ["a", "large", "size"], [
            "a-larger-size",
          ]),
          passageOption("A bus.", ["a", "bus"]),
        ],
        "A headache.",
        ["a2-u04-p01-s01", "a2-u04-p01-s03"],
      ),
    ],
  },
  {
    passageId: "a2-u05-p01",
    level: "A2",
    qaStatus,
    sentences: [
      passageSentence(
        "a2-u05-p01-s01",
        1,
        "I am meeting my manager at ten tomorrow.",
        "我明天十點要和主管見面。",
        "a2-u05-l04",
        ["i", "be", "meet", "my", "manager", "at", "ten", "tomorrow"],
        ["meeting-my-manager", "at-ten-tomorrow"],
      ),
      passageSentence(
        "a2-u05-p01-s02",
        2,
        "I have a meeting at three.",
        "我三點有一個會議。",
        "a2-u05-l04",
        ["i", "have", "a", "meeting", "at", "three"],
        ["have-a-meeting", "at-three"],
      ),
      passageSentence(
        "a2-u05-p01-s03",
        3,
        "Can we meet on Tuesday afternoon?",
        "我們可以星期二下午見面嗎？",
        "a2-u05-l04",
        ["can", "we", "meet", "on", "tuesday", "afternoon"],
        ["can-we-meet", "on-tuesday-afternoon"],
      ),
      passageSentence(
        "a2-u05-p01-s04",
        4,
        "Can we move the meeting to Friday?",
        "我們可以把會議改到星期五嗎？",
        "a2-u05-l04",
        ["can", "we", "move", "the", "meeting", "to", "friday"],
        ["move-the-meeting", "to-friday"],
      ),
    ],
    questions: [
      passageQuestion(
        "a2-u05-p01-q01",
        "a2-u05-p01-s01",
        "這個人明天十點要和誰見面？",
        [
          passageOption("My manager.", ["my", "manager"]),
          passageOption("My friend.", ["my", "friend"]),
          passageOption("My wife.", ["my", "wife"]),
          passageOption("A doctor.", ["a", "doctor"]),
        ],
        "My manager.",
      ),
      passageQuestion(
        "a2-u05-p01-q02",
        "a2-u05-p01-s01",
        "和主管見面的時間是什麼時候？",
        [
          passageOption("At ten tomorrow.", ["at", "ten", "tomorrow"], [
            "at-ten-tomorrow",
          ]),
          passageOption("At nine tomorrow.", ["at", "nine", "tomorrow"]),
          passageOption("At eight tomorrow.", ["at", "eight", "tomorrow"], [
            "at-eight",
          ]),
          passageOption("At seven tomorrow.", ["at", "seven", "tomorrow"], [
            "at-seven",
          ]),
        ],
        "At ten tomorrow.",
      ),
      passageQuestion(
        "a2-u05-p01-q03",
        "a2-u05-p01-s02",
        "三點安排了什麼？",
        [
          passageOption("A meeting.", ["a", "meeting"]),
          passageOption("A train.", ["a", "train"]),
          passageOption("The bus.", ["the", "bus"]),
          passageOption("A doctor.", ["a", "doctor"]),
        ],
        "A meeting.",
      ),
      passageQuestion(
        "a2-u05-p01-q04",
        "a2-u05-p01-s03",
        "原本提議星期幾下午見面？",
        [
          passageOption("Tuesday.", ["tuesday"]),
          passageOption("Monday.", ["monday"]),
          passageOption("Friday.", ["friday"]),
          passageOption("Tomorrow.", ["tomorrow"]),
        ],
        "Tuesday.",
      ),
      passageQuestion(
        "a2-u05-p01-q05",
        "a2-u05-p01-s04",
        "最後想把會議改到哪一天？",
        [
          passageOption("Friday.", ["friday"]),
          passageOption("Tuesday.", ["tuesday"]),
          passageOption("Monday.", ["monday"]),
          passageOption("Tomorrow.", ["tomorrow"]),
        ],
        "Friday.",
        ["a2-u05-p01-s03", "a2-u05-p01-s04"],
      ),
    ],
  },
  {
    passageId: "a2-u06-p01",
    level: "A2",
    qaStatus,
    sentences: [
      passageSentence(
        "a2-u06-p01-s01",
        1,
        "I usually clean my room on Saturday.",
        "我通常星期六整理我的房間。",
        "a2-u06-l04",
        ["i", "usually", "clean", "my", "room", "on", "saturday"],
        ["usually-clean", "on-saturday"],
      ),
      passageSentence(
        "a2-u06-p01-s02",
        2,
        "I have to wash the dishes.",
        "我必須洗碗。",
        "a2-u06-l04",
        ["i", "have", "to", "wash", "the", "dish"],
        ["have-to", "wash-the-dishes"],
      ),
      passageSentence(
        "a2-u06-p01-s03",
        3,
        "Can you help me with the laundry?",
        "你可以幫我洗衣服嗎？",
        "a2-u06-l04",
        ["can", "you", "help", "me", "with", "the", "laundry"],
        ["can-you-help", "with-the-laundry"],
      ),
      passageSentence(
        "a2-u06-p01-s04",
        4,
        "I can help you.",
        "我可以幫你。",
        "a2-u06-l04",
        ["i", "can", "help", "you"],
      ),
      passageSentence(
        "a2-u06-p01-s05",
        5,
        "We clean the house on Saturday.",
        "我們星期六打掃房子。",
        "a2-u06-l04",
        ["we", "clean", "the", "house", "on", "saturday"],
        ["clean-the-house", "on-saturday"],
      ),
    ],
    questions: [
      passageQuestion(
        "a2-u06-p01-q01",
        "a2-u06-p01-s01",
        "這個人通常哪一天整理房間？",
        [
          passageOption("On Saturday.", ["on", "saturday"], ["on-saturday"]),
          passageOption("On Tuesday.", ["on", "tuesday"]),
          passageOption("Tomorrow.", ["tomorrow"]),
          passageOption("Last night.", ["last", "night"], ["last-night"]),
        ],
        "On Saturday.",
      ),
      passageQuestion(
        "a2-u06-p01-q02",
        "a2-u06-p01-s02",
        "這個人必須洗什麼？",
        [
          passageOption("The dishes.", ["the", "dish"]),
          passageOption("The room.", ["the", "room"]),
          passageOption("The laundry.", ["the", "laundry"]),
          passageOption("The house.", ["the", "house"]),
        ],
        "The dishes.",
      ),
      passageQuestion(
        "a2-u06-p01-q03",
        "a2-u06-p01-s03",
        "對方請求幫忙處理什麼？",
        [
          passageOption("The laundry.", ["the", "laundry"]),
          passageOption("The dishes.", ["the", "dish"]),
          passageOption("The room.", ["the", "room"]),
          passageOption("The house.", ["the", "house"]),
        ],
        "The laundry.",
      ),
      passageQuestion(
        "a2-u06-p01-q04",
        "a2-u06-p01-s04",
        "對方用哪一句話答應提供幫忙？",
        [
          passageOption("I can help you.", ["i", "can", "help", "you"]),
          passageOption("I have to wash the dishes.", ["i", "have", "to", "wash", "the", "dish"]),
          passageOption("I usually clean my room.", ["i", "usually", "clean", "my", "room"]),
          passageOption("We clean the house on Saturday.", ["we", "clean", "the", "house", "on", "saturday"]),
        ],
        "I can help you.",
        ["a2-u06-p01-s03", "a2-u06-p01-s04"],
      ),
    ],
  },
  {
    passageId: "a2-u07-p01",
    level: "A2",
    qaStatus,
    sentences: [
      passageSentence(
        "a2-u07-p01-s01",
        1,
        "Have you been to Taiwan before?",
        "你以前去過台灣嗎？",
        "a2-u07-l04",
        ["have", "you", "be", "to", "taiwan", "before"],
        ["been-to"],
      ),
      passageSentence(
        "a2-u07-p01-s02",
        2,
        "I have been to Taiwan.",
        "我去過台灣。",
        "a2-u07-l04",
        ["i", "have", "be", "to", "taiwan"],
        ["have-been-to"],
      ),
      passageSentence(
        "a2-u07-p01-s03",
        3,
        "I have a new job now.",
        "我現在有一份新工作。",
        "a2-u07-l04",
        ["i", "have", "a", "new", "job", "now"],
        ["new-job"],
      ),
      passageSentence(
        "a2-u07-p01-s04",
        4,
        "My life is different now.",
        "我的生活現在不一樣了。",
        "a2-u07-l04",
        ["my", "life", "be", "different", "now"],
        ["different-now"],
      ),
      passageSentence(
        "a2-u07-p01-s05",
        5,
        "I go to work by train.",
        "我搭火車去上班。",
        "a2-u07-l04",
        ["i", "go", "to", "work", "by", "train"],
        ["go-to-work"],
      ),
      passageSentence(
        "a2-u07-p01-s06",
        6,
        "I usually clean my room on Saturday.",
        "我通常星期六整理我的房間。",
        "a2-u07-l04",
        ["i", "usually", "clean", "my", "room", "on", "saturday"],
        ["usually-clean", "on-saturday"],
      ),
    ],
    questions: [
      passageQuestion(
        "a2-u07-p01-q01",
        "a2-u07-p01-s02",
        "這個人去過哪裡？",
        [
          passageOption("Taiwan.", ["taiwan"]),
          passageOption("The store.", ["the", "store"]),
          passageOption("The school.", ["the", "school"]),
          passageOption("The station.", ["the", "station"]),
        ],
        "Taiwan.",
      ),
      passageQuestion(
        "a2-u07-p01-q02",
        "a2-u07-p01-s03",
        "這個人現在有什麼新的？",
        [
          passageOption("A new job.", ["a", "new", "job"], ["new-job"]),
          passageOption("A new book.", ["a", "new", "book"]),
          passageOption("A new bag.", ["a", "new", "bag"]),
          passageOption("A new room.", ["a", "new", "room"]),
        ],
        "A new job.",
      ),
      passageQuestion(
        "a2-u07-p01-q03",
        "a2-u07-p01-s06",
        "這個人通常哪一天整理房間？",
        [
          passageOption("On Saturday.", ["on", "saturday"], ["on-saturday"]),
          passageOption("On Monday.", ["on", "monday"]),
          passageOption("On Tuesday.", ["on", "tuesday"]),
          passageOption("On Friday.", ["on", "friday"]),
        ],
        "On Saturday.",
      ),
      passageQuestion(
        "a2-u07-p01-q04",
        "a2-u07-p01-s03",
        "從第三句和第五句可知，這個人去新工作地點時使用什麼交通方式？",
        [
          passageOption("By train.", ["by", "train"]),
          passageOption("By bus.", ["by", "bus"]),
          passageOption("To work.", ["to", "work"]),
          passageOption("At home.", ["at", "home"]),
        ],
        "By train.",
        ["a2-u07-p01-s03", "a2-u07-p01-s05"],
      ),
    ],
  },
  {
    passageId: "a2-u08-p01",
    level: "A2",
    qaStatus,
    sentences: [
      passageSentence(
        "a2-u08-p01-s01",
        1,
        "I have a problem at work.",
        "我在工作上遇到一個問題。",
        "a2-u08-l01",
        ["i", "have", "a", "problem", "at", "work"],
        ["have-a-problem", "at-work"],
      ),
      passageSentence(
        "a2-u08-p01-s02",
        2,
        "I am tired because I work at night.",
        "我因為晚上工作而很累。",
        "a2-u08-l02",
        ["i", "be", "tire", "because", "work", "at", "night"],
        ["at-night"],
      ),
      passageSentence(
        "a2-u08-p01-s03",
        3,
        "I am tired, so I take a break.",
        "我很累，所以休息一下。",
        "a2-u08-l04",
        ["i", "be", "tire", "so", "take", "a", "break"],
        ["take-a-break"],
      ),
      passageSentence(
        "a2-u08-p01-s04",
        4,
        "I take a break at home.",
        "我在家休息一下。",
        "a2-u08-l04",
        ["i", "take", "a", "break", "at", "home"],
        ["take-a-break", "at-home"],
      ),
      passageSentence(
        "a2-u08-p01-s05",
        5,
        "I have some water.",
        "我喝一些水。",
        "a2-u08-l01",
        ["i", "have", "some", "water"],
      ),
    ],
    questions: [
      passageQuestion(
        "a2-u08-p01-q01",
        "a2-u08-p01-s01",
        "這個人在哪裡遇到問題？",
        [
          passageOption("At work.", ["at", "work"], ["at-work"]),
          passageOption("At home.", ["at", "home"], ["at-home"]),
          passageOption("At school.", ["at", "school"]),
          passageOption("At the station.", ["at", "the", "station"], ["the-station"]),
        ],
        "At work.",
      ),
      passageQuestion(
        "a2-u08-p01-q02",
        "a2-u08-p01-s02",
        "這個人什麼時候工作？",
        [
          passageOption("At night.", ["at", "night"], ["at-night"]),
          passageOption("On Saturday.", ["on", "saturday"], ["on-saturday"]),
          passageOption("At seven.", ["at", "seven"]),
          passageOption("Tomorrow.", ["tomorrow"]),
        ],
        "At night.",
      ),
      passageQuestion(
        "a2-u08-p01-q03",
        "a2-u08-p01-s03",
        "根據第二、三句，這個人晚上工作覺得累，因此做了什麼？",
        [
          passageOption("Take a break.", ["take", "a", "break"], ["take-a-break"]),
          passageOption("Go to work.", ["go", "to", "work"], ["go-to-work"]),
          passageOption("Clean the room.", ["clean", "the", "room"]),
          passageOption("Drink some water.", ["drink", "some", "water"]),
        ],
        "Take a break.",
        ["a2-u08-p01-s02", "a2-u08-p01-s03"],
      ),
      passageQuestion(
        "a2-u08-p01-q04",
        "a2-u08-p01-s04",
        "這個人在哪裡休息？",
        [
          passageOption("At home.", ["at", "home"], ["at-home"]),
          passageOption("At work.", ["at", "work"], ["at-work"]),
          passageOption("At the station.", ["at", "the", "station"], ["the-station"]),
          passageOption("At school.", ["at", "school"]),
        ],
        "At home.",
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
