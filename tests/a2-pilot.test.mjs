import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildCourseUnitsFromRows as buildA1Units,
  parseA1MvpCsv,
} from "../app/a1-mvp-data.ts";
import {
  validatePatternExerciseData,
  validateReadingExerciseData,
} from "../app/a1-exercises.ts";
import {
  canAccessLevel,
  createEmptyMultiLevelProgress,
  isLevelAssessmentEnabled,
  migrateProgressToV6,
  updateSelectedLevelProgress,
} from "../app/curriculum/progress.ts";
import {
  loadCurriculumCatalog,
  validateCurriculumCatalog,
} from "../app/curriculum/catalog.ts";
import {
  loadAvailableCourseLevels,
  loadCourseLevel,
} from "../app/curriculum/loader.ts";
import {
  createStoredCourseData,
  createStoredCourseDelta,
  restoreStoredCourseData,
} from "../app/curriculum/storage.ts";
import {
  buildCourseUnitsFromRows,
  COURSE_CSV_HEADERS,
  findCrossLevelIdCollisions,
  parseCourseCsv,
  serializeCourseCsv,
  validateCourseRows,
} from "../app/curriculum/validation.ts";
import { sentenceSpellingUnits } from "../app/curriculum/sentence-words.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const a1Text = readText("public/data/a1-course-v3.csv");
const a2Text = readText("public/data/a2-course-v1.csv");
const a1Rows = parseA1MvpCsv(a1Text);
const a2Rows = parseCourseCsv(a2Text);
const catalogJson = readJson("public/data/course-catalog.json");
const a1Patterns = readJson("public/data/a1-pattern-exercises.json");
const a1Reading = readJson("public/data/a1-reading-exercises.json");
const a2Patterns = readJson("public/data/a2-pattern-exercises.json");
const a2Reading = readJson("public/data/a2-reading-exercises.json");
// Independent of course-catalog.json, so accidental truncation cannot silently
// change both the generated source and these expectations.
// IDs grow past two digits at a2-u100, so compare unit numbers, not strings.
const a2UnitNumber = (id) => Number(id.split("-")[1].slice(1));
const expectedPilot = { units: 190, lessonsPerUnit: 4, occurrences: 4362 };
const expectedLessons = expectedPilot.units * expectedPilot.lessonsPerUnit;
const a2UnitIds = Array.from({ length: expectedPilot.units }, (_, index) => `a2-u${String(index + 1).padStart(2, "0")}`);

const response = (body, status = 200) =>
  new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    {
      status,
      headers: {
        "content-type":
          typeof body === "string"
            ? "text/plain; charset=utf-8"
            : "application/json",
      },
    },
  );

const curriculumFetcher = async (url) => {
  const files = {
    "/data/course-catalog.json": catalogJson,
    "/data/a1-course-v3.csv": a1Text,
    "/data/a2-course-v1.csv": a2Text,
  };
  return url in files ? response(files[url]) : response("", 404);
};

test("keeps A1 at 8 units, 32 lessons, and 145 occurrences", () => {
  const units = buildA1Units(a1Rows);
  assert.equal(units.length, 8);
  assert.equal(
    units.flatMap((unit) => unit.lessons).length,
    32,
  );
  assert.equal(a1Rows.length, 145);
});

test("loads a catalog containing production A1, pilot A2, and disabled B levels", async () => {
  const catalog = validateCurriculumCatalog(catalogJson);
  assert.deepEqual(
    catalog.levels.map((entry) => [entry.level, entry.status]),
    [
      ["A1", "production"],
      ["A2", "pilot"],
      ["B1", "disabled"],
      ["B2", "disabled"],
    ],
  );
  const loaded = await loadCurriculumCatalog(curriculumFetcher);
  assert.equal(loaded.levels[1].prerequisiteLevel, "A1");
});

test("rejects a catalog with an out-of-order advanced prerequisite", () => {
  const invalid = structuredClone(catalogJson);
  invalid.levels.find((entry) => entry.level === "B2").prerequisiteLevel =
    "A2";
  assert.throws(
    () => validateCurriculumCatalog(invalid),
    /B2 的 prerequisiteLevel 必須是 B1/,
  );
});

test("loads the complete A2 pilot checkpoint", async () => {
  const catalog = await loadCurriculumCatalog(curriculumFetcher);
  const level = await loadCourseLevel(
    catalog,
    "A2",
    curriculumFetcher,
  );
  assert.equal(level.units.length, expectedPilot.units);
  assert.equal(
    level.units.flatMap((unit) => unit.lessons).length,
    expectedLessons,
  );
  assert.equal(level.rows.length, expectedPilot.occurrences);
  assert.equal(level.status, "pilot");
});

test("keeps A2 unit 1 unchanged while extending the ordered pilot", () => {
  const unitOneRows = a2Rows.filter((row) => row.unit_id === "a2-u01");
  assert.equal(unitOneRows.length, 25);
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(unitOneRows))
      .digest("hex"),
    "0c06db4c35f30bd99dd8678bba6a09653d70cae02a92694037be32d736b145f8",
  );
  assert.deepEqual(
    [...new Set(a2Rows.map((row) => row.unit_id))],
    a2UnitIds,
  );
  assert.deepEqual(
    [...new Set(a2Rows.map((row) => row.unit_title))],
    [
      "昨天與明天",
      "旅行與交通",
      "購物與比較",
      "健康與建議",
      "工作與約會安排",
      "居家與日常家務",
      "經驗與生活改變",
      "問題與簡單解決方式",
      "社交、邀請與回應",
      "綜合郵件、行程與生活故事",
      "應用：通話、重述與確認",
      "應用：點餐、更正與結帳",
      "應用：旅館入住與求助",
      "應用：退換貨與尺寸",
      "應用：交通延誤與改搭",
      "應用：工作回報與交接",
      "應用：問路與地標",
      "應用：裝置故障與求助",
      "應用：遺失物品與領回",
      "應用：圖書館借書與期限",
      "應用：改約與核對時間",
      "應用：表達偏好與一起決定",
      "應用：餐點成分與替代選擇",
      "應用：延長時間與回覆期限",
      "應用：敘述經過與後續行動",
      "應用：確認意思與避免誤會",
      "應用：分配事情與互相幫忙",
      "應用：下雨改約與備案",
      "應用：寄件、地址與費用",
      "應用：向別人借物與歸還",
      "應用：說明不舒服與提早離開",
      "應用：超市購物與份量",
      "應用：參加活動與報到",
      "應用：告知晚到與道歉",
      "應用：訂位、候位與叫號",
      "應用：寄檔案與回覆訊息",
      "應用：聽懂場所規則",
      "應用：比較路線與車程",
      "應用：家事分工與收拾",
      "應用：取消或更改訂單",
      "應用：展館售票與入場",
      "應用：鄰居來訪與停留時間",
      "應用：報編號與領取包裹",
      "應用：自助洗衣與操作順序",
      "應用：租腳踏車與歸還期限",
      "應用：填寫表單與聯絡方式",
      "應用：回收標示與物品分類",
      "應用：溫和提醒音量與道歉",
      "應用：內用、外帶與分開裝",
      "應用：問營業時間與公休日",
      "應用：用地標約集合",
      "應用：電話中確認拼字與號碼",
      "應用：結帳、付款方式與找零",
      "應用：班次延誤與月台資訊",
      "應用：新同事、座位與協助工作",
      "應用：打包行李與確認能否裝下",
      "應用：看住處、房間相對位置與比較",
      "應用：說明小失誤與提出補救",
      "應用：停用告示與替代設備",
      "應用：確認課程名額並報名",
      "應用：家事頻率與輪流分工",
      "應用：讀簡單食譜與說明步驟",
      "應用：詢問能否剪髮及修剪長度",
      "應用：退房、寄放行李與領回時間",
      "應用：藥局買藥與服用說明",
      "應用：看天氣決定穿著與攜帶",
      "應用：搭計程車說目的地與下車",
      "應用：掛號看診與說明症狀",
      "應用：水果攤問價與決定數量",
      "應用：聊週末活動與邀請同行",
      "應用：介紹家人與住處",
      "應用：在賣場找商品與問特價",
      "應用：向房東回報修繕",
      "應用：向主管請假與交代工作",
      "應用：描述外貌與尋找走散的人",
      "應用：餐點有問題時禮貌反映",
      "應用：到銀行開戶與準備證件",
      "應用：帳單有疑問時請對方查明",
      "應用：安排短途旅行與確認費用",
      "應用：詢問與表達簡單意見",
      "應用：打電話約到府維修",
      "應用：籌備小型聚會與分工",
      "應用：分享假期去了哪裡",
      "應用：請教學習方法與感謝建議",
      "應用：和鄰居溝通小問題",
      "應用：描述一天的作息",
      "應用：比較手機方案與做決定",
      "應用：請路人幫忙拍照",
      "應用：聊工作內容與工時",
      "應用：聊喜歡與不喜歡的食物",
      "應用：在建築物內指路",
      "應用：聊過去的工作經驗",
      "應用：辦交通票卡與儲值",
      "應用：約下班後見面",
      "應用：詢問課程時間與準備物品",
      "應用：寄包裹到國外",
      "應用：聊剛過去的週末",
      "應用：詢問租屋費用與條件",
      "應用：談健康的生活習慣",
      "應用：安排下個月的計畫",
      "應用：請鄰居代收包裹",
      "應用：說明現在正在做什麼",
      "應用：掛失銀行卡",
      "應用：說自己會與不擅長的事",
      "應用：說明原因並辦理退款",
      "應用：請朋友順路載一程",
      "應用：在職場徵求同意",
      "應用：比較兩個住處",
      "應用：說明經常或從不做的事",
      "應用：聊生日與送禮",
      "應用：向老師提問與說明狀況",
      "應用：請店家保留商品",
      "應用：介紹自己喜歡的地方",
      "應用：學著使用網站",
      "應用：幫迷路的訪客指路",
      "應用：聊家裡養的動物",
      "應用：問哪一路公車與在哪下車",
      "應用：說昨天做了什麼",
      "應用：簡單的工作面試",
      "應用：回診與說明恢復情況",
      "應用：出發前確認安排",
      "應用：介紹自己的家",
      "應用：聊季節與喜歡的天氣",
      "應用：招待朋友喝茶",
      "應用：聊運動與健康",
      "應用：反映旅館房間問題",
      "應用：說明課表與考試",
      "應用：聊電影與看法",
      "應用：安排家庭聚餐",
      "應用：比較店家與新鮮度",
      "應用：介紹住家附近",
      "應用：追問遲到的包裹",
      "應用：計畫假期旅遊",
      "應用：試穿衣服與挑顏色",
      "應用：電話中說明自己的位置",
      "應用：承認錯誤並補救",
      "應用：談未來的目標",
      "應用：到銀行預約辦事",
      "應用：詳細描述遺失物",
      "應用：聊音樂與興趣",
      "應用：請同事幫忙看電腦",
      "應用：籌備生日驚喜",
      "應用：看天氣預報",
      "應用：比較交通方式",
      "應用：出門前交代家事",
      "應用：借用充電線",
      "應用：聊小時候的生活",
      "應用：說明行程變更",
      "應用：請朋友推薦餐廳",
      "應用：逾期還書與繳費",
      "應用：描述小意外與求助",
      "應用：聊喜歡的家事",
      "應用：詢問運費",
      "應用：和同事閒聊",
      "應用：詢問運動中心規定",
      "應用：留語音訊息",
      "應用：約讀書會",
      "應用：在餐廳挑座位",
      "應用：請同事代班",
      "應用：幫朋友挑禮物",
      "應用：詢問停車",
      "應用：歡迎新鄰居",
      "應用：歸還借來的東西",
      "應用：回報電梯故障",
      "應用：更改晚餐訂位",
      "應用：聊最喜歡的老師",
      "應用：聊小時候的味道",
      "應用：規劃海邊一日遊",
      "應用：機場報到",
      "應用：在飛機上請求協助",
      "應用：回答入境問題",
      "應用：換外幣",
      "應用：搬家請朋友幫忙",
      "應用：牙痛去看診",
      "應用：買新手機",
      "應用：逛夜市",
      "應用：暴風雨天的安排",
      "應用：到便利商店繳費",
      "應用：買火車票與找座位",
      "應用：向外國朋友介紹台灣",
      "應用：報名當志工",
      "應用：請鄰居幫忙澆花",
      "應用：聊新的興趣",
      "應用：說明線上預約步驟",
      "應用：聊朋友的新生寶寶",
      "應用：聊早餐習慣",
      "應用：一起看老照片",
      "應用：收到送錯的包裹",
      "應用：出門前找鑰匙",
      "應用：約同事吃午餐",
    ],
  );
  const unitOnePatterns = a2Patterns.patterns.filter((pattern) =>
    pattern.examples.every((example) =>
      example.practiceLessonId.startsWith("a2-u01-"),
    ),
  );
  const unitOneReading = {
    recognition: a2Reading.recognition.filter((exercise) =>
      exercise.lessonId.startsWith("a2-u01-"),
    ),
    textResponses: a2Reading.textResponses.filter((exercise) =>
      exercise.lessonId.startsWith("a2-u01-"),
    ),
    passages: a2Reading.passages.filter(
      (passage) => passage.passageId === "a2-u01-p01",
    ),
  };
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(unitOnePatterns))
      .digest("hex"),
    "9bbdfbf36d7f66635355faab3e5a8ace892e018a97b648f556a8eef991b672b3",
  );
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(unitOneReading))
      .digest("hex"),
    "ac1619001b61819496aa50279cb8b2b64f3bf10d1291858e226ea7aa6f2397dd",
  );
});

test("preserves A2 units 1 through 9 rows and exercise objects byte-for-object", () => {
  const expected = {
    "a2-u01": {
      rows: "0c06db4c35f30bd99dd8678bba6a09653d70cae02a92694037be32d736b145f8",
      patterns: "9bbdfbf36d7f66635355faab3e5a8ace892e018a97b648f556a8eef991b672b3",
      reading: "ac1619001b61819496aa50279cb8b2b64f3bf10d1291858e226ea7aa6f2397dd",
    },
    "a2-u02": {
      rows: "cc5159671f5b8dc99890a6b4577ab02d55d179509a72e25e0262e34bb3dc5377",
      patterns: "19d441f1b6680709e9b689c5ecaa38ee682a65cdef288d053bb2791eeee897d3",
      reading: "33cab3657010591909cde3e7d9d2e743a67e35871b696c28408462fdb859bd8d",
    },
    "a2-u03": {
      rows: "2c21b5ffe4399c8822f6f8763f630e1dd638e90758dd77fed885b47b04963cc1",
      patterns: "0690758cc1805d89413b81959fbb1f8cecb1b5091c79d544baceb20234ed3449",
      reading: "d4e703ee511d9a72766b5e99711d803637eca5a3652f3bf2682aa97a64802184",
    },
    "a2-u04": {
      rows: "8f4bbc3c1ef4b9194d0fea1e6adb8162bf9305c4f20769407aa7a5caeeccb350",
      patterns: "82ae8e8761c2dce200a38f45bdd79bf985f406562c7b754527e0b35c41657f91",
      reading: "961d61c7232853608cb83b100a1cc68a7aec8584a42e243df8585655a9280370",
    },
    "a2-u05": {
      rows: "4c272824e2a65b98218ab86b10244229a07c0d2c12974ab6c0565e5811feabbc",
      patterns: "3c2680153681a5e3717f207ca15037b74aa7055c7890af73ecf91a792077c398",
      reading: "bbb17f8ef94693d9714011b2f07c4051c2eee131ff02a8d13a4ca4dd70dabcb3",
    },
    "a2-u06": {
      rows: "779d8939b4e14a66ace1a696462e52cae8acaca735b41ff7ffe8670aaddffdd0",
      patterns: "64de4265de00f638784a8a7381ec0595a6f54301b8309e7147ed571ffe7661e4",
      reading: "8766ba4dd06ef36f0dd5ac1ddac06dacc90d1aeab54863c046be7bf0bcb3d411",
    },
    "a2-u07": {
      rows: "67348dc1d9e8ffa7ab7fd9ae610ac3f2420174b55549a6ad8516014b0d94ee53",
      patterns: "cfc17e9779c0e476866a331dffd8d1d7726ed59e8f20179dbf0b34eaa9e315e8",
      reading: "53455c61c26154e37d4462cd038c7c4b1e75a077ebe269395f8550995eb9590a",
    },
    "a2-u08": {
      rows: "d096fd2f8ca62b41de664e7e6c43b66768c57ad55d425ac932373739889d3715",
      patterns: "c5e7e005ee6acdb455984edc3dba158994cb1fd2d08809fb44fbb62fe1e58a10",
      reading: "a8354289d3a6d6f1a5dc76a423195614540a8c3ef7f5ca339cad0f5d0cdb96fc",
    },
    "a2-u09": {
      rows: "ea0b388f98abedc13238bda5590083c0aa1b3ff1cbfa64c94bbfdf6dd02b32c0",
      patterns: "00b86bcd201abdf31aa64b79da2efdadd91641ef3305b062c8db98f37074ce77",
      reading: "bbe7e2ba1e4939a152c1b33c4f623039bc4b2dffb9fa78ab5dc0f61653bf5e0d",
    },
  };
  const digest = (value) =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  Object.entries(expected).forEach(([unitId, hashes]) => {
    assert.equal(
      digest(a2Rows.filter((row) => row.unit_id === unitId)),
      hashes.rows,
      `${unitId} rows changed`,
    );
    assert.equal(
      digest(
        a2Patterns.patterns.filter((pattern) =>
          pattern.examples.every((example) =>
            example.practiceLessonId.startsWith(`${unitId}-`),
          ),
        ),
      ),
      hashes.patterns,
      `${unitId} pattern objects changed`,
    );
    assert.equal(
      digest({
        recognition: a2Reading.recognition.filter((exercise) =>
          exercise.lessonId.startsWith(`${unitId}-`),
        ),
        textResponses: a2Reading.textResponses.filter((exercise) =>
          exercise.lessonId.startsWith(`${unitId}-`),
        ),
        passages: a2Reading.passages.filter(
          (passage) => passage.passageId === `${unitId}-p01`,
        ),
      }),
      hashes.reading,
      `${unitId} reading objects changed`,
    );
  });
});

test("keeps four ordered lessons per A2 unit and all structural IDs unique", () => {
  const units = buildCourseUnitsFromRows(
    a2Rows,
    "a2-course-v1.csv",
  );
  assert.deepEqual(
    units.map((unit) => unit.lessons.length),
    Array(expectedPilot.units).fill(expectedPilot.lessonsPerUnit),
  );
  assert.deepEqual(
    units.map((unit) => unit.number),
    a2UnitIds.map((_, index) => index + 1),
  );
  assert.equal(
    new Set(a2Rows.map((row) => row.lesson_id)).size,
    expectedLessons,
  );
  assert.equal(
    new Set(a2Rows.map((row) => row.sentence_id)).size,
    expectedLessons,
  );
  const occurrenceIds = a2Rows.map((row) => row.occurrence_id);
  assert.equal(new Set(occurrenceIds).size, occurrenceIds.length);
});

test("adds the four ordered work and appointment lessons in A2 unit 5", () => {
  const unitFiveRows = a2Rows.filter((row) => row.unit_id === "a2-u05");
  assert.equal(unitFiveRows.length, 27);
  assert.deepEqual(
    [...new Set(unitFiveRows.map((row) => row.lesson_id))],
    ["a2-u05-l01", "a2-u05-l02", "a2-u05-l03", "a2-u05-l04"],
  );
  assert.deepEqual(
    [...new Set(unitFiveRows.map((row) => row.sentence))],
    [
      "I am meeting my manager at ten tomorrow.",
      "Can we meet on Tuesday afternoon?",
      "I have a meeting at three.",
      "Can we move the meeting to Friday?",
    ],
  );
  assert.ok(
    unitFiveRows.every(
      (row) => row.qa_status === "pilot_review_required",
    ),
  );
});

test("adds the four ordered household lessons in A2 unit 6", () => {
  const unitSixRows = a2Rows.filter((row) => row.unit_id === "a2-u06");
  assert.equal(unitSixRows.length, 24);
  assert.deepEqual(
    [...new Set(unitSixRows.map((row) => row.lesson_id))],
    ["a2-u06-l01", "a2-u06-l02", "a2-u06-l03", "a2-u06-l04"],
  );
  assert.deepEqual(
    [...new Set(unitSixRows.map((row) => row.sentence))],
    [
      "I usually clean my room.",
      "I have to wash the dishes.",
      "Can you help me with the laundry?",
      "We clean the house on Saturday.",
    ],
  );
  const expectedNewLexemes = new Map([
    ["a2-u06-l01", ["usually", "clean", "room"]],
    ["a2-u06-l02", ["wash", "dish"]],
    ["a2-u06-l03", ["help", "laundry"]],
    ["a2-u06-l04", ["house", "saturday"]],
  ]);
  expectedNewLexemes.forEach((expected, lessonId) => {
    assert.deepEqual(
      unitSixRows
        .filter(
          (row) => row.lesson_id === lessonId && row.is_new_word === "TRUE",
        )
        .map((row) => row.lexeme_id),
      expected,
    );
  });
  assert.ok(
    unitSixRows.every(
      (row) => row.qa_status === "pilot_review_required",
    ),
  );
});

test("maps A2 inflected answers to dictionary-form lexemes", () => {
  const expected = new Map([
    ["bought", "buy"],
    ["leaves", "leave"],
    ["cheaper", "cheap"],
    ["larger", "large"],
    ["been", "be"],
  ]);
  expected.forEach((lexemeId, answer) => {
    const row = a2Rows.find(
      (candidate) => candidate.answer === answer,
    );
    assert.ok(row, `找不到 ${answer}`);
    assert.equal(row.lexeme_id, lexemeId);
    assert.equal(row.lemma, lexemeId);
  });
});

test("adds four bounded experience lessons without treating been as a new lexeme", () => {
  const rows = a2Rows.filter((row) => row.unit_id === "a2-u07");
  assert.equal(rows.length, 22);
  assert.deepEqual([...new Set(rows.map((row) => row.sentence))], [
    "I have been to Taiwan.",
    "Have you been to Taiwan before?",
    "My life is different now.",
    "I have a new job now.",
  ]);
  const expectedNewLexemes = [[], ["before"], ["life", "different", "now"], ["new", "job"]];
  const known = new Set([
    ...a1Rows.map((row) => row.lexeme_id),
    ...a2Rows.filter((row) => a2UnitNumber(row.unit_id) < 7).map((row) => row.lexeme_id),
  ]);
  expectedNewLexemes.forEach((expected, lessonIndex) => {
    const lessonId = `a2-u07-l0${lessonIndex + 1}`;
    const lessonRows = rows.filter((row) => row.lesson_id === lessonId);
    const actualNew = [...new Set(lessonRows.map((row) => row.lexeme_id))]
      .filter((id) => !known.has(id));
    assert.deepEqual(actualNew, expected, lessonId);
    assert.deepEqual(lessonRows.filter((row) => row.is_new_word === "TRUE")
      .map((row) => row.lexeme_id), expected, `${lessonId} novelty flags`);
    assert.ok(actualNew.length <= 4);
    lessonRows.forEach((row, index) => {
      assert.equal(row.occurrence_id, `${lessonId}-p01-s01-t${String(index + 1).padStart(2, "0")}`);
      assert.equal(row.token_order, String(index + 1));
      assert.equal(row.qa_status, "pilot_review_required");
      assert.equal(row.is_new_sentence_pattern, "TRUE");
      assert.equal(row.audio_status, "pending");
      assert.ok(row.kk_us && row.ipa_standalone && row.context_pos);
      known.add(row.lexeme_id);
    });
  });
  const beenRows = rows.filter((row) => row.answer === "been");
  assert.equal(beenRows.length, 2);
  beenRows.forEach((row) => {
    assert.equal(row.lexeme_id, "be");
    assert.equal(row.lemma, "be");
    assert.equal(row.is_new_word, "FALSE");
    assert.match(row.note, /過去分詞/);
    assert.equal(row.context_pos, "verb 動詞（過去分詞）");
  });
});

test("keeps every cross-level structural ID collision-free", () => {
  assert.deepEqual(findCrossLevelIdCollisions(a1Rows, a2Rows), []);
});

test("keeps every A2 answer to one word and rebuilds all core sentences", () => {
  assert.ok(
    a2Rows.every((row) =>
      /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer),
    ),
  );
  const report = validateCourseRows(a2Rows, {
    expectedLevel: "A2",
    expectedUnits: expectedPilot.units,
    expectedLessons,
    rejectProductionQaForPilot: true,
  });
  assert.equal(report.valid, true, report.validationErrors.join("\n"));
  const units = buildCourseUnitsFromRows(
    a2Rows,
    "a2-course-v1.csv",
  );
  units.flatMap((unit) => unit.lessons).forEach((lesson) => {
    assert.deepEqual(
      lesson.tokens.map((token) => token.answer),
      sentenceSpellingUnits(lesson.sentence),
    );
    assert.match(lesson.sentence, /[.!?]$/);
  });
});

test("validates A2 transfer lexemes, chunks, slots, and non-source variations", () => {
  const report = validatePatternExerciseData(
    a2Patterns,
    a2Rows,
    "A2",
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
  const sourceById = new Map(
    a2Rows.map((row) => [row.sentence_id, row.sentence]),
  );
  a2Patterns.patterns.forEach((pattern) => {
    assert.equal(pattern.examples.length, 2);
    pattern.examples.forEach((example) => {
      assert.notEqual(
        example.sentence.toLowerCase(),
        sourceById.get(example.sourceSentenceId)?.toLowerCase(),
      );
      assert.ok(example.requiredLexemeIds.length > 0);
      if (a2UnitNumber(example.practiceLessonId) >= 2) {
        assert.equal(example.qaStatus, "pilot_review_required");
        assert.equal(example.slotValues.length, pattern.slots.length);
      }
    });
  });
});

test("keeps A2 reading answers supported and distractors unique", () => {
  const report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
  a2Reading.passages.forEach((passage) => {
    const sentenceById = new Map(
      passage.sentences.map((sentence) => [
        sentence.id,
        sentence.sentence.toLowerCase(),
      ]),
    );
    passage.questions.forEach((question) => {
      const evidenceIds =
        question.evidenceSentenceIds ?? [question.sourceSentenceId];
      assert.ok(
        evidenceIds.some((sentenceId) =>
          sentenceById
            .get(sentenceId)
            .includes(
              question.correctAnswer
                .replace(/[.!?]$/g, "")
                .toLowerCase(),
            ),
        ),
      );
      assert.equal(
        new Set(question.options).size,
        question.options.length,
      );
      assert.equal(
        question.options.filter(
          (option) => option === question.correctAnswer,
        ).length,
        1,
      );
    });
  });
});

test("validates passage option prerequisites without breaking A1 reading data", () => {
  const a1Report = validateReadingExerciseData(
    a1Reading,
    a1Rows,
    a1Patterns,
  );
  assert.equal(a1Report.valid, true, a1Report.errors.join("\n"));

  const a2Report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(a2Report.valid, true, a2Report.errors.join("\n"));
  a2Reading.passages
    .filter((passage) => passage.passageId !== "a2-u01-p01")
    .forEach((passage) => {
      passage.questions.forEach((question) => {
        assert.equal(
          question.optionMetadata.length,
          question.options.length,
          `${question.id} 應為每個選項提供先備內容 metadata`,
        );
      });
    });
});

test("rejects a unit 3 passage option that introduces unit 4 lexeme more", () => {
  const invalid = structuredClone(a2Reading);
  const question = invalid.passages
    .find((passage) => passage.passageId === "a2-u03-p01")
    .questions.find((entry) => entry.id === "a2-u03-p01-q03");
  const optionIndex = question.options.indexOf("That one.");
  question.options[optionIndex] = "More water.";
  question.optionMetadata[optionIndex] = {
    text: "More water.",
    requiredLexemeIds: ["more", "water"],
    requiredChunkIds: ["more-water"],
  };

  const report = validateReadingExerciseData(
    invalid,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some(
      (error) =>
        error.includes("a2-u03-p01-q03") &&
        error.includes("提前使用 lexeme") &&
        error.includes("more"),
    ),
    report.errors.join("\n"),
  );
});

test("accepts learned that and one in the unit 3 passage options", () => {
  const question = a2Reading.passages
    .find((passage) => passage.passageId === "a2-u03-p01")
    .questions.find((entry) => entry.id === "a2-u03-p01-q03");
  const option = question.optionMetadata.find(
    (entry) => entry.text === "That one.",
  );
  assert.deepEqual(option.requiredLexemeIds, ["that", "one"]);
  assert.deepEqual(option.requiredChunkIds, ["that-one"]);

  const report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
});

test("keeps the final A2 passage wording and direct-answer forms", () => {
  const questionById = new Map(
    a2Reading.passages.flatMap((passage) =>
      passage.questions.map((question) => [question.id, question]),
    ),
  );
  assert.deepEqual(questionById.get("a2-u02-p01-q02").options, [
    "The bus.",
    "The train.",
    "A train ticket.",
    "The station.",
  ]);
  assert.equal(
    questionById.get("a2-u02-p01-q02").correctAnswer,
    "The bus.",
  );
  assert.deepEqual(questionById.get("a2-u03-p01-q03").options, [
    "A larger size.",
    "That one.",
    "A train ticket.",
    "This shirt.",
  ]);
  assert.equal(
    questionById.get("a2-u04-p01-q01").question,
    "這個人今天怎麼了？",
  );
  assert.equal(
    questionById.get("a2-u04-p01-q05").question,
    "根據第一句和第三句，這個人是因為什麼症狀要看醫生？",
  );
});

test("keeps A2 article prompts and contextual definite-article chunks consistent", () => {
  const articleRows = a2Rows.filter((row) => /^a$/i.test(row.answer));
  assert.ok(articleRows.length > 0);
  assert.ok(articleRows.every((row) => row.prompt === "一個"));
  assert.ok(
    articleRows.every((row) => row.note.includes("a 的核心功能是不定冠詞")),
  );

  const stationRows = a2Rows.filter(
    (row) => row.chunk_text.toLowerCase() === "the station",
  );
  assert.ok(stationRows.every((row) => row.chunk_translation === "特定的車站"));
  assert.ok(
    stationRows.every((row) =>
      row.chunk_note.includes("雙方知道的特定車站"),
    ),
  );

  const trainRows = a2Rows.filter(
    (row) => row.chunk_text === "The train",
  );
  assert.ok(
    trainRows.every((row) => row.chunk_translation === "特定班次的火車"),
  );
});

test("keeps A2 passage distractors semantically distinct", () => {
  const transportQuestion = a2Reading.passages
    .find((passage) => passage.passageId === "a2-u02-p01")
    .questions.find((question) => question.id === "a2-u02-p01-q02");
  assert.equal(transportQuestion.correctAnswer, "The bus.");
  assert.ok(!transportQuestion.options.includes("Take the bus."));

  const comparisonQuestion = a2Reading.passages
    .find((passage) => passage.passageId === "a2-u03-p01")
    .questions.find((question) => question.id === "a2-u03-p01-q02");
  assert.deepEqual(comparisonQuestion.options, [
    "This shirt.",
    "That one.",
    "That book.",
    "That shirt.",
  ]);
  assert.ok(!comparisonQuestion.options.includes("This one."));
});

test("keeps every new A2 lesson within the new-lexeme limit", () => {
  const newLessonIds = [
    ...new Set(
      a2Rows
        .filter((row) => row.unit_id !== "a2-u01")
        .map((row) => row.lesson_id),
    ),
  ];
  assert.equal(newLessonIds.length, expectedLessons - expectedPilot.lessonsPerUnit);
  newLessonIds.forEach((lessonId) => {
    const newLexemes = new Set(
      a2Rows
        .filter(
          (row) =>
            row.lesson_id === lessonId &&
            row.is_new_word === "TRUE",
        )
        .map((row) => row.lexeme_id),
    );
    assert.ok(
      newLexemes.size <= 4,
      `${lessonId} 新 lexeme 過多：${[...newLexemes].join("、")}`,
    );
  });
});

test("gives every post-unit-one lesson recognition, two transfers, and text response", () => {
  const newLessonIds = [
    ...new Set(
      a2Rows
        .filter((row) => row.unit_id !== "a2-u01")
        .map((row) => row.lesson_id),
    ),
  ];
  assert.equal(newLessonIds.length, expectedLessons - expectedPilot.lessonsPerUnit);
  newLessonIds.forEach((lessonId) => {
    assert.equal(
      a2Reading.recognition.filter(
        (exercise) => exercise.lessonId === lessonId,
      ).length,
      1,
    );
    assert.equal(
      a2Reading.textResponses.filter(
        (exercise) => exercise.lessonId === lessonId,
      ).length,
      1,
    );
    const examples = a2Patterns.patterns.flatMap(
      (pattern) => pattern.examples,
    );
    assert.equal(
      examples.filter(
        (example) => example.practiceLessonId === lessonId,
      ).length,
      2,
    );
  });
});

test("adds one supported passage per A2 unit", () => {
  assert.deepEqual(
    a2Reading.passages.map((passage) => passage.passageId),
    a2UnitIds.map((id) => `${id}-p01`),
  );
  a2Reading.passages.forEach((passage) => {
    assert.ok(passage.sentences.length >= 4);
    assert.ok(passage.questions.length >= 3);
  });
  a2Reading.passages
    .filter((passage) => passage.passageId !== "a2-u01-p01")
    .forEach((passage) => {
      assert.equal(passage.qaStatus, "pilot_review_required");
      assert.ok(
        passage.questions.some(
          (question) =>
            (question.evidenceSentenceIds?.length ?? 0) >= 2,
        ),
      );
  });
});

test("builds the A2 unit 5 appointment passage with supported comprehension", () => {
  const passage = a2Reading.passages.find(
    (entry) => entry.passageId === "a2-u05-p01",
  );
  assert.ok(passage);
  assert.equal(passage.sentences.length, 4);
  assert.equal(passage.questions.length, 5);
  assert.deepEqual(
    passage.sentences.map((entry) => entry.sentence),
    [
      "I am meeting my manager at ten tomorrow.",
      "I have a meeting at three.",
      "Can we meet on Tuesday afternoon?",
      "Can we move the meeting to Friday?",
    ],
  );
  assert.deepEqual(
    passage.questions.map((entry) => entry.correctAnswer),
    ["My manager.", "At ten tomorrow.", "A meeting.", "Tuesday.", "Friday."],
  );
});

test("builds the A2 unit 6 household passage with supported comprehension", () => {
  const passage = a2Reading.passages.find(
    (entry) => entry.passageId === "a2-u06-p01",
  );
  assert.ok(passage);
  assert.equal(passage.sentences.length, 5);
  assert.equal(passage.questions.length, 4);
  assert.deepEqual(
    passage.sentences.map((entry) => entry.sentence),
    [
      "I usually clean my room on Saturday.",
      "I have to wash the dishes.",
      "Can you help me with the laundry?",
      "I can help you.",
      "We clean the house on Saturday.",
    ],
  );
  assert.deepEqual(
    passage.questions.map((entry) => entry.correctAnswer),
    ["On Saturday.", "The dishes.", "The laundry.", "I can help you."],
  );
});

test("keeps every newly added A2 row and exercise in pilot QA", () => {
  assert.ok(
    a2Rows
      .filter((row) => row.unit_id !== "a2-u01")
      .every((row) => row.qa_status === "pilot_review_required"),
  );
  assert.ok(
    a2Patterns.patterns
      .filter((pattern) =>
        pattern.examples.some((example) =>
          example.practiceLessonId.startsWith("a2-u0") &&
          !example.practiceLessonId.startsWith("a2-u01"),
        ),
      )
      .every((pattern) => pattern.qaStatus === "pilot_review_required"),
  );
});

test("builds unit seven comprehension from taught words and explicit evidence", () => {
  const passage = a2Reading.passages.find((entry) => entry.passageId === "a2-u07-p01");
  assert.ok(passage);
  assert.equal(passage.qaStatus, "pilot_review_required");
  assert.deepEqual(passage.sentences.map((entry) => entry.sentence), [
    "Have you been to Taiwan before?",
    "I have been to Taiwan.",
    "I have a new job now.",
    "My life is different now.",
    "I go to work by train.",
    "I usually clean my room on Saturday.",
  ]);
  assert.deepEqual(passage.questions.map((entry) => entry.correctAnswer), [
    "Taiwan.", "A new job.", "On Saturday.", "By train.",
  ]);
  assert.deepEqual(passage.questions.at(-1).evidenceSentenceIds, [
    "a2-u07-p01-s03", "a2-u07-p01-s05",
  ]);
  passage.questions.forEach((question) => {
    assert.equal(question.options.length, 4);
    assert.equal(question.optionMetadata.length, 4);
  });
  const invalid = structuredClone(a2Reading);
  const question = invalid.passages.find((entry) => entry.passageId === "a2-u07-p01").questions[0];
  question.options[1] = "An airport.";
  question.optionMetadata[1] = {
    text: "An airport.", requiredLexemeIds: ["an", "airport"], requiredChunkIds: [],
  };
  const report = validateReadingExerciseData(invalid, a2Rows, a2Patterns, a1Rows);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("airport")));
});

test("distinguishes experience have from possession without changing the lexeme", () => {
  const experience = a2Rows.find((row) => row.lesson_id === "a2-u07-l01" && row.answer === "have");
  const possession = a2Rows.find((row) => row.lesson_id === "a2-u07-l04" && row.answer === "have");
  assert.equal(experience.lexeme_id, "have");
  assert.equal(possession.lexeme_id, "have");
  assert.notEqual(experience.sense_id, possession.sense_id);
  assert.match(experience.context_pos, /助動詞/);
  assert.equal(experience.prompt_type, "grammar");
  assert.match(possession.context_pos, /動詞/);
});

test("adds exactly four unit eight lessons with first-seen lexemes and stable word IDs", () => {
  const rows = a2Rows.filter((row) => row.unit_id === "a2-u08");
  assert.equal(rows.length, 27);
  const sentences = [
    "I have a problem at work.",
    "I am tired because I work at night.",
    "You should take a break.",
    "I am tired, so I take a break.",
  ];
  const patterns = ["have-problem-context", "because-reason", "should-advice-action", "be-so-action"];
  const firstSeen = [["problem"], ["tire", "because"], ["break"], ["so"]];
  const known = new Set([
    ...a1Rows.map((row) => row.lexeme_id),
    ...a2Rows.filter((row) => a2UnitNumber(row.unit_id) < 8).map((row) => row.lexeme_id),
  ]);
  sentences.forEach((sentence, lessonIndex) => {
    const lessonId = `a2-u08-l0${lessonIndex + 1}`;
    const lessonRows = rows.filter((row) => row.lesson_id === lessonId);
    assert.deepEqual(lessonRows.map((row) => row.answer), sentenceSpellingUnits(sentence));
    const novel = [...new Set(lessonRows.map((row) => row.lexeme_id))].filter((id) => !known.has(id));
    assert.deepEqual(novel, firstSeen[lessonIndex]);
    assert.ok(novel.length <= 4);
    assert.deepEqual(lessonRows.filter((row) => row.is_new_word === "TRUE").map((row) => row.lexeme_id), novel);
    lessonRows.forEach((row, index) => {
      assert.equal(row.occurrence_id, `${lessonId}-p01-s01-t${String(index + 1).padStart(2, "0")}`);
      assert.equal(row.token_order, String(index + 1));
      assert.equal(row.sentence, sentence);
      assert.equal(row.sentence_pattern_id, patterns[lessonIndex]);
      assert.equal(row.qa_status, "pilot_review_required");
      assert.equal(row.audio_status, "pending");
      assert.equal(row.audio_source, "");
      assert.equal(row.word_audio_source, "");
      assert.equal(row.sentence_audio_source, "");
      assert.ok(row.prompt && row.context_pos && row.sense_id && row.kk_us && row.ipa_standalone);
      known.add(row.lexeme_id);
    });
  });
});

test("teaches unit eight causes, results and whole-chunk rest without false word translations", () => {
  const rows = a2Rows.filter((row) => row.unit_id === "a2-u08");
  const because = rows.find((row) => row.answer === "because");
  const so = rows.find((row) => row.answer === "so");
  assert.equal(because.prompt_type, "grammar");
  assert.equal(so.prompt_type, "grammar");
  assert.match(because.prompt, /因為/);
  assert.match(so.prompt, /所以/);
  assert.match(because.note, /原因/);
  assert.match(so.note, /結果|行動/);
  rows.filter((row) => row.answer === "tired").forEach((row) => {
    assert.equal(row.lexeme_id, "tire");
    assert.equal(row.lemma, "tire");
    assert.equal(row.context_pos, "adjective 形容詞");
    assert.match(row.note, /過去分詞/);
  });
  const workRows = rows.filter((row) => row.answer === "work");
  assert.equal(workRows.find((row) => row.lesson_id === "a2-u08-l01").context_pos, "noun 名詞");
  assert.equal(workRows.find((row) => row.lesson_id === "a2-u08-l02").context_pos, "verb 動詞");
  ["a2-u08-l03", "a2-u08-l04"].forEach((lessonId) => {
    const chunkRows = rows.filter((row) => row.lesson_id === lessonId && row.chunk_id === "take-a-break");
    assert.deepEqual(chunkRows.map((row) => row.answer), ["take", "a", "break"]);
    assert.ok(chunkRows.every((row) => row.chunk_translation === "休息一下"));
    assert.notEqual(chunkRows[0].prompt, "拿");
  });
  const last = buildCourseUnitsFromRows(a2Rows, "a2-course-v1.csv")
    .find((unit) => unit.id === "a2-u08").lessons.at(-1);
  assert.equal(last.sentence, "I am tired, so I take a break.");
  assert.equal(last.tokens.length, 8);
});

test("round-trips unit eight CSV including comma punctuation and all layered metadata", () => {
  const roundTrip = parseCourseCsv(serializeCourseCsv(a2Rows, COURSE_CSV_HEADERS));
  assert.deepEqual(roundTrip, a2Rows);
  const report = validateCourseRows(roundTrip, {
    expectedLevel: "A2", expectedUnits: expectedPilot.units, expectedLessons,
    rejectProductionQaForPilot: true,
  });
  assert.equal(report.valid, true, report.validationErrors.join("\n"));
  const invalid = structuredClone(roundTrip);
  invalid.find((row) => row.occurrence_id === "a2-u08-l04-p01-s01-t08").answer = "a break";
  const invalidReport = validateCourseRows(invalid, { expectedLevel: "A2" });
  assert.equal(invalidReport.valid, false);
  assert.ok(invalidReport.validationErrors.some((error) => error.includes("a2-u08")));
});

test("keeps unit eight practice prerequisite-safe and its passage evidence explicit", () => {
  const response = a2Reading.textResponses.find((entry) => entry.lessonId === "a2-u08-l04");
  assert.deepEqual(response.options.map((option) => option.text), [
    "I am tired, so I take a break.",
    "I am tired because I work at night.",
    "You should take a break.",
    "I have a problem at work.",
  ]);
  assert.equal(response.options.find((option) => option.id === response.correctOptionId).text,
    "I am tired, so I take a break.");
  const passage = a2Reading.passages.find((entry) => entry.passageId === "a2-u08-p01");
  assert.equal(passage.qaStatus, "pilot_review_required");
  assert.deepEqual(passage.sentences.map((entry) => entry.sentence), [
    "I have a problem at work.",
    "I am tired because I work at night.",
    "I am tired, so I take a break.",
    "I take a break at home.",
    "I have some water.",
  ]);
  assert.deepEqual(passage.questions.map((entry) => entry.correctAnswer), ["At work.", "At night.", "Take a break.", "At home."]);
  assert.deepEqual(passage.questions[2].evidenceSentenceIds, ["a2-u08-p01-s02", "a2-u08-p01-s03"]);
  passage.questions.forEach((question) => {
    assert.equal(question.options.length, 4);
    assert.equal(question.optionMetadata.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.equal(question.options.filter((option) => option === question.correctAnswer).length, 1);
  });
  const invalid = structuredClone(a2Reading);
  const early = invalid.textResponses.find((entry) => entry.lessonId === "a2-u08-l01");
  const replacement = early.options.find((option) => option.id !== early.correctOptionId);
  // A real lexeme from lesson 2 must not enter a lesson 1 distractor.
  replacement.text = "I am tired.";
  replacement.requiredLexemeIds = ["i", "be", "tire"];
  replacement.requiredChunkIds = [];
  delete replacement.sourceSentenceId;
  const report = validateReadingExerciseData(invalid, a2Rows, a2Patterns, a1Rows);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("tire")));
});

test("adds unit nine with stable word IDs, four small vocabulary steps, and pending audio", () => {
  const rows = a2Rows.filter((row) => row.unit_id === "a2-u09");
  assert.equal(rows.length, 30);
  const sentences = [
    "Would you like to have dinner with me?",
    "I would love to have dinner with you.",
    "I am sorry, but I have to work.",
    "Can we meet on Saturday instead?",
  ];
  const firstSeen = [[], ["love"], ["sorry", "but"], ["instead"]];
  const known = new Set([...a1Rows, ...a2Rows.filter((row) => a2UnitNumber(row.unit_id) < 9)]
    .map((row) => row.lexeme_id));
  sentences.forEach((sentence, lessonIndex) => {
    const lessonId = `a2-u09-l0${lessonIndex + 1}`;
    const lessonRows = rows.filter((row) => row.lesson_id === lessonId);
    assert.deepEqual(lessonRows.map((row) => row.answer), sentenceSpellingUnits(sentence));
    const novel = [...new Set(lessonRows.map((row) => row.lexeme_id))].filter((id) => !known.has(id));
    assert.deepEqual(novel, firstSeen[lessonIndex]);
    assert.deepEqual(lessonRows.filter((row) => row.is_new_word === "TRUE").map((row) => row.lexeme_id), novel);
    lessonRows.forEach((row, index) => {
      assert.equal(row.occurrence_id, `${lessonId}-p01-s01-t${String(index + 1).padStart(2, "0")}`);
      assert.equal(row.token_order, String(index + 1));
      assert.equal(row.sentence, sentence);
      assert.equal(row.qa_status, "pilot_review_required");
      assert.equal(row.audio_status, "pending");
      assert.equal(row.word_audio_source, "");
      assert.equal(row.sentence_audio_source, "");
      assert.ok(row.context_pos && row.prompt && row.sense_id && row.kk_us && row.ipa_standalone);
      known.add(row.lexeme_id);
    });
  });
});

test("teaches unit nine meanings in context without merging answer words", () => {
  const rows = a2Rows.filter((row) => row.unit_id === "a2-u09");
  const love = rows.find((row) => row.lexeme_id === "love");
  assert.equal(love.lemma, "love");
  assert.match(love.prompt, /很樂意/);
  assert.match(love.note, /不表示浪漫/);
  assert.equal(love.chunk_id, "would-love-to");
  assert.deepEqual(rows.filter((row) => row.chunk_id === "would-love-to").map((row) => row.answer), ["would", "love", "to"]);
  assert.deepEqual(rows.filter((row) => row.chunk_id === "i-am-sorry").map((row) => row.answer), ["I", "am", "sorry"]);
  rows.filter((row) => row.lexeme_id === "have" && row.chunk_id === "have-dinner").forEach((row) => {
    assert.match(row.prompt, /吃晚餐/);
    assert.notEqual(row.sense_id, "have-possession");
  });
  assert.equal(rows.find((row) => row.answer === "but").prompt_type, "grammar");
  assert.match(rows.find((row) => row.answer === "instead").note, /取代先前安排/);
});

test("provides two distinct legal transfers plus recognition and response for each unit nine lesson", () => {
  const report = validatePatternExerciseData(a2Patterns, a2Rows, "A2", a1Rows);
  assert.equal(report.valid, true, report.errors.join("\n"));
  const reading = validateReadingExerciseData(a2Reading, a2Rows, a2Patterns, a1Rows);
  assert.equal(reading.valid, true, reading.errors.join("\n"));
  for (let index = 1; index <= 4; index += 1) {
    const lessonId = `a2-u09-l0${index}`;
    const source = a2Rows.find((row) => row.lesson_id === lessonId);
    const pattern = a2Patterns.patterns.find((entry) => entry.id === source.sentence_pattern_id);
    const examples = pattern.examples.filter((entry) => entry.practiceLessonId === lessonId);
    assert.equal(examples.length, 2);
    assert.equal(new Set(examples.map((entry) => entry.sentence)).size, 2);
    assert.ok(examples.every((entry) => entry.sentence !== source.sentence));
    for (const entries of [a2Reading.recognition, a2Reading.textResponses]) {
      const exercises = entries.filter((entry) => entry.lessonId === lessonId);
      assert.equal(exercises.length, 1);
      assert.equal(exercises[0].options.length, 4);
      assert.equal(new Set(exercises[0].options.map((option) => option.text)).size, 4);
    }
  }
});

test("rejects unit nine future vocabulary and out-of-slot substitutions", () => {
  const invalidReading = structuredClone(a2Reading);
  const exercise = invalidReading.textResponses.find((entry) => entry.lessonId === "a2-u09-l01");
  const option = exercise.options.find((entry) => entry.id !== exercise.correctOptionId);
  option.text = "I would love to have dinner with you.";
  option.requiredLexemeIds = ["i", "would", "love", "to", "have", "dinner", "with", "you"];
  option.requiredChunkIds = ["would-love-to", "have-dinner", "with-you"];
  delete option.sourceSentenceId;
  const readingReport = validateReadingExerciseData(invalidReading, a2Rows, a2Patterns, a1Rows);
  assert.equal(readingReport.valid, false);
  assert.ok(readingReport.errors.some((error) => error.includes("love") && error.includes("提前")));
  const invalidPatterns = structuredClone(a2Patterns);
  const pattern = invalidPatterns.patterns.find((entry) => entry.id === "alternative-arrangement");
  pattern.slots.find((slot) => slot.slotId === "time").allowedLexemeIds = ["on", "tomorrow"];
  const patternReport = validatePatternExerciseData(invalidPatterns, a2Rows, "A2", a1Rows);
  assert.equal(patternReport.valid, false);
  assert.ok(patternReport.errors.some((error) => error.includes("tuesday")));
});

test("keeps the unit nine dialogue chronological with four evidence-backed questions", () => {
  const passage = a2Reading.passages.find((entry) => entry.passageId === "a2-u09-p01");
  assert.equal(passage.qaStatus, "pilot_review_required");
  assert.deepEqual(passage.sentences.map((entry) => entry.sentence), [
    "Would you like to have dinner with me on Friday?",
    "I am sorry, but I have to work on Friday.",
    "Can we meet on Saturday instead?",
    "I would love to have dinner with you.",
    "Can we meet at seven?",
    "I can meet at seven on Saturday.",
  ]);
  assert.deepEqual(passage.sentences.map((entry) => entry.order), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(passage.questions.map((entry) => entry.correctAnswer), ["Dinner.", "Work.", "On Saturday.", "At seven."]);
  assert.deepEqual(passage.questions[2].evidenceSentenceIds, ["a2-u09-p01-s02", "a2-u09-p01-s03", "a2-u09-p01-s06"]);
  passage.questions.forEach((question) => {
    assert.equal(question.options.length, 4);
    assert.equal(question.optionMetadata.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.equal(question.options.filter((option) => option === question.correctAnswer).length, 1);
  });
});

test("adds four capstone lessons with one-word answers and canonical inflections", () => {
  const rows = a2Rows.filter((row) => row.unit_id === "a2-u10");
  const lessons = [...new Set(rows.map((row) => row.lesson_id))];
  const sentences = [
    "Thank you for the email.",
    "The bus leaves at ten on Saturday.",
    "I can meet you at the station.",
    "I missed the bus, so I took the train.",
  ];
  assert.equal(rows.length, 28);
  assert.deepEqual(lessons, ["a2-u10-l01", "a2-u10-l02", "a2-u10-l03", "a2-u10-l04"]);
  lessons.forEach((lessonId, index) => {
    const lessonRows = rows.filter((row) => row.lesson_id === lessonId);
    assert.deepEqual(lessonRows.map((row) => row.answer), sentenceSpellingUnits(sentences[index]));
    assert.deepEqual(lessonRows.filter((row) => row.is_new_word === "TRUE").map((row) => row.lexeme_id),
      [["thank", "email"], [], [], ["miss"]][index]);
    assert.ok(lessonRows.every((row) =>
      row.qa_status === "pilot_review_required" && row.audio_status === "pending" &&
      row.kk_us && row.ipa_standalone && !row.audio_source && !row.word_audio_source && !row.sentence_audio_source));
  });
  const took = rows.find((row) => row.answer === "took");
  assert.equal(took.lexeme_id, "take");
  assert.equal(took.lemma, "take");
  assert.equal(took.is_new_content, "TRUE");
  assert.equal(took.is_new_word, "FALSE");
  const missed = rows.find((row) => row.answer === "missed");
  assert.equal(missed.lemma, "miss");
  assert.equal(missed.chunk_id, "missed-the-bus");
  assert.match(missed.note, /\/t\//);
});

test("links the Unit 10 schedule and story while retaining pilot status", () => {
  const passage = a2Reading.passages.find((entry) => entry.passageId === "a2-u10-p01");
  assert.equal(passage.qaStatus, "pilot_review_required");
  assert.deepEqual(passage.sentences.map((entry) => entry.order), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(passage.questions.map((entry) => entry.correctAnswer), [
    "The email.", "At ten.", "At the station.", "Took the train.",
  ]);
  assert.deepEqual(passage.questions[3].evidenceSentenceIds, ["a2-u10-p01-s02", "a2-u10-p01-s05"]);
  assert.equal(isLevelAssessmentEnabled("A2"), false);
});

for (const [firstAdded, csvHash, patternsHash, readingHash] of [
  ["a2-u11", "22c76232f123e03469659e8b5be290f463af1cfd3adca96a74f763977eb3ed7a", "f4d06bb0df753b907484ffb183f5bb569cfa6ff1e71b419325c5fcf8ee7799a0", "4d1675da1c460d1a01a13a62b7d2dcf2ecea9144fa7eb167ec4a119fd4b2b11a"],
  ["a2-u14", "19f72abcfc6ecee2eff00c50722cec56784e9d6426b40ab0a776c8abca07f1a7", "c899c0a6a7ea7d4fafe631fe2a34b9711665eaaa28ca1faee7f745b31171467e", "8560f470a09283de87f0f3282b89c89b305b97cc64c9a37f4c64cf47ae621a6a"],
  ["a2-u20", "c557b687aefe1004cb995204f23eb7145057134c94d7bfa52dc02de0b0c8bc23", "129f333112e6bc717fc894027d3ec6fa2dba2391b9fb7cc970d3f5f7314a86fe", "4dbb9b8dbd0bdac06289c4dce51d216792ddb250075ee362bc6c5ca00ec03908"],
  ["a2-u26", "191a6efb06e54508eb31fc35f7c9d03fbfcfab2da13adae413c75819e1fa00c0", "b08b497ffdc46d96f7e78a4a55dbfaaf2e485a780af1cdea1998a96395e191ba", "769a51c45915bbab9d080ee275c3155e832e0670e174ec2609459c9b06c4a0b5"],
  ["a2-u32", "f6fc84fd842ac994c3e4a672723636f629e3627556bebb786918393d6a766c97", "914c5fc59533be35c9ed9f47b40bbc41c8d79cd7d60bd5281f26b0837fc4a734", "7e1b492ca5e8986456f4726b69e7581f652a69c6261c88c8c9b77459039deb25"],
  ["a2-u35", "1f2af133581fbb2d6ee226845e7aebab31ada66e86e52e8c2fbdb146c988d30b", "fb14e080d49ad0c1f7ee61a9ea5a2fd5b7005f502205a1d070abddc5d700d20a", "532d2ca683ed1de25ab36473cf78f4974800ad8e810462094b4b3a3a83cfd80d"],
  ["a2-u38", "357819347532de6abe739156ce7c58f0c20c8b5d231a8ff19124701a28dab247", "04fabf1748578ea3e4d0b3f19f07afab3758a7e67ad20eec03af6429e50b51e1", "b93cf4864b9d379968af9243334945604365f9b071b6609585a89ae941f6ae52"],
  ["a2-u41", "6996f7262d68b503a2692bdc966abdd375c6f2e62dc45f81c956a4ce8fc46b35", "80ac9f764c1d3438a8087db63625d60787b6b256801088325dd4fcfef5fd6f34", "0eda8905fc0e58520766f25e3f71493977197bc90d0a6d2770fe41b2e6b8ca2e"],
  ["a2-u44", "1abe2b15148fa72da691ebd7dcd75761ec71a1c840c7f2da81356cb341371d3b", "8d11c69ee9c587cdab87f2c6d327776896cea86aed8e7ec42c4156ebc871e627", "df3a3aa7b05dae648c51887998d057e0efe16bac65cff7ee4d9bdd18c1221d23"],
  ["a2-u47", "fd160c7633efcfa58e478a78e6e9b743e6b53c7e0650d030ca1bfc4cbf536006", "eb2f29d5ed2edaa802e7b00e807a795e0fe920f9ad111894307ccb81ec2ace4a", "bf76c3727570e00caa33220ff6b41c03cd60b0c2ef9ca40fc4ccb53abbf35d82"],
  ["a2-u50", "ba4e9cd6c12cccc6804c85f27d7e721630e0b82a8365742d097fdf1c5d5d277a", "a7031aa06e0c4a3b37136a43792989fdd469da9bc999a2b59753256f555ffbf5", "7cdc5202398bafa2e242708b075ba706866912c0f83778e290765fceba33d658"],
  ["a2-u53", "3b6d6c1a503b66b447ee18817b9e7b91aae3ae99eec0c3b25337124982e692a1", "fa31fca6780fc235da6780c2fc4f90489bd95671d7b24e8043ec147e806cd263", "a7ac7de3d7bff0c0e648157fbcf5023b4f48a7f678e6482962d7811ef8fffe28"],
  ["a2-u56", "27c7ef6e631f0e9e1c20099190c7eecc14897551d7258ada13ddeb750fbd18b9", "7e41ad78cb3d3ef5ccbf4251a40e892cc4db9528cad90318152625338d0b7b36", "2a6256b38b9cae715d8e4e1838f7f1ad8b681bb50eaffb3e37e3743573bc843c"],
  ["a2-u59", "51da9b3b7ce34e906443329db3c445015a020213a22c364a86aa594b735f04e9", "14c9f581e617b2b1691ea3a643d144b79e5fcc0eb44e868b1b827f93bde442b3", "d6856c637a5d938866109a60f93321acd85e3e68adf8ddafe5ae401ed5060d97"],
  ["a2-u62", "bc45dad5662d5ef9ad3c34d53e1b35c9fbe3adf39c66fcb07f73d4e08c667920", "1b79d14c9b1273550c88ed8eff32acb6444a60a8ba76ec84f528bd0e7857ab49", "987a1291592f7c5b21e20524f0a45e4d362b75f3cdfb1900a4d52e3d44e0b6ae"],
  ["a2-u65", "9cf74d4d6bad5e270d0b1dc0df51dadb4a37fb195ab3221bce242ae8fdd50a55", "3a3f6f4f67d09fc134e7b233818cebd6e03a77c367576622ab41508789ffb948", "e4d1c5ca3d67860c2622222f8bd489e51d970e81f43e7aee4681b63e1dd69d02"],
  ["a2-u68", "fefd8f59a024bfc819b2c3ee806d3dceba8f6e234b394dfa5168e0674c271893", "c527288769e279fb43f396964e6ee8090097fecfb24459522fa58634598c4c7a", "65737975d2b574d3c3e398eb7f63a5b0b5db14d23afa4249a8a03ada91314b1c"],
  ["a2-u71", "d6f0f9b115a8dfb7c8057f4df19cabc032fe83a9833e44c438e9f894016e8d87", "670d717e84303155c5f819c5a1dfa6cdf55d29292cf979243da34531b22d8402", "562fb8b263ebf213527b092f351503e863613bb8849b6c5ab56f3225a8f7a22a"],
  ["a2-u74", "e4490173b657e6a8710379c4a860fe4966da01363d29a46b1586898408ecbd00", "890e4abb40d3c3efe1f8b45576469aa73a25377f94c32b01373e8a4397cea0b8", "cf22899036054623e3f8bd60fadd559dd655326a3cf5538a52f6e19e25bfa9d0"],
  ["a2-u77", "308b4ab9c816d02c8fce066215acf33d2a3430ff4c79de0a3a9b9cfd3d118713", "a147650824ed1bb0a1522e910bf7a8af588914d1b201561afaa098d2aec4a395", "8d14c8dc0eef4928e4cdece3617d215adbd8106761bab502011dd6884fbc991f"],
  ["a2-u80", "3d2923c2836644afad877ccebffd83ca72b2435d6740cd1a54bb21b5e836fdb6", "8837b46039b9eafd8adeee18d4781e90c5c1c879a1c75549b8578be5daf2f39d", "ecf04aa6825d7a3fe6e46f9e043e047c2482f5d564ecac80641ea7f3ff14b827"],
  ["a2-u83", "8584eb5505398815fca6d42c07114864bc76fa1418ef14c553b357fdcc2d9c53", "17583845ad398e6fba6b32b28b4bbe49989d7b144a9537a19a7c1077ca36bfd4", "e32988eb113e5d4f808741c9f44f00481546e755b28782278caec78aaabe9a2b"],
  ["a2-u86", "d009f2de4032dc21049a8fdc5dcb6c86fa9b502320d237ea1b75df2831964769", "3904672c120a93d2fcea1b1e0c9c3f647a3d54add149358976fc81bd97e7f0b7", "e56aabbc98c86e31ce4aa77285fdd1c16f2fa50e47235cb6623489d0ea463609"],
  ["a2-u89", "ee58ec70f9045c1f48a0283b7e7737dcac9d665a954d79a23c444ed0ea9a155d", "e5cfa5104cfe15b586a00bf8311f53a35ea52157aa0260a99a760ac102a80ba6", "bb3f26de1d58459f7161f06902c212a6df66a920cc04a9131651fc8c7c646338"],
  ["a2-u92", "c519673ce13563d4ef9fa145f115f6b2b5ea178d410f12de776e80c4857fff87", "acea08f6cc1447cc77c521c68bfcec412d2494ec6317d5d116f10291a351c849", "9faa4ea56098bcfe1e58df034eef1bf1aefaaefaf8c6c3de1ad688cc743a72ad"],
  ["a2-u95", "04b212bf1625b33f2d6d6f6db47333f60b05b7f17a7d095c2e8fee8cbd4221ae", "c67c34f97754d4ddbc7843dd792a1e21e80d4258037fff09f437146bf4b922f1", "9812464b531d6dc27a055d20725bda0ffd490c6daba5c841016e1d43f21dc2e5"],
  ["a2-u98", "dee742d7411ccf52d7c7fd00e34eab5b5ef824529b36bb36355235dce0712e6f", "cddda24dd257d6c32e62d0521e3d4f96d6e9857c14c5b25063d9b912899e2809", "408c1f297c88dcc489d5be1ea934f5fcbbda73c5a75480d198f22ff1bcddd7be"],
  ["a2-u101", "1df6691563c7a9fe29d83d73e8109b1541e90a84c1c15f6b743b8217c27586dc", "c214425230e74f3335a69a0b434fe491650c906dceaed4fdc4447055fbffb264", "9afd86760314f718bd81b30630f07c3f8127c0f93a420a2eaefd91f06e20f6db"],
  ["a2-u104", "2a128453045af3224be3ee6bb0b2082bafa3a169a2c223098c36567b3f8f29ea", "fbba313424650d428d8c3b19fb70c3a98deb829a40109fdd03130f8c161e175f", "4748ca06906c652517ad334c959a7e5f4c1c3e1958c9e75bec9cddbce6ee9aa9"],
  ["a2-u107", "31f63331d86c48ffdbc67452e1817d733ab3141918847596554ee19aa20de6cc", "cdeae89588d24b2b2a7edd147423cda29c6d18a46f412f07936828b906e948e6", "55cdfee52acd7560d6068e4c35dfce603e3b05cef43042596889176ed016902a"],
  ["a2-u110", "a64b7b85be6abbe027093be9d80a5c286ff0feef6ce84c447f98323d6e7a7266", "8096ecfa24e482af24bff239d2fe9a78e81409c0b29ebc3a26d638bee6f24333", "6f8c3b5647731ab5b6ac15c11667de669c09980829673d5ce37832f684e925f0"],
  ["a2-u113", "c0f519191eda48050b951faed3dba6b95b35bebe8a66d10dba96f5c7f66b0ff4", "d10f0ebc2012110a3029bb666c9b87b1b0d8573ad08f01c1b72f430e017ace01", "a866636ae93520b55842e011a5fa24334ebd8029e607037fc1cedeb2856d9493"],
  ["a2-u116", "39abb0ce2696263c023dac4b1334ee1fe9d5f2e341ee45dfd1ca4cfd7ea7947a", "d9df16b795966117a3f0806b4bc85343da086f9f51652d14599d62d7cda278ec", "a2aa3367afd49d814b1056787671ed920baa51b4275d7c97d4e0c3a46ae0a096"],
  ["a2-u119", "f048569321af41cdecd99ffa88b1879e45d5ff78c308b492c5c33ff911bbf57f", "451b209b56f30cdf05716d090351fdf84275a54839b08a5112f49befbcac4e29", "14ed0f56d905b016e2ad9c9189897f751fb0284929fb53dd1a59941436a87646"],
  ["a2-u122", "31f782ebc0752bb28c1c6b77ee4e777681c77c2af92503e36d3a6493bb115450", "7a0d09e481dcfacf44499fa8672cfd21ff7537241b9ddeb35e2101d1606df7be", "66ed1bdf4a2732d7d08ecec6a0c58e70ea40bdc2056a1bd9ff9247987a3880ff"],
  ["a2-u125", "aa63ed64833c02c7e1fd1b89ea675a9d10a16e8d4d598900034253c447716ee7", "2dced4d3dd67881fa759088a6e5560657f9cafdfeedd9ae80909f949a1fb6f9f", "c80c02aedf7200ffbdc03cc525c4fdae49aafda818bfa2e63e705fdf7fe53b44"],
  ["a2-u128", "db4a672e13a896f8bc12aa342e822f0bf0618403bdf1dc6c183bf9bb7aaaf7af", "4b6736e50570c54115b41beeb29571123f03731c85e5a0b255055d14c365e9a3", "a288cbe899c70b3ec4ef9e85f35aa78eb285073685caa7dc2bf33ef11040e15e"],
  ["a2-u131", "26872171dc7cf7ee8f8aa6e72cbb11522af931d7ee00edcf8608e17a6b01e57e", "30670344baa08239501f5835b2d0fa37071003a7206820dd9385b6006ab3ebf9", "3a723dd3429b9a87e50354c067911cc5de92077d469210d0d8071b92c95104bf"],
  ["a2-u134", "96c83d2d45aaed5e2f1d2bee0710719f46f91683862d620ab95e2b5b23f99901", "4236d90e4c5ede23d0a6f2d9b02c19c1673471616cfedeeb25d0cf6ab2899f17", "798fad6ac6241dc9402575b54a1407890301d35ddf94c659f35ae747fbc74dd2"],
  ["a2-u137", "da923ac6cdb6621537542c3f2fe101c2d54366539e0404499f626d468f20096a", "a3cb81df801c2065b9168d1ad1ab9a33da2e20d74fbe428e7ae43d1b2e864dcd", "660e71c78ec318ed2f7efbdc4cd335acdf23a5b0ef2f7c0c229b33450aecf31f"],
  ["a2-u140", "08a05682e5a47faceb100367d91fce70260d3e5be29898771c631ee520ead685", "c9f2240fe8b9199046d63878ff15f279a3b779beafb229122808a30d5a90c006", "10bc4659ea38069920b7b237e59a19a88cf522034c02cf2177a8d422ea87bf6a"],
  ["a2-u143", "17d8f1b7afafa46ea3f380fd8ed179d3c91aa89caf4d282b4b96192ef56a91a5", "6388ae4602f97e87cfd9c978cb64e6257b5cc92dd703e12df483ec254688617c", "d1646670344c2e0219ab07876145dc5efbdb186c83926f4c68ef9fd972173602"],
  ["a2-u146", "b79d8b93ed4edaa4d84e4664c6066fb56407518155c483d2bacebd28d9f93f2f", "48e1c89073faa943fc5613d464de76aa4e078ab2b9a7dce56b5d63d962dde922", "b79353453aad46c01de53843aa52fc1f2028855b528f23a27a8d990219ccd5cd"],
  ["a2-u149", "92786f103bc2020e282ba5996e319dec206fe974d54e5f50dd8948fe440a7ee7", "44f919942e05ad2dc1690c1270b3a674971f8ffb6f08449f61152c90c4d344de", "55b1344592d51cb28ba54fb600977fb5870f56486aeb9f854fd16cf03b559908"],
  ["a2-u152", "3b794770c2e5931e469768aeb0753372f3b8d7851d2241efd8acf0ad6d5c633c", "f07eb6ed241048e5426e830098865a7f05e4d560993ee97059a69932711af693", "12140fde883c6adbb51bdf359a5851e126d330200cd7c6b5e1dca7e9094f8675"],
  ["a2-u155", "90491da2bc90fd22cebbdfaeae49db702dde1e84d674312d3ec68372eb2591dc", "b58ad4366d2651b179387cf737503a870e05410be97d491ec6b32ef9f0a56528", "d8bef9eb1ababe86ed67d1120e1d7d0ad0f192bf36fe267828bd4bf5fbd0d5a3"],
  ["a2-u158", "2c39dfc1e9ff735377ee4e09595c8cc9d5f2dc44ae7150538b14693b7832e152", "1e99cfa36e3b26da774efde6c2dfd6517c0441f05daaeb37e5bd7fde689bac74", "24c3b3a0f9fe7ede0ff392d828ec71f9ba18ce34c3b373e9df57086f1e7a08c4"],
  ["a2-u161", "ba4c7fd4123722cfd3dcab729945ce80b3060ad20505dd11b9048f34ebbc9ace", "de5608fde964d040eb742ce2c7a11c9c640697466fda8c33a1371de15ed5fe38", "e66a9059f4cd1bc37aebdad51c02e4668379ceb4f061056b3e8b778ba392ed7c"],
  ["a2-u164", "69d304d5f24bdde81d7ddc86d9e13ebd2285810e0726b870cefb487b286d26cf", "ad08e529515a1cab15728b75501eb7f89cb26ffe4be1a31f34a6d39ab6676d9a", "86dc67ca690681d65c3280e49f7f32fde0c4e5fd25194c662af1b52cb2c678b4"],
  ["a2-u167", "585c8d21419a88401361011b7b19a44be6f325b70fab1bd057f9433eb1668f52", "a9f647762bf28144d808a31e1a87af09a9d2a164bec4c4211fb51120ba7bb2cf", "4dc6dda37d879c1563c9ac7942f7dbf1704f21bfa4644695ab7c4eb757aaee70"],
  ["a2-u170", "02346cf36e4a52ab01bdb2176668ff94cd73e2750a88534127b826ed77fb26fe", "cc69f450093eae48656347398fd65c547af6e780abb2626af7a42eb712acfead", "9f40d02bfba3160c615cb108e193c5057c10ff7d947bb5bf4732a093f3db1f55"],
  ["a2-u173", "bc92fa4fe1d1cf0ad100a1749e6e4e0070aa787967f6e19a932a7ec0029e447a", "93adb994bca3eaf9d3289df76a7f98ecc6bc952d43993d3bc1a2632b3f46604a", "a7fc5c69f085d748670cfd6c6c5fb7e19df89c22342f54d7ae25c04beadd75b8"],
  ["a2-u176", "78eef768ee9a0b53478d166a225b8d0dd23e010fc5a466f02ee7aa51722964c1", "c114fc40744e6ebc8e135bbc63ecf55f1ec7fbd06cdb58750118ce723a524fe5", "7675e414fe3d815cbde1abf3c3a9b9894419fb90bf7ae8298069c720900fa5f0"],
  ["a2-u179", "26caf045b2db17f1312f7a16624741164026f47b9e8e220cc16a452022f342b1", "9f77926025b11bcdf79110c7245292795c1520c54667f21a6e512f41af994bbf", "d442a1c4bd32c40f19b23a9be129e8769e918cfc06db692058e88872d71f0633"],
  ["a2-u182", "58ca2cac599f770f18a4b4ed642789324e9b6384b06170ab6400c7c5d86e4a59", "32b911a0dbdec48ea9a0b95496eaf66d614ec627b9347486abcb2ab7ee659924", "123f2b501baa960c725adb7f803f596c4eeb5f1bfa163195746238a41959c229"],
  ["a2-u185", "967c0c87df6c90b3aa93879cc5de79a0f5409daa0c74187c7bdc0f7a55ee94d7", "cd5c047cea52af351721b98ea29905c24e3bc701be207103d5a174ea74a31d36", "61be4d8773ef94e0a6e307b4dc097cbfdae95436d1b9a02f12b34f0ebbeb9a59"],
  ["a2-u188", "9f388f778cee76adafb6d9ae77cdbf3a100edb37d4a1a5c9d2626ebaaad9cd5f", "a8160c8d40fcdd0bfa66867f0b37a38af022c07a950170b9ca95dc68299ef491", "b5a67dd0ae96c2e52fd3586fdb6cf8b1c96d7e8035c7626dba3c1f8259ece3f8"],
]) {
test(`preserves all A2 curriculum and exercises before ${firstAdded}`, () => {
  const before = (id) => a2UnitNumber(id) < a2UnitNumber(firstAdded);
  const digest = (text) => createHash("sha256").update(text.replaceAll("\r\n", "\n")).digest("hex");
  const canonicalJson = (object) => `${JSON.stringify(object, null, 2)}\n`;
  assert.equal(
    digest(serializeCourseCsv(a2Rows.filter((row) => before(row.unit_id)), COURSE_CSV_HEADERS)),
    csvHash,
  );
  assert.equal(digest(canonicalJson({
    ...a2Patterns,
    patterns: a2Patterns.patterns.filter((pattern) => pattern.examples.every((entry) => before(entry.practiceLessonId))),
  })), patternsHash);
  assert.equal(digest(canonicalJson({
    ...a2Reading,
    recognition: a2Reading.recognition.filter((entry) => before(entry.lessonId)),
    textResponses: a2Reading.textResponses.filter((entry) => before(entry.lessonId)),
    passages: a2Reading.passages.filter((entry) => before(entry.passageId)),
  })), readingHash);
});
}

test("teaches applied A2 forms in order with contextual prompts and provisional phonetics", () => {
  const known = new Set([...a1Rows, ...a2Rows.filter((row) => a2UnitNumber(row.unit_id) < 11)]
    .map((row) => row.lexeme_id));
  const applied = a2Rows.filter((row) => a2UnitNumber(row.unit_id) >= 11);
  const newIds = new Set();
  for (const row of applied) {
    assert.equal(row.is_new_word, known.has(row.lexeme_id) ? "FALSE" : "TRUE", row.occurrence_id);
    if (!known.has(row.lexeme_id)) newIds.add(row.lexeme_id);
    known.add(row.lexeme_id);
    assert.equal(row.qa_status, "pilot_review_required");
    assert.equal(row.audio_status, "pending");
    assert.ok(row.kk_us && row.ipa_us);
    assert.equal(row.word_audio_source, "");
  }
  assert.equal(newIds.size, 419);
  const token = (lessonId, answer) => applied.find((row) => row.lesson_id === lessonId && row.answer === answer);
  assert.equal(token("a2-u11-l02", "Could").lexeme_id, "can");
  assert.equal(token("a2-u12-l03", "ordered").lemma, "order");
  assert.equal(token("a2-u13-l01", "booked").lexeme_id, "book");
  assert.equal(token("a2-u13-l02", "leave").lexeme_id, "leave");
  assert.equal(token("a2-u12-l01", "see").prompt, "看一下");
  assert.equal(token("a2-u12-l04", "check").sense_id, "check-restaurant-bill");
  assert.equal(token("a2-u13-l03", "is").sense_id, "be-linking-state");
  assert.equal(token("a2-u13-l04", "you").sense_id, "you-subject-request");
  assert.equal(token("a2-u11-l04", "you").sense_id, "you-object-recipient");
  assert.equal(token("a2-u14-l04", "in").sense_id, "in-clothing-size");
  assert.equal(token("a2-u15-l02", "does").lexeme_id, "do");
  assert.equal(token("a2-u15-l02", "train").prompt, "火車");
  assert.equal(token("a2-u16-l02", "sent").lemma, "send");
  assert.equal(token("a2-u16-l03", "check").context_pos, "verb 動詞");
  assert.equal(token("a2-u17-l01", "to").sense_id, "to-destination");
  assert.equal(token("a2-u18-l04", "works").lexeme_id, "work");
  assert.equal(token("a2-u19-l01", "lost").lemma, "lose");
  assert.equal(token("a2-u21-l01", "to").context_pos, "infinitive marker 不定詞標記");
  assert.equal(token("a2-u21-l03", "works").lexeme_id, "work");
  assert.equal(token("a2-u22-l04", "sounds").lexeme_id, "sound");
  assert.equal(token("a2-u24-l03", "by").sense_id, "by-deadline");
  assert.equal(token("a2-u25-l02", "was").lexeme_id, "be");
  assert.equal(token("a2-u26-l03", "me").prompt, "我（受詞）");
  assert.equal(token("a2-u27-l04", "do").context_pos, "verb 動詞");
  assert.equal(token("a2-u28-l02", "rains").lexeme_id, "rain");
  assert.equal(token("a2-u29-l03", "How").sense_id, "how-with-much-price");
  assert.equal(token("a2-u29-l04", "dollars").lemma, "dollar");
  assert.equal(token("a2-u31-l02", "to").context_pos, "infinitive marker 不定詞標記");
  assert.equal(token("a2-u31-l02", "home").sense_id, "home-destination-adverb");
  assert.equal(token("a2-u32-l03", "bags").lexeme_id, "bag");
  assert.equal(token("a2-u32-l04", "by").sense_id, "by-payment-method");
  assert.equal(token("a2-u33-l04", "ends").lexeme_id, "end");
  assert.equal(token("a2-u34-l03", "in").sense_id, "in-future-duration");
  assert.equal(token("a2-u35-l02", "wait").context_pos, "noun 名詞");
  assert.equal(token("a2-u35-l03", "wait").context_pos, "verb 動詞");
  assert.equal(token("a2-u35-l01", "have").sense_id, "have-seating-available");
  assert.equal(token("a2-u36-l02", "read").ipa_standalone, "/ɹid/");
  assert.equal(token("a2-u36-l03", "have").sense_id, "have-a-question");
  assert.equal(token("a2-u37-l02", "close").ipa_standalone, "/kloʊz/");
  assert.equal(token("a2-u37-l03", "this").sense_id, "this-current-room");
  assert.equal(token("a2-u38-l01", "faster").lexeme_id, "fast");
  assert.equal(token("a2-u38-l02", "takes").sense_id, "take-duration");
  assert.equal(token("a2-u38-l04", "take").sense_id, "take-travel-transport");
  assert.equal(token("a2-u39-l01", "away").sense_id, "away-in-put-away");
  assert.equal(token("a2-u39-l03", "do").context_pos, "verb 動詞");
  assert.equal(token("a2-u40-l01", "order").sense_id, "order-purchase-noun");
  assert.equal(token("a2-u40-l04", "details").lexeme_id, "detail");
  assert.equal(token("a2-u41-l01", "tickets").lexeme_id, "ticket");
  assert.equal(token("a2-u41-l02", "How").sense_id, "how-with-much-price");
  assert.equal(token("a2-u41-l03", "Children").lexeme_id, "child");
  assert.equal(token("a2-u41-l04", "entrance").ipa_standalone, "/ˈɛntɹəns/");
  assert.equal(token("a2-u41-l04", "floor").sense_id, "floor-building-story");
  assert.equal(token("a2-u42-l02", "until").semanticRole, "忙碌的結束時間");
  assert.equal(token("a2-u42-l03", "around").semanticRole, "約略時間");
  assert.equal(token("a2-u42-l04", "a").sense_id, "a-in-a-few");
  assert.match(token("a2-u42-l04", "a").note, /要整組理解為「幾個」/);
  assert.equal(token("a2-u42-l04", "few").chunk_id, "a-few-minutes");
  assert.equal(token("a2-u43-l02", "number").sense_id, "number-reference-code");
  assert.equal(token("a2-u43-l03", "show").sense_id, "show-display-for-verification");
  assert.equal(token("a2-u43-l04", "sign").sense_id, "sign-write-signature");
  assert.equal(token("a2-u44-l01", "First").context_pos, "adverb 副詞");
  assert.equal(token("a2-u44-l01", "clothes").context_pos, "plural noun 複數名詞");
  assert.equal(token("a2-u44-l02", "hot").chunk_id, "hot-water");
  assert.equal(token("a2-u44-l04", "when").context_pos, "conjunction 連接詞");
  assert.equal(token("a2-u45-l01", "hour").chunk_id, "for-an-hour");
  assert.equal(token("a2-u45-l02", "hour").chunk_id, "per-hour");
  assert.equal(token("a2-u45-l03", "by").sense_id, "by-deadline");
  assert.equal(token("a2-u45-l04", "leave").sense_id, "leave-item-at-location");
  assert.equal(token("a2-u46-l01", "out").chunk_id, "fill-out");
  assert.equal(token("a2-u46-l03", "Do").context_pos, "auxiliary verb 助動詞");
  assert.equal(token("a2-u46-l03", "number").sense_id, "number-phone-contact");
  assert.equal(token("a2-u46-l04", "by").sense_id, "by-delivery-method");
  assert.equal(token("a2-u47-l02", "bottle").chunk_id, "plastic-bottle");
  assert.equal(token("a2-u47-l03", "empty").context_pos, "verb 動詞");
  assert.equal(token("a2-u47-l04", "goes").lexeme_id, "go");
  assert.equal(token("a2-u48-l01", "down").chunk_id, "turn-down-volume");
  assert.match(token("a2-u48-l02", "a").note, /整組理解為「有一點」/);
  assert.equal(token("a2-u48-l04", "down").chunk_id, "keep-it-down");
  assert.equal(token("a2-u49-l01", "here").chunk_id, "for-here");
  assert.equal(token("a2-u49-l02", "go").sense_id, "go-in-to-go-takeaway");
  assert.equal(token("a2-u49-l03", "side").chunk_id, "on-the-side-food");
  assert.equal(token("a2-u49-l03", "Could").sense_id, "could-polite-order");
  assert.equal(token("a2-u49-l04", "separate").ipa_standalone, "/ˈsɛpəɹɪt/");
  assert.equal(token("a2-u49-l04", "drink").context_pos, "noun 名詞");
  assert.equal(token("a2-u50-l01", "open").context_pos, "verb 動詞");
  assert.equal(token("a2-u50-l02", "open").context_pos, "adjective 形容詞");
  assert.equal(token("a2-u50-l02", "are").lexeme_id, "be");
  assert.equal(token("a2-u50-l03", "Sunday").chunk_id, "except-sunday");
  assert.equal(token("a2-u51-l01", "front").chunk_id, "in-front-of");
  assert.equal(token("a2-u51-l01", "in").sense_id, "in-part-of-in-front-of");
  assert.equal(token("a2-u51-l02", "across").chunk_id, "across-from");
  assert.equal(token("a2-u51-l04", "right").sense_id, "right-intensifier-near");
  assert.equal(token("a2-u52-l02", "letter").sense_id, "letter-alphabet-character");
  assert.equal(token("a2-u52-l03", "numbers").lexeme_id, "number");
  assert.equal(token("a2-u52-l04", "back").sense_id, "back-in-read-back");
  assert.equal(token("a2-u53-l01", "take").sense_id, "take-accept-payment");
  assert.equal(token("a2-u53-l01", "cards").lexeme_id, "card");
  assert.equal(token("a2-u53-l02", "working").lexeme_id, "work");
  assert.equal(token("a2-u53-l03", "cash").chunk_id, "in-cash");
  assert.equal(token("a2-u53-l04", "change").sense_id, "change-money-returned");
  assert.equal(token("a2-u54-l01", "delayed").lexeme_id, "delay");
  assert.equal(token("a2-u54-l01", "by").sense_id, "by-amount-of-delay");
  assert.equal(token("a2-u54-l02", "one").chunk_id, "the-next-one");
  assert.equal(token("a2-u54-l03", "leaves").lexeme_id, "leave");
  assert.equal(token("a2-u55-l01", "new").chunk_id, "new-to-the-team");
  assert.equal(token("a2-u55-l02", "sales").lexeme_id, "sale");
  assert.equal(token("a2-u55-l04", "with").chunk_id, "help-with");
  assert.equal(token("a2-u56-l01", "to").sense_id, "to-after-need");
  assert.equal(token("a2-u56-l03", "fit").sense_id, "fit-inside-space");
  assert.equal(token("a2-u56-l04", "heavy").chunk_id, "too-heavy-to-carry");
  assert.equal(token("a2-u56-l04", "is").sense_id, "be-linking-weight");
  assert.equal(token("a2-u57-l01", "have").sense_id, "have-provide-housing-feature");
  assert.equal(token("a2-u57-l02", "next").chunk_id, "next-to-place");
  assert.equal(token("a2-u57-l03", "brighter").lexeme_id, "bright");
  assert.equal(token("a2-u57-l04", "window").chunk_id, "with-a-window");
  assert.equal(token("a2-u58-l01", "dropped").lexeme_id, "drop");
  assert.equal(token("a2-u58-l02", "broke").lexeme_id, "break");
  assert.equal(token("a2-u58-l02", "floor").sense_id, "floor-interior-surface");
  assert.equal(token("a2-u58-l03", "up").chunk_id, "clean-it-up");
  assert.equal(token("a2-u58-l04", "get").sense_id, "get-fetch-replacement");
  assert.equal(token("a2-u58-l04", "will").sense_id, "will-commit-to-replacement");
  assert.equal(token("a2-u59-l01", "order").chunk_id, "out-of-order");
  assert.equal(token("a2-u59-l03", "There").sense_id, "there-exist-introducer");
  assert.equal(token("a2-u59-l03", "floor").sense_id, "floor-building-story");
  assert.equal(token("a2-u59-l04", "me").sense_id, "me-after-show");
  assert.equal(token("a2-u60-l01", "space").sense_id, "space-capacity-in-class");
  assert.equal(token("a2-u60-l02", "full").sense_id, "full-no-space-left");
  assert.equal(token("a2-u60-l03", "sign").chunk_id, "sign-up-for");
  assert.equal(token("a2-u61-l01", "often").chunk_id, "how-often");
  assert.equal(token("a2-u61-l01", "take").sense_id, "take-out-remove");
  assert.equal(token("a2-u61-l02", "it").chunk_id, "take-it-out");
  assert.equal(token("a2-u61-l02", "at").sense_id, "at-in-at-night");
  assert.equal(token("a2-u61-l03", "twice").chunk_id, "twice-a-week");
  assert.equal(token("a2-u61-l04", "turns").lexeme_id, "turn");
  assert.equal(token("a2-u62-l01", "pieces").lexeme_id, "piece");
  assert.equal(token("a2-u62-l01", "into").sense_id, "into-cutting-result");
  assert.equal(token("a2-u62-l03", "sugar").chunk_id, "a-little-sugar");
  assert.equal(token("a2-u62-l04", "with").sense_id, "with-instrument");
  assert.equal(token("a2-u63-l01", "hair").chunk_id, "get-my-hair-cut");
  assert.equal(token("a2-u63-l03", "off").sense_id, "off-cut-some-length-away");
  assert.equal(token("a2-u63-l04", "longer").lexeme_id, "long");
  assert.equal(token("a2-u64-l01", "check").chunk_id, "check-out-of-stay");
  assert.equal(token("a2-u64-l02", "leave").sense_id, "leave-object-at-desk");
  assert.equal(token("a2-u64-l03", "luggage").chunk_id, "leave-my-luggage");
  assert.equal(token("a2-u64-l04", "for").chunk_id, "come-back-for-it");
  assert.equal(token("a2-u65-l01", "something").chunk_id, "something-for-a-headache");
  assert.equal(token("a2-u65-l02", "twice").chunk_id, "twice-a-day");
  assert.equal(token("a2-u65-l03", "meal").chunk_id, "after-a-meal");
  assert.equal(token("a2-u65-l04", "help").sense_id, "help-remedy-works");
  assert.equal(token("a2-u66-l01", "It").sense_id, "it-weather-subject");
  assert.equal(token("a2-u66-l02", "wear").chunk_id, "wear-a-warm-coat");
  assert.equal(token("a2-u66-l03", "an").sense_id, "an-before-vowel-sound");
  assert.equal(token("a2-u66-l04", "warmer").lexeme_id, "warm");
  assert.equal(token("a2-u67-l01", "take").sense_id, "take-transport-person");
  assert.equal(token("a2-u67-l02", "take").sense_id, "take-require-time");
  assert.equal(token("a2-u67-l03", "stop").sense_id, "stop-vehicle");
  assert.equal(token("a2-u67-l04", "receipt").chunk_id, "get-a-receipt");
  assert.equal(token("a2-u68-l02", "hurts").lexeme_id, "hurt");
  assert.equal(token("a2-u68-l03", "started").lexeme_id, "start");
  assert.equal(token("a2-u68-l03", "ago").chunk_id, "two-days-ago");
  assert.equal(token("a2-u68-l04", "see").sense_id, "see-examine-patient");
  assert.equal(token("a2-u69-l01", "these").lexeme_id, "this");
  assert.equal(token("a2-u69-l01", "apples").lexeme_id, "apple");
  assert.equal(token("a2-u69-l02", "each").chunk_id, "two-dollars-each");
  assert.equal(token("a2-u69-l03", "take").sense_id, "take-buy-decision");
  assert.equal(token("a2-u70-l01", "weekends").lexeme_id, "weekend");
  assert.equal(token("a2-u70-l02", "park").chunk_id, "walk-in-the-park");
  assert.equal(token("a2-u70-l03", "read").chunk_id, "like-to-read");
  assert.equal(token("a2-u70-l04", "come").chunk_id, "come-with-me");
  assert.equal(token("a2-u71-l01", "live").chunk_id, "live-with");
  assert.equal(token("a2-u71-l02", "and").sense_id, "and-join-equal-items");
  assert.equal(token("a2-u71-l03", "lives").lexeme_id, "live");
  assert.equal(token("a2-u71-l04", "works").chunk_id, "works-in-an-office");
  assert.equal(token("a2-u72-l01", "find").chunk_id, "where-can-i-find");
  assert.equal(token("a2-u72-l02", "shelf").chunk_id, "on-the-second-shelf");
  assert.equal(token("a2-u72-l03", "sale").chunk_id, "on-sale");
  assert.equal(token("a2-u72-l04", "cheaper").lexeme_id, "cheap");
  assert.equal(token("a2-u73-l01", "working").chunk_id, "is-not-working");
  assert.equal(token("a2-u73-l02", "floor").sense_id, "floor-interior-surface");
  assert.equal(token("a2-u73-l03", "fix").chunk_id, "fix-it");
  assert.equal(token("a2-u73-l04", "home").sense_id, "home-at-residence");
  assert.equal(token("a2-u74-l01", "off").chunk_id, "take-friday-off");
  assert.equal(token("a2-u74-l02", "help").chunk_id, "need-to-help");
  assert.equal(token("a2-u74-l03", "report").chunk_id, "help-with-the-report");
  assert.equal(token("a2-u74-l04", "Thursday").chunk_id, "on-thursday");
  assert.equal(token("a2-u75-l01", "looking").lexeme_id, "look");
  assert.equal(token("a2-u75-l02", "tall").sense_id, "tall-height-person");
  assert.equal(token("a2-u75-l03", "wearing").lexeme_id, "wear");
  assert.equal(token("a2-u75-l04", "was").sense_id, "be-past-location");
  assert.equal(token("a2-u76-l01", "ordered").chunk_id, "what-i-ordered");
  assert.equal(token("a2-u76-l02", "little").chunk_id, "a-little-cold");
  assert.equal(token("a2-u76-l03", "warm").sense_id, "warm-heat-up");
  assert.equal(token("a2-u76-l04", "one").chunk_id, "bring-a-new-one");
  assert.equal(token("a2-u77-l01", "account").chunk_id, "open-a-bank-account");
  assert.equal(token("a2-u77-l02", "passport").sense_id, "passport-identity-document");
  assert.equal(token("a2-u77-l03", "money").chunk_id, "how-much-money");
  assert.equal(token("a2-u77-l04", "card").chunk_id, "use-the-card");
  assert.equal(token("a2-u78-l01", "bill").sense_id, "bill-payment-statement");
  assert.equal(token("a2-u78-l02", "amount").sense_id, "amount-sum-of-money");
  assert.equal(token("a2-u78-l03", "charged").lexeme_id, "charge");
  assert.equal(token("a2-u78-l04", "for").chunk_id, "for-me");
  assert.equal(token("a2-u79-l01", "trip").chunk_id, "go-on-a-short-trip");
  assert.equal(token("a2-u79-l02", "cost").sense_id, "cost-have-a-price");
  assert.equal(token("a2-u79-l03", "include").chunk_id, "include-breakfast");
  assert.equal(token("a2-u79-l04", "morning").chunk_id, "on-saturday-morning");
  assert.equal(token("a2-u80-l01", "think").chunk_id, "what-do-you-think");
  assert.equal(token("a2-u80-l02", "idea").chunk_id, "a-good-idea");
  assert.equal(token("a2-u80-l03", "sure").chunk_id, "not-sure-about");
  assert.equal(token("a2-u80-l04", "way").sense_id, "way-method");
  assert.equal(token("a2-u81-l01", "calling").lexeme_id, "call");
  assert.equal(token("a2-u81-l02", "come").sense_id, "come-visit-home");
  assert.equal(token("a2-u81-l03", "okay").sense_id, "okay-acceptable");
  assert.equal(token("a2-u81-l04", "before").chunk_id, "before-you-come");
  assert.equal(token("a2-u82-l01", "party").chunk_id, "have-a-party");
  assert.equal(token("a2-u82-l02", "Who").sense_id, "who-subject-question");
  assert.equal(token("a2-u82-l03", "drinks").lexeme_id, "drink");
  assert.equal(token("a2-u82-l04", "invite").chunk_id, "invite-ben-and-amy");
  assert.equal(token("a2-u83-l01", "last").chunk_id, "last-week");
  assert.equal(token("a2-u83-l02", "stayed").lexeme_id, "stay");
  assert.equal(token("a2-u83-l03", "beautiful").sense_id, "beautiful-pleasant-weather");
  assert.equal(token("a2-u83-l04", "fun").chunk_id, "a-lot-of-fun");
  assert.equal(token("a2-u84-l01", "words").lexeme_id, "word");
  assert.equal(token("a2-u84-l02", "practice").chunk_id, "practice-every-day");
  assert.equal(token("a2-u84-l03", "first").sense_id, "first-before-other-steps");
  assert.equal(token("a2-u84-l04", "advice").sense_id, "advice-suggestion-uncountable");
  assert.equal(token("a2-u85-l01", "your").lexeme_id, "you");
  assert.equal(token("a2-u85-l02", "blocking").lexeme_id, "block");
  assert.equal(token("a2-u85-l03", "move").chunk_id, "move-it");
  assert.equal(token("a2-u85-l04", "did").lexeme_id, "do");
  assert.equal(token("a2-u86-l01", "up").chunk_id, "get-up");
  assert.equal(token("a2-u86-l02", "work").chunk_id, "start-work");
  assert.equal(token("a2-u86-l03", "noon").chunk_id, "at-noon");
  assert.equal(token("a2-u86-l04", "bed").chunk_id, "go-to-bed");
  assert.equal(token("a2-u87-l01", "plan").chunk_id, "which-plan");
  assert.equal(token("a2-u87-l02", "has").lexeme_id, "have");
  assert.equal(token("a2-u87-l03", "costs").lexeme_id, "cost");
  assert.equal(token("a2-u87-l04", "one").chunk_id, "the-cheaper-one");
  assert.equal(token("a2-u88-l01", "Excuse").chunk_id, "excuse-me");
  assert.equal(token("a2-u88-l02", "picture").chunk_id, "take-a-picture");
  assert.equal(token("a2-u88-l03", "button").chunk_id, "press-this-button");
  assert.equal(token("a2-u88-l04", "so").sense_id, "so-intensifier");
  assert.equal(token("a2-u89-l01", "work").chunk_id, "do-for-work");
  assert.equal(token("a2-u89-l02", "bank").chunk_id, "work-at-a-bank");
  assert.equal(token("a2-u89-l03", "job").chunk_id, "your-job");
  assert.equal(token("a2-u89-l04", "week").chunk_id, "three-days-a-week");
  assert.equal(token("a2-u90-l01", "food").chunk_id, "what-food");
  assert.equal(token("a2-u90-l02", "really").chunk_id, "really-like");
  assert.equal(token("a2-u90-l03", "sweet").chunk_id, "sweet-food");
  assert.equal(token("a2-u90-l04", "try").sense_id, "try-taste-food");
  assert.equal(token("a2-u91-l01", "over").chunk_id, "over-there");
  assert.equal(token("a2-u91-l02", "floor").chunk_id, "to-the-second-floor");
  assert.equal(token("a2-u91-l03", "left").chunk_id, "on-the-left");
  assert.equal(token("a2-u91-l04", "your").chunk_id, "on-your-left");
  assert.equal(token("a2-u92-l01", "worked").lexeme_id, "work");
  assert.equal(token("a2-u92-l02", "years").lexeme_id, "year");
  assert.equal(token("a2-u92-l03", "did").sense_id, "do-auxiliary-past-question");
  assert.equal(token("a2-u92-l04", "customers").lexeme_id, "customer");
  assert.equal(token("a2-u93-l01", "pass").chunk_id, "a-bus-pass");
  assert.equal(token("a2-u93-l02", "good").sense_id, "good-valid-for-period");
  assert.equal(token("a2-u93-l03", "on").sense_id, "on-public-transport");
  assert.equal(token("a2-u93-l04", "add").chunk_id, "add-money-to");
  assert.equal(token("a2-u94-l01", "free").sense_id, "free-available-time");
  assert.equal(token("a2-u94-l02", "meet").sense_id, "meet-get-together");
  assert.equal(token("a2-u94-l03", "may").sense_id, "may-possible-not-certain");
  assert.equal(token("a2-u94-l04", "See").chunk_id, "see-you");
  assert.equal(token("a2-u95-l01", "class").sense_id, "class-scheduled-lesson");
  assert.equal(token("a2-u95-l02", "towel").chunk_id, "bring-a-towel");
  assert.equal(token("a2-u95-l03", "free").sense_id, "free-no-payment");
  assert.equal(token("a2-u95-l04", "ends").chunk_id, "ends-at-eight");
  assert.equal(token("a2-u96-l01", "overseas").sense_id, "overseas-to-another-country");
  assert.equal(token("a2-u96-l02", "inside").chunk_id, "inside-the-box");
  assert.equal(token("a2-u96-l03", "only").chunk_id, "only-clothes");
  assert.equal(token("a2-u96-l04", "arrive").chunk_id, "when-will-it-arrive");
  assert.equal(token("a2-u97-l01", "weekend").chunk_id, "how-was-your-weekend");
  assert.equal(token("a2-u97-l02", "cleaned").lexeme_id, "clean");
  assert.equal(token("a2-u97-l03", "saw").lexeme_id, "see");
  assert.equal(token("a2-u97-l04", "about").chunk_id, "what-about-you");
  assert.equal(token("a2-u98-l01", "rent").chunk_id, "the-rent");
  assert.equal(token("a2-u98-l02", "water").sense_id, "water-utility-charge");
  assert.equal(token("a2-u98-l03", "in").chunk_id, "move-in");
  assert.equal(token("a2-u98-l04", "rent").sense_id, "rent-pay-to-use-home");
  assert.equal(token("a2-u99-l01", "try").chunk_id, "try-to-walk");
  assert.equal(token("a2-u99-l02", "water").chunk_id, "a-lot-of-water");
  assert.equal(token("a2-u99-l03", "early").chunk_id, "go-to-bed-early");
  assert.equal(token("a2-u99-l04", "better").lexeme_id, "good");
  assert.equal(token("a2-u100-l01", "doing").lexeme_id, "do");
  assert.equal(token("a2-u100-l02", "visit").chunk_id, "going-to-visit");
  assert.equal(token("a2-u100-l03", "stay").chunk_id, "stay-for-a-week");
  assert.equal(token("a2-u100-l04", "tell").chunk_id, "tell-you");
  assert.equal(token("a2-u101-l01", "keep").chunk_id, "keep-this-package");
  assert.equal(token("a2-u101-l02", "home").chunk_id, "not-be-home");
  assert.equal(token("a2-u101-l03", "up").chunk_id, "pick-it-up");
  assert.equal(token("a2-u101-l04", "help").sense_id, "help-assistance-noun");
  assert.equal(token("a2-u102-l01", "doing").chunk_id, "what-are-you-doing");
  assert.equal(token("a2-u102-l02", "cooking").lexeme_id, "cook");
  assert.equal(token("a2-u102-l03", "watching").lexeme_id, "watch");
  assert.equal(token("a2-u102-l04", "waiting").chunk_id, "waiting-for-the-bus");
  assert.equal(token("a2-u103-l01", "lost").chunk_id, "lost-my-bank-card");
  assert.equal(token("a2-u103-l02", "stop").sense_id, "stop-disable-card");
  assert.equal(token("a2-u103-l03", "last").sense_id, "last-most-recent-time");
  assert.equal(token("a2-u103-l04", "send").chunk_id, "send-you-a-new-card");
  assert.equal(token("a2-u104-l01", "drive").chunk_id, "drive-a-car");
  assert.equal(token("a2-u104-l02", "very").chunk_id, "very-well");
  assert.equal(token("a2-u104-l03", "good").chunk_id, "good-at-cooking");
  assert.equal(token("a2-u104-l04", "easy").chunk_id, "easy-to-learn");
  assert.equal(token("a2-u105-l01", "refund").chunk_id, "a-refund");
  assert.equal(token("a2-u105-l02", "Why").sense_id, "why-ask-reason");
  assert.equal(token("a2-u105-l03", "work").chunk_id, "does-not-work");
  assert.equal(token("a2-u105-l04", "give").chunk_id, "give-you-your-money-back");
  assert.equal(token("a2-u106-l01", "ride").chunk_id, "give-me-a-ride");
  assert.equal(token("a2-u106-l02", "car").chunk_id, "car-is-not-working");
  assert.equal(token("a2-u106-l03", "pick").chunk_id, "pick-you-up");
  assert.equal(token("a2-u106-l04", "wait").chunk_id, "wait-for-you");
  assert.equal(token("a2-u107-l01", "early").chunk_id, "leave-early");
  assert.equal(token("a2-u107-l02", "son").chunk_id, "pick-up-my-son");
  assert.equal(token("a2-u107-l03", "okay").chunk_id, "is-it-okay-if");
  assert.equal(token("a2-u107-l04", "fine").chunk_id, "that-is-fine");
  assert.equal(token("a2-u108-l01", "bigger").lexeme_id, "big");
  assert.equal(token("a2-u108-l02", "closer").lexeme_id, "close");
  assert.equal(token("a2-u108-l03", "older").lexeme_id, "old");
  assert.equal(token("a2-u108-l04", "better").chunk_id, "like-better");
  assert.equal(token("a2-u109-l01", "always").chunk_id, "always-eat");
  assert.equal(token("a2-u109-l02", "sometimes").sense_id, "sometimes-now-and-then");
  assert.equal(token("a2-u109-l03", "never").chunk_id, "never-drink");
  assert.equal(token("a2-u109-l04", "often").chunk_id, "how-often-do-you");
  assert.equal(token("a2-u110-l01", "birthday").chunk_id, "your-birthday");
  assert.equal(token("a2-u110-l02", "next").chunk_id, "next-week");
  assert.equal(token("a2-u110-l03", "for").chunk_id, "for-your-birthday");
  assert.equal(token("a2-u110-l04", "gift").chunk_id, "buy-you-a-gift");
  assert.equal(token("a2-u111-l01", "understand").chunk_id, "do-not-understand");
  assert.equal(token("a2-u111-l02", "explain").chunk_id, "explain-it-again");
  assert.equal(token("a2-u111-l03", "forgot").lexeme_id, "forget");
  assert.equal(token("a2-u111-l04", "ask").chunk_id, "ask-you-a-question");
  assert.equal(token("a2-u112-l01", "hold").chunk_id, "hold-this-jacket");
  assert.equal(token("a2-u112-l02", "afternoon").chunk_id, "this-afternoon");
  assert.equal(token("a2-u112-l03", "long").chunk_id, "how-long-can-you");
  assert.equal(token("a2-u112-l04", "until").chunk_id, "until-seven");
  assert.equal(token("a2-u113-l01", "favorite").chunk_id, "my-favorite-place");
  assert.equal(token("a2-u113-l02", "near").chunk_id, "near-my-home");
  assert.equal(token("a2-u113-l03", "trees").lexeme_id, "tree");
  assert.equal(token("a2-u113-l04", "morning").chunk_id, "in-the-morning");
  assert.equal(token("a2-u114-l01", "website").sense_id, "website-online-pages");
  assert.equal(token("a2-u114-l02", "Click").chunk_id, "click-this-button");
  assert.equal(token("a2-u114-l03", "Type").chunk_id, "type-your-name");
  assert.equal(token("a2-u114-l04", "sign").chunk_id, "sign-in-website");
  assert.equal(token("a2-u115-l01", "lost").sense_id, "lost-unable-to-find-way");
  assert.equal(token("a2-u115-l02", "go").chunk_id, "want-to-go");
  assert.equal(token("a2-u115-l03", "far").chunk_id, "far-from-here");
  assert.equal(token("a2-u115-l04", "way").chunk_id, "show-you-the-way");
  assert.equal(token("a2-u116-l01", "dog").chunk_id, "have-a-dog");
  assert.equal(token("a2-u116-l02", "cat").chunk_id, "a-small-cat");
  assert.equal(token("a2-u116-l03", "friendly").chunk_id, "very-friendly");
  assert.equal(token("a2-u116-l04", "feed").chunk_id, "feed-it");
  assert.equal(token("a2-u117-l01", "goes").chunk_id, "goes-to-the-library");
  assert.equal(token("a2-u117-l02", "nine").chunk_id, "number-nine-bus");
  assert.equal(token("a2-u117-l03", "off").chunk_id, "get-off");
  assert.equal(token("a2-u117-l04", "stop").sense_id, "stop-bus-stop-noun");
  assert.equal(token("a2-u118-l01", "yesterday").chunk_id, "do-yesterday");
  assert.equal(token("a2-u118-l02", "met").lexeme_id, "meet");
  assert.equal(token("a2-u118-l03", "hours").lexeme_id, "hour");
  assert.equal(token("a2-u118-l04", "home").chunk_id, "went-home");
  assert.equal(token("a2-u119-l01", "about").chunk_id, "tell-me-about");
  assert.equal(token("a2-u119-l02", "helping").lexeme_id, "help");
  assert.equal(token("a2-u119-l03", "job").chunk_id, "want-this-job");
  assert.equal(token("a2-u119-l04", "Monday").chunk_id, "next-monday");
  assert.equal(token("a2-u120-l01", "again").chunk_id, "see-the-doctor-again");
  assert.equal(token("a2-u120-l02", "still").chunk_id, "still-hurts");
  assert.equal(token("a2-u120-l03", "better").chunk_id, "a-little-better");
  assert.equal(token("a2-u120-l04", "back").chunk_id, "come-back-next-week");
  assert.equal(token("a2-u121-l01", "still").chunk_id, "still-free");
  assert.equal(token("a2-u121-l02", "time").chunk_id, "what-time-should-we");
  assert.equal(token("a2-u121-l03", "forget").chunk_id, "do-not-forget");
  assert.equal(token("a2-u121-l04", "call").chunk_id, "call-you-in-the-morning");
  assert.equal(token("a2-u122-l01", "big").chunk_id, "not-very-big");
  assert.equal(token("a2-u122-l02", "bedrooms").lexeme_id, "bedroom");
  assert.equal(token("a2-u122-l03", "next").chunk_id, "next-to-the-bathroom");
  assert.equal(token("a2-u122-l04", "much").chunk_id, "very-much");
  assert.equal(token("a2-u123-l01", "season").chunk_id, "what-season");
  assert.equal(token("a2-u123-l02", "than").chunk_id, "better-than-winter");
  assert.equal(token("a2-u123-l03", "summer").chunk_id, "in-summer");
  assert.equal(token("a2-u123-l04", "too").chunk_id, "too-cold-for-me");
  assert.equal(token("a2-u124-l01", "make").chunk_id, "make-you-some-tea");
  assert.equal(token("a2-u124-l02", "milk").chunk_id, "milk-in-it");
  assert.equal(token("a2-u124-l03", "sugar").chunk_id, "just-a-little-sugar");
  assert.equal(token("a2-u124-l04", "good").chunk_id, "very-good");
  assert.equal(token("a2-u125-l01", "badminton").chunk_id, "play-badminton");
  assert.equal(token("a2-u125-l02", "friend").chunk_id, "with-a-friend");
  assert.equal(token("a2-u125-l03", "run").chunk_id, "run-in-the-park");
  assert.equal(token("a2-u125-l04", "health").chunk_id, "good-for-your-health");
  assert.equal(token("a2-u126-l01", "no").chunk_id, "no-hot-water");
  assert.equal(token("a2-u126-l02", "light").chunk_id, "light-in-my-room");
  assert.equal(token("a2-u126-l03", "someone").chunk_id, "send-someone");
  assert.equal(token("a2-u126-l04", "another").chunk_id, "change-to-another-room");
  assert.equal(token("a2-u127-l01", "class").chunk_id, "have-class");
  assert.equal(token("a2-u127-l02", "starts").lexeme_id, "start");
  assert.equal(token("a2-u127-l03", "test").chunk_id, "have-a-test");
  assert.equal(token("a2-u127-l04", "study").chunk_id, "need-to-study");
  assert.equal(token("a2-u128-l01", "movie").chunk_id, "see-that-movie");
  assert.equal(token("a2-u128-l02", "funny").chunk_id, "really-funny");
  assert.equal(token("a2-u128-l03", "long").chunk_id, "a-little-long");
  assert.equal(token("a2-u128-l04", "should").chunk_id, "should-see-it");
  assert.equal(token("a2-u129-l01", "coming").lexeme_id, "come");
  assert.equal(token("a2-u129-l02", "dinner").chunk_id, "have-dinner-at-home");
  assert.equal(token("a2-u129-l03", "cook").chunk_id, "help-me-cook");
  assert.equal(token("a2-u129-l04", "rice").chunk_id, "need-more-rice");
  assert.equal(token("a2-u130-l01", "than").chunk_id, "cheaper-than-that-one");
  assert.equal(token("a2-u130-l02", "fresh").chunk_id, "very-fresh");
  assert.equal(token("a2-u130-l03", "same").chunk_id, "the-same-price");
  assert.equal(token("a2-u130-l04", "buy").chunk_id, "buy-it-here");
  assert.equal(token("a2-u131-l01", "park").chunk_id, "a-small-park");
  assert.equal(token("a2-u131-l02", "walk").chunk_id, "walk-to-the-station");
  assert.equal(token("a2-u131-l03", "night").chunk_id, "quiet-at-night");
  assert.equal(token("a2-u131-l04", "place").chunk_id, "a-good-place-to-live");
  assert.equal(token("a2-u132-l01", "arrive").chunk_id, "did-not-arrive");
  assert.equal(token("a2-u132-l02", "ordered").chunk_id, "ordered-it-last-week");
  assert.equal(token("a2-u132-l03", "number").chunk_id, "order-number");
  assert.equal(token("a2-u132-l04", "tomorrow").chunk_id, "arrive-tomorrow");
  assert.equal(token("a2-u133-l01", "holiday").chunk_id, "for-the-holiday");
  assert.equal(token("a2-u133-l02", "beach").chunk_id, "going-to-the-beach");
  assert.equal(token("a2-u133-l03", "hotel").chunk_id, "stay-at-a-hotel");
  assert.equal(token("a2-u133-l04", "happy").chunk_id, "happy-about-it");
  assert.equal(token("a2-u134-l01", "try").chunk_id, "try-this-on");
  assert.equal(token("a2-u134-l02", "small").chunk_id, "too-small-for-me");
  assert.equal(token("a2-u134-l03", "blue").chunk_id, "in-blue");
  assert.equal(token("a2-u134-l04", "one").chunk_id, "the-blue-one");
  assert.equal(token("a2-u135-l01", "corner").chunk_id, "at-the-corner");
  assert.equal(token("a2-u135-l02", "see").chunk_id, "what-can-you-see");
  assert.equal(token("a2-u135-l03", "bank").chunk_id, "a-big-bank");
  assert.equal(token("a2-u135-l04", "come").chunk_id, "come-to-you");
  assert.equal(token("a2-u136-l01", "made").lexeme_id, "make");
  assert.equal(token("a2-u136-l02", "forgot").chunk_id, "forgot-to-call");
  assert.equal(token("a2-u136-l03", "sorry").chunk_id, "really-sorry");
  assert.equal(token("a2-u136-l04", "happen").chunk_id, "happen-again");
  assert.equal(token("a2-u137-l01", "hope").chunk_id, "hope-to-find");
  assert.equal(token("a2-u137-l02", "save").chunk_id, "save-more-money");
  assert.equal(token("a2-u137-l03", "important").chunk_id, "important-to-me");
  assert.equal(token("a2-u137-l04", "hard").chunk_id, "work-hard");
  assert.equal(token("a2-u138-l01", "appointment").chunk_id, "make-an-appointment");
  assert.equal(token("a2-u138-l02", "for").chunk_id, "what-is-it-for");
  assert.equal(token("a2-u138-l03", "address").chunk_id, "change-my-address");
  assert.equal(token("a2-u138-l04", "passport").chunk_id, "bring-your-passport");
  assert.equal(token("a2-u139-l01", "black").chunk_id, "a-small-black-bag");
  assert.equal(token("a2-u139-l02", "in").chunk_id, "in-it");
  assert.equal(token("a2-u139-l03", "bus").chunk_id, "on-the-bus");
  assert.equal(token("a2-u139-l04", "find").chunk_id, "if-you-find-it");
  assert.equal(token("a2-u140-l01", "kind").chunk_id, "what-kind-of");
  assert.equal(token("a2-u140-l02", "listen").chunk_id, "listen-to-music");
  assert.equal(token("a2-u140-l03", "sing").chunk_id, "sing-very-well");
  assert.equal(token("a2-u140-l04", "together").chunk_id, "sing-together");
  assert.equal(token("a2-u141-l01", "slow").chunk_id, "very-slow");
  assert.equal(token("a2-u141-l02", "turn").chunk_id, "turn-it-off");
  assert.equal(token("a2-u141-l03", "again").chunk_id, "off-and-on-again");
  assert.equal(token("a2-u141-l04", "working").chunk_id, "working-now");
  assert.equal(token("a2-u142-l01", "tell").chunk_id, "do-not-tell");
  assert.equal(token("a2-u142-l02", "surprise").chunk_id, "a-surprise");
  assert.equal(token("a2-u142-l03", "cake").chunk_id, "buy-a-cake");
  assert.equal(token("a2-u142-l04", "Everyone").chunk_id, "everyone-will-be-here");
  assert.equal(token("a2-u143-l01", "like").sense_id, "like-similar-to");
  assert.equal(token("a2-u143-l02", "afternoon").chunk_id, "in-the-afternoon");
  assert.equal(token("a2-u143-l03", "strong").chunk_id, "very-strong");
  assert.equal(token("a2-u143-l04", "inside").chunk_id, "stay-inside");
  assert.equal(token("a2-u144-l01", "or").chunk_id, "a-taxi-or-the-bus");
  assert.equal(token("a2-u144-l02", "expensive").chunk_id, "more-expensive");
  assert.equal(token("a2-u144-l03", "longer").chunk_id, "a-little-longer");
  assert.equal(token("a2-u144-l04", "time").chunk_id, "have-time");
  assert.equal(token("a2-u145-l01", "windows").lexeme_id, "window");
  assert.equal(token("a2-u145-l02", "lights").lexeme_id, "light");
  assert.equal(token("a2-u145-l03", "out").chunk_id, "go-out");
  assert.equal(token("a2-u145-l04", "table").chunk_id, "on-the-table");
  assert.equal(token("a2-u146-l01", "charge").chunk_id, "charge-my-phone");
  assert.equal(token("a2-u146-l02", "cable").chunk_id, "a-cable");
  assert.equal(token("a2-u146-l03", "mine").chunk_id, "use-mine");
  assert.equal(token("a2-u146-l04", "back").chunk_id, "give-it-back");
  assert.equal(token("a2-u147-l01", "lived").lexeme_id, "live");
  assert.equal(token("a2-u147-l02", "young").chunk_id, "very-young");
  assert.equal(token("a2-u147-l03", "walked").lexeme_id, "walk");
  assert.equal(token("a2-u147-l04", "had").lexeme_id, "have");
  assert.equal(token("a2-u148-l01", "change").chunk_id, "a-change-in-the-plan");
  assert.equal(token("a2-u148-l02", "leave").chunk_id, "will-not-leave");
  assert.equal(token("a2-u148-l03", "instead").chunk_id, "on-sunday-instead");
  assert.equal(token("a2-u148-l04", "everyone").chunk_id, "tell-everyone");
  assert.equal(token("a2-u149-l01", "recommend").chunk_id, "recommend-a-restaurant");
  assert.equal(token("a2-u149-l02", "here").chunk_id, "good-here");
  assert.equal(token("a2-u149-l03", "fish").chunk_id, "try-the-fish");
  assert.equal(token("a2-u149-l04", "expensive").chunk_id, "not-too-expensive");
  assert.equal(token("a2-u150-l01", "late").chunk_id, "a-little-late-book");
  assert.equal(token("a2-u150-l02", "back").chunk_id, "bring-it-back");
  assert.equal(token("a2-u150-l03", "pay").chunk_id, "need-to-pay");
  assert.equal(token("a2-u150-l04", "dollars").chunk_id, "pay-two-dollars");
  assert.equal(token("a2-u151-l01", "fell").lexeme_id, "fall");
  assert.equal(token("a2-u151-l02", "leg").sense_id, "leg-body-part");
  assert.equal(token("a2-u151-l03", "stand").chunk_id, "stand-up");
  assert.equal(token("a2-u151-l04", "okay").chunk_id, "okay-now");
  assert.equal(token("a2-u152-l01", "cooking").chunk_id, "cooking-at-home");
  assert.equal(token("a2-u152-l02", "washing").chunk_id, "washing-the-dishes");
  assert.equal(token("a2-u152-l03", "laundry").chunk_id, "do-the-laundry-today");
  assert.equal(token("a2-u152-l04", "share").chunk_id, "share-the-work");
  assert.equal(token("a2-u153-l01", "fee").chunk_id, "a-delivery-fee");
  assert.equal(token("a2-u153-l02", "fee").chunk_id, "the-delivery-fee");
  assert.equal(token("a2-u153-l03", "over").chunk_id, "over-ten-dollars");
  assert.equal(token("a2-u153-l04", "deliver").chunk_id, "deliver-it-tomorrow");
  assert.equal(token("a2-u154-l01", "weekend").chunk_id, "a-good-weekend");
  assert.equal(token("a2-u154-l02", "busy").chunk_id, "busy-today");
  assert.equal(token("a2-u154-l03", "break").chunk_id, "take-a-coffee-break");
  assert.equal(token("a2-u154-l04", "lunch").chunk_id, "after-lunch");
  assert.equal(token("a2-u155-l01", "pool").chunk_id, "the-pool-open");
  assert.equal(token("a2-u155-l02", "member").chunk_id, "be-a-member");
  assert.equal(token("a2-u155-l03", "bring").chunk_id, "have-to-bring");
  assert.equal(token("a2-u155-l04", "free").chunk_id, "for-free-pool");
  assert.equal(token("a2-u156-l01", "office").chunk_id, "from-the-office");
  assert.equal(token("a2-u156-l02", "order").chunk_id, "about-your-order");
  assert.equal(token("a2-u156-l03", "back").chunk_id, "call-me-back-afternoon");
  assert.equal(token("a2-u156-l04", "again").chunk_id, "call-again");
  assert.equal(token("a2-u157-l01", "together").chunk_id, "study-together");
  assert.equal(token("a2-u157-l02", "test").chunk_id, "a-test-on-friday");
  assert.equal(token("a2-u157-l03", "library").chunk_id, "meet-at-the-library");
  assert.equal(token("a2-u157-l04", "notes").chunk_id, "your-notes");
  assert.equal(token("a2-u158-l01", "sit").chunk_id, "sit-by-the-window");
  assert.equal(token("a2-u158-l02", "small").chunk_id, "too-small");
  assert.equal(token("a2-u158-l03", "like").chunk_id, "would-like-to-sit");
  assert.equal(token("a2-u158-l04", "seat").chunk_id, "seat-free");
  assert.equal(token("a2-u159-l01", "work").chunk_id, "work-for-me");
  assert.equal(token("a2-u159-l02", "doctor").chunk_id, "see-a-doctor-shift");
  assert.equal(token("a2-u159-l03", "work").chunk_id, "work-for-you");
  assert.equal(token("a2-u159-l04", "manager").chunk_id, "tell-the-manager");
  assert.equal(token("a2-u160-l01", "gift").chunk_id, "a-gift-for");
  assert.equal(token("a2-u160-l02", "friend").chunk_id, "your-friend-like");
  assert.equal(token("a2-u160-l03", "cup").chunk_id, "this-blue-cup");
  assert.equal(token("a2-u160-l04", "wrap").chunk_id, "wrap-it");
  assert.equal(token("a2-u161-l01", "park").chunk_id, "park-my-car");
  assert.equal(token("a2-u161-l02", "Where").chunk_id, "where-can-i");
  assert.equal(token("a2-u161-l03", "behind").chunk_id, "behind-the-store");
  assert.equal(token("a2-u161-l04", "per").chunk_id, "per-hour");
  assert.equal(token("a2-u162-l01", "new").chunk_id, "new-here");
  assert.equal(token("a2-u162-l02", "neighbor").chunk_id, "your-neighbor");
  assert.equal(token("a2-u162-l03", "floor").chunk_id, "on-the-second-floor");
  assert.equal(token("a2-u162-l04", "help").chunk_id, "ask-me-for-help");
  assert.equal(token("a2-u163-l01", "borrowed").chunk_id, "borrowed-your-umbrella");
  assert.equal(token("a2-u163-l02", "return").chunk_id, "return-it");
  assert.equal(token("a2-u163-l03", "your").chunk_id, "here-is-your");
  assert.equal(token("a2-u163-l04", "again").chunk_id, "borrow-it-again");
  assert.equal(token("a2-u164-l01", "working").chunk_id, "not-working-elevator");
  assert.equal(token("a2-u164-l02", "heavy").chunk_id, "a-heavy-bag");
  assert.equal(token("a2-u164-l03", "fix").chunk_id, "fix-it");
  assert.equal(token("a2-u164-l04", "working").chunk_id, "when-it-is-working");
  assert.equal(token("a2-u165-l01", "table").chunk_id, "a-table-for-tonight");
  assert.equal(token("a2-u165-l02", "change").chunk_id, "change-the-time");
  assert.equal(token("a2-u165-l03", "eight").chunk_id, "eight-okay");
  assert.equal(token("a2-u165-l04", "there").chunk_id, "be-there-at-eight");
  assert.equal(token("a2-u166-l01", "teacher").chunk_id, "your-favorite-teacher");
  assert.equal(token("a2-u166-l02", "funny").chunk_id, "very-funny");
  assert.equal(token("a2-u166-l03", "always").chunk_id, "always-helped-me");
  assert.equal(token("a2-u166-l04", "learned").chunk_id, "learned-a-lot");
  assert.equal(token("a2-u167-l01", "every").chunk_id, "every-sunday");
  assert.equal(token("a2-u167-l02", "good").chunk_id, "so-good");
  assert.equal(token("a2-u167-l03", "kitchen").chunk_id, "in-the-kitchen-helped");
  assert.equal(token("a2-u167-l04", "taste").chunk_id, "remember-the-taste");
  assert.equal(token("a2-u168-l01", "beach").chunk_id, "go-to-the-beach");
  assert.equal(token("a2-u168-l02", "hot").chunk_id, "very-hot");
  assert.equal(token("a2-u168-l03", "hat").chunk_id, "a-hat-and-water");
  assert.equal(token("a2-u168-l04", "sea").chunk_id, "in-the-sea");
  assert.equal(token("a2-u169-l01", "passport").chunk_id, "see-your-passport");
  assert.equal(token("a2-u169-l02", "bags").chunk_id, "how-many-bags");
  assert.equal(token("a2-u169-l03", "gate").chunk_id, "which-gate");
  assert.equal(token("a2-u169-l04", "leaves").chunk_id, "leaves-at-ten");
  assert.equal(token("a2-u170-l01", "blanket").chunk_id, "have-a-blanket");
  assert.equal(token("a2-u170-l02", "cold").chunk_id, "a-little-cold");
  assert.equal(token("a2-u170-l03", "put").chunk_id, "put-my-bag");
  assert.equal(token("a2-u170-l04", "arrive").chunk_id, "will-we-arrive");
  assert.equal(token("a2-u171-l01", "visit").chunk_id, "visit-my-family");
  assert.equal(token("a2-u171-l02", "stay").chunk_id, "how-long-stay");
  assert.equal(token("a2-u171-l03", "days").chunk_id, "for-ten-days");
  assert.equal(token("a2-u171-l04", "hotel").chunk_id, "stay-at-a-hotel");
  assert.equal(token("a2-u172-l01", "exchange").chunk_id, "exchange-some-money");
  assert.equal(token("a2-u172-l02", "rate").chunk_id, "the-rate-today");
  assert.equal(token("a2-u172-l03", "cash").chunk_id, "in-cash");
  assert.equal(token("a2-u172-l04", "receipt").chunk_id, "your-receipt");
  assert.equal(token("a2-u173-l01", "moved").chunk_id, "moved-last-week");
  assert.equal(token("a2-u173-l02", "carry").chunk_id, "carry-this-box");
  assert.equal(token("a2-u173-l03", "kitchen").chunk_id, "put-it-in-the-kitchen");
  assert.equal(token("a2-u173-l04", "apartment").chunk_id, "the-new-apartment");
  assert.equal(token("a2-u174-l01", "tooth").chunk_id, "tooth-hurts");
  assert.equal(token("a2-u174-l02", "doctor").chunk_id, "see-a-doctor-tooth");
  assert.equal(token("a2-u174-l03", "mouth").chunk_id, "open-your-mouth");
  assert.equal(token("a2-u174-l04", "hour").chunk_id, "for-one-hour");
  assert.equal(token("a2-u175-l01", "phone").chunk_id, "buy-a-new-phone");
  assert.equal(token("a2-u175-l02", "camera").chunk_id, "a-good-camera");
  assert.equal(token("a2-u175-l03", "black").chunk_id, "come-in-black");
  assert.equal(token("a2-u175-l04", "black").chunk_id, "the-black-phone");
  assert.equal(token("a2-u176-l01", "market").chunk_id, "the-night-market");
  assert.equal(token("a2-u176-l02", "food").chunk_id, "this-food");
  assert.equal(token("a2-u176-l03", "chicken").chunk_id, "try-some-chicken");
  assert.equal(token("a2-u176-l04", "two").chunk_id, "have-two");
  assert.equal(token("a2-u177-l01", "storm").chunk_id, "a-storm-is-coming");
  assert.equal(token("a2-u177-l02", "work").chunk_id, "no-work");
  assert.equal(token("a2-u177-l03", "windows").chunk_id, "close-the-windows");
  assert.equal(token("a2-u177-l04", "inside").chunk_id, "stay-inside");
  assert.equal(token("a2-u178-l01", "bill").chunk_id, "pay-this-bill");
  assert.equal(token("a2-u178-l02", "here").chunk_id, "pay-it-here");
  assert.equal(token("a2-u178-l03", "machine").chunk_id, "use-this-machine");
  assert.equal(token("a2-u178-l04", "receipt").chunk_id, "need-a-receipt");
  assert.equal(token("a2-u179-l01", "train").chunk_id, "for-the-next-train");
  assert.equal(token("a2-u179-l02", "seat").chunk_id, "a-window-seat");
  assert.equal(token("a2-u179-l03", "car").chunk_id, "which-car");
  assert.equal(token("a2-u179-l04", "takes").chunk_id, "takes-one-hour");
  assert.equal(token("a2-u180-l01", "island").chunk_id, "a-beautiful-island");
  assert.equal(token("a2-u180-l02", "mountains").chunk_id, "visit-the-mountains");
  assert.equal(token("a2-u180-l03", "food").chunk_id, "the-food-here");
  assert.equal(token("a2-u180-l04", "famous").chunk_id, "market-is-famous");
  assert.equal(token("a2-u181-l01", "volunteer").chunk_id, "be-a-volunteer");
  assert.equal(token("a2-u181-l02", "join").chunk_id, "join-this-weekend");
  assert.equal(token("a2-u181-l03", "park").chunk_id, "clean-the-park");
  assert.equal(token("a2-u181-l04", "name").chunk_id, "write-your-name");
  assert.equal(token("a2-u182-l01", "plants").chunk_id, "water-my-plants");
  assert.equal(token("a2-u182-l02", "away").chunk_id, "be-away");
  assert.equal(token("a2-u182-l03", "day").chunk_id, "every-day-plants");
  assert.equal(token("a2-u182-l04", "gift").chunk_id, "bring-you-a-gift");
  assert.equal(token("a2-u183-l01", "guitar").chunk_id, "playing-the-guitar");
  assert.equal(token("a2-u183-l02", "evening").chunk_id, "every-evening");
  assert.equal(token("a2-u183-l03", "fun").chunk_id, "hard-but-fun");
  assert.equal(token("a2-u183-l04", "try").chunk_id, "try-it");
  assert.equal(token("a2-u184-l01", "online").chunk_id, "book-online");
  assert.equal(token("a2-u184-l02", "website").chunk_id, "go-to-the-website");
  assert.equal(token("a2-u184-l03", "date").chunk_id, "choose-a-date");
  assert.equal(token("a2-u184-l04", "email").chunk_id, "get-an-email");
  assert.equal(token("a2-u185-l01", "baby").chunk_id, "a-new-baby");
  assert.equal(token("a2-u185-l02", "girl").chunk_id, "a-boy-or-a-girl");
  assert.equal(token("a2-u185-l03", "small").chunk_id, "very-small");
  assert.equal(token("a2-u185-l04", "visit").chunk_id, "visit-amy");
  assert.equal(token("a2-u186-l01", "breakfast").chunk_id, "for-breakfast");
  assert.equal(token("a2-u186-l02", "eggs").chunk_id, "eggs-and-milk");
  assert.equal(token("a2-u186-l03", "time").chunk_id, "have-time");
  assert.equal(token("a2-u186-l04", "important").chunk_id, "is-important");
  assert.equal(token("a2-u187-l01", "photo").chunk_id, "an-old-photo");
  assert.equal(token("a2-u187-l02", "man").chunk_id, "this-man");
  assert.equal(token("a2-u187-l03", "father").chunk_id, "my-father");
  assert.equal(token("a2-u187-l04", "young").chunk_id, "looks-so-young");
  assert.equal(token("a2-u188-l01", "package").chunk_id, "not-my-package");
  assert.equal(token("a2-u188-l02", "wrong").chunk_id, "the-wrong-name");
  assert.equal(token("a2-u188-l03", "back").chunk_id, "take-it-back");
  assert.equal(token("a2-u188-l04", "now").chunk_id, "my-package-now");
  assert.equal(token("a2-u189-l01", "key").chunk_id, "my-key");
  assert.equal(token("a2-u189-l02", "look").chunk_id, "look-in-your-bag");
  assert.equal(token("a2-u189-l03", "table").chunk_id, "on-the-table-key");
  assert.equal(token("a2-u189-l04", "door").chunk_id, "put-it-by-the-door");
  assert.equal(token("a2-u190-l01", "together").chunk_id, "lunch-together");
  assert.equal(token("a2-u190-l02", "near").chunk_id, "near-here");
  assert.equal(token("a2-u190-l03", "time").chunk_id, "what-time-should-we");
  assert.equal(token("a2-u190-l04", "pay").chunk_id, "pay-today");
  assert.deepEqual(applied.filter((row) => row.chunk_id === "call-you-back").map((row) => row.answer),
    ["call", "you", "back"]);
});

test("keeps applied comprehension answer positions varied and rejects future-unit vocabulary", () => {
  const passages = a2Reading.passages.filter((entry) => a2UnitNumber(entry.passageId) >= 11);
  for (const passage of passages) {
    assert.equal(passage.questions.length, 4);
    assert.equal(new Set(passage.questions.map((question) =>
      question.options.indexOf(question.correctAnswer))).size, 4);
    assert.ok(passage.questions.some((question) => question.evidenceSentenceIds.length > 1));
  }
  const invalid = structuredClone(a2Reading);
  const question = invalid.passages.find((entry) => entry.passageId === "a2-u11-p01").questions[0];
  question.options[0] = "A blanket.";
  question.optionMetadata[0] = { text: "A blanket.", requiredLexemeIds: ["a", "blanket"], requiredChunkIds: [] };
  const report = validateReadingExerciseData(invalid, a2Rows, a2Patterns, a1Rows);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("a2-u11-p01-q01") && error.includes("blanket")),
    report.errors.join("\n"));
});

test("keeps new lesson titles distinct from earlier A2 lesson titles", () => {
  const lessons = new Map(a2Rows.map((row) => [row.lesson_id, row.lesson_title]));
  const seen = new Map();
  for (const [id, title] of lessons) {
    const number = Number(id.match(/^a2-u(\d+)-/)?.[1]);
    if (number >= 53) {
      assert.ok(!seen.has(title), `${id} and ${seen.get(title)} share the lesson title ${title}`);
    }
    seen.set(title, id);
  }
});

test("teaches applied units from 14 onward with distinct short texts and four comprehension answers", () => {
  const scenarios = [
    [14, 22, ["This shirt.", "It is the wrong size.", "The receipt.", "A smaller size."]],
    [15, 24, ["The train.", "At ten.", "On the bus.", "Take the bus."]],
    [16, 26, ["The report.", "My manager.", "At ten.", "The file is ready for you."]],
    [17, 24, ["The library.", "The corner.", "Right.", "The school."]],
    [18, 20, ["My computer.", "Take a look at it.", "A different cable.", "It works now."]],
    [19, 22, ["On the bus.", "It is a black bag.", "At the station.", "The ticket."]],
    [20, 21, ["This book.", "A card.", "Next week.", "Return it."]],
    [21, 20, ["My appointment.", "Friday afternoon.", "At three.", "The new time."]],
    [22, 21, ["Tea.", "At home.", "Friday.", "Some tea."]],
    [23, 22, ["Meat.", "I do not eat meat.", "Without meat.", "Rice."]],
    [24, 20, ["More time.", "Tomorrow.", "Friday afternoon.", "I will let you know."]],
    [25, 22, ["Last night.", "The store was already closed.", "This morning.", "A black bag."]],
    [26, 18, ["I am not sure.", "This Friday.", "The message.", "At three."]],
    [27, 24, ["This box.", "To the office.", "Open the door.", "We can do it together."]],
    [28, 25, ["Rain.", "Stay home.", "Saturday morning.", "On Friday."]],
    [29, 21, ["This package.", "On this side.", "Ten dollars.", "Today."]],
    [30, 23, ["A pen.", "At home.", "For a day.", "Tomorrow."]],
    [31, 21, ["I do not feel well today.", "Go home early.", "My manager.", "Tomorrow."]],
    [32, 22, ["A bag of rice.", "Milk.", "Two bags of rice.", "By card."]],
    [33, 20, ["The class.", "Here.", "At seven.", "At eight."]],
    [34, 21, ["I am running late.", "A little later.", "At the station.", "In ten minutes."]],
    [35, 20, ["For two.", "How long is the wait?", "Ten minutes.", "Outside."]],
    [36, 24, ["The file.", "The first page.", "A question.", "After lunch."]],
    [37, 21, ["Stay quiet.", "Close the door.", "Eat in this room.", "Outside."]],
    [38, 20, ["Which way is faster?", "Ten minutes.", "The train takes less time.", "We can take the train then."]],
    [39, 22, ["Put the dishes away.", "Take out the trash.", "Take out the trash.", "We can finish together."]],
    [40, 22, ["My order.", "Change it.", "An email.", "Check the details."]],
    [41, 24, ["Two tickets.", "Each ticket is ten dollars.", "Children.", "On the second floor."]],
    [42, 26, ["This afternoon.", "Until three.", "A few minutes.", "Around seven."]],
    [43, 24, ["Pick up my package.", "In this email.", "Show me the email.", "Sign here."]],
    [44, 25, ["Put the clothes in the machine.", "Cold water.", "Press the start button.", "When it ends."]],
    [45, 27, ["For an hour.", "Ten dollars per hour.", "By seven.", "You can leave it here."]],
    [46, 25, ["Fill out this form.", "Please write it here.", "You do not need to write it.", "By email."]],
    [47, 22, ["Paper.", "This plastic bottle.", "Empty the bottle first.", "Glass goes in a different bin."]],
    [48, 22, ["The music.", "It is a little loud in here.", "Sorry about the noise.", "I will keep it down."]],
    [49, 30, ["For here or to go?", "I would like this meal to go.", "On the side.", "In a separate bag."]],
    [50, 28, ["What time does the store open?", "From eight to seven.", "Sunday.", "On Monday."]],
    [51, 28, ["In front of the library.", "Across from the station.", "The main entrance.", "Right by the door."]],
    [52, 28, ["The name.", "Each letter.", "The last two numbers.", "Nine, then three."]],
    [53, 23, ["Cash or cards.", "This card is not working.", "In cash.", "The change."]],
    [54, 23, ["The train is delayed by ten minutes.", "When does the next one leave?", "At nine.", "Platform two."]],
    [55, 22, ["New to the team.", "The sales team.", "You can work here.", "Help with the report."]],
    [56, 26, ["A jacket.", "Will the jacket fit in this bag?", "It will fit in this bag.", "The bag is too heavy to carry."]],
    [57, 28, ["The kitchen is next to the bedroom.", "The bathroom.", "This room is brighter than the other one.", "The room with a window."]],
    [58, 24, ["I dropped the cup by mistake.", "When it hit the floor.", "Clean it up.", "A new cup."]],
    [59, 24, ["Out of order.", "Can I use another machine?", "On the second floor.", "Can you show me the way?"]],
    [60, 25, ["The morning class.", "The evening class.", "Can I sign up for the evening class?", "On Monday."]],
    [61, 28, ["Take out the trash.", "Twice a week.", "At night.", "Can we take turns with the trash?"]],
    [62, 23, ["Into small pieces.", "In a bowl.", "A little sugar.", "With a spoon."]],
    [63, 25, ["Today.", "How short do you want it?", "Just a little off, please.", "In the front."]],
    [64, 27, ["By ten.", "The key.", "My luggage.", "At three."]],
    [65, 27, ["For a headache.", "Twice a day.", "After a meal.", "See a doctor."]],
    [66, 21, ["It is cold.", "A warm coat.", "It may rain.", "It will be warmer."]],
    [67, 24, ["The train station.", "About ten minutes.", "At the next corner.", "A receipt."]],
    [68, 26, ["See a doctor.", "My throat hurts.", "Two days ago.", "At three."]],
    [69, 20, ["These apples.", "Three dollars.", "Nine dollars.", "A bag."]],
    [70, 25, ["On weekends.", "Walk in the park.", "Read.", "Saturday morning."]],
    [71, 24, ["With my mother.", "A brother and a sister.", "Near the station.", "In an office."]],
    [72, 23, ["The rice.", "On the second shelf.", "It is not on sale.", "This bag is cheaper."]],
    [73, 24, ["The kitchen light.", "Water.", "On Friday.", "After three."]],
    [74, 23, ["Friday.", "Help my mother.", "Ben.", "On Thursday."]],
    [75, 25, ["My brother.", "Tall with short hair.", "A black jacket.", "The station."]],
    [76, 25, ["The rice.", "Bring a new one.", "My tea is a little cold.", "Warm it up."]],
    [77, 25, ["Open a bank account.", "A passport.", "Ten dollars.", "Tomorrow."]],
    [78, 21, ["This bill.", "This amount is wrong.", "You charged me twice.", "A new bill."]],
    [79, 25, ["Go on a short trip.", "Ten dollars each.", "Breakfast is free.", "Saturday morning."]],
    [80, 27, ["This plan.", "It is a good idea.", "The time.", "Monday."]],
    [81, 20, ["About my machine.", "It is not working.", "Tuesday morning.", "Call me."]],
    [82, 23, ["On Saturday.", "I will bring the food.", "Some drinks.", "Ben and Amy."]],
    [83, 23, ["To the beach.", "For three days.", "The weather was beautiful.", "I want to go back."]],
    [84, 21, ["New words.", "Every day.", "Read a little every morning.", "Write the new words."]],
    [85, 19, ["Your bike.", "It is blocking my door.", "Move it.", "I will move it now."]],
    [86, 24, ["At seven.", "At nine.", "Have lunch.", "At ten."]],
    [87, 21, ["Which plan is cheaper?", "Ten dollars a month.", "The other plan has more data.", "The cheaper one."]],
    [88, 21, ["Take a picture.", "Press this button.", "Is this okay?", "It is a good picture."]],
    [89, 22, ["At a bank.", "It is a good job.", "Three days a week.", "Stay home."]],
    [90, 21, ["Fish.", "Sweet food.", "This fish is good.", "I would love to."]],
    [91, 26, ["The office.", "Over there.", "To the second floor.", "The second door on the left."]],
    [92, 22, ["At a bank.", "For two years.", "I helped customers every day.", "It was a good job."]],
    [93, 28, ["A bus pass.", "For one month.", "On the train.", "At this machine."]],
    [94, 23, ["After work.", "At the station.", "I may be a little late.", "I can wait for you."]],
    [95, 25, ["At seven.", "At eight.", "A towel and some water.", "One class."]],
    [96, 20, ["Overseas.", "Only clothes.", "Fill out this form.", "In ten days."]],
    [97, 20, ["It was good.", "Cleaned the house.", "With a friend.", "I went to the beach."]],
    [98, 22, ["On this form.", "It does not include water.", "On Monday.", "This room."]],
    [99, 21, ["I feel better now.", "Every morning.", "A lot of water.", "I go to bed early."]],
    [100, 27, ["Visit my mother.", "For a week.", "I am not sure.", "Next week."]],
    [101, 24, ["Today.", "This package.", "Tonight.", "After seven."]],
    [102, 20, ["Cooking dinner.", "Watching TV.", "Waiting for the bus.", "At seven."]],
    [103, 23, ["My bank card.", "Stop the card.", "Yesterday.", "A new card."]],
    [104, 23, ["Drive a car.", "Swim.", "At cooking.", "I can help you."]],
    [105, 25, ["A refund.", "Because it does not work.", "The receipt.", "Give you your money back."]],
    [106, 24, ["Give me a ride.", "My car is not working.", "At eight.", "In front of the library."]],
    [107, 25, ["Leave early today.", "Pick up my son.", "Tomorrow.", "Tonight."]],
    [108, 22, ["This apartment.", "Closer to work.", "Older.", "The first one."]],
    [109, 20, ["On Sunday.", "Breakfast.", "Walk to work.", "Drink coffee at night."]],
    [110, 22, ["Next week.", "A new bag.", "I will buy you a gift.", "Thank you so much."]],
    [111, 23, ["This lesson.", "My book.", "Explain it again.", "Now I understand."]],
    [112, 25, ["This jacket.", "I do not have my card.", "This afternoon.", "Until seven."]],
    [113, 22, ["The park.", "Near my home.", "Many trees.", "In the morning."]],
    [114, 19, ["This website.", "Click this button.", "Your email.", "Sign in."]],
    [115, 21, ["Are you lost?", "To the station.", "It is not far from here.", "I can show you the way."]],
    [116, 19, ["A small cat.", "It is very friendly.", "Every morning.", "A dog."]],
    [117, 22, ["To the library.", "The number nine bus.", "At the next stop.", "Across from the station."]],
    [118, 20, ["A friend.", "For two hours.", "Home.", "That was a good day."]],
    [119, 23, ["At a bank.", "Helping customers.", "I want to work with a new team.", "Next Monday."]],
    [120, 22, ["See the doctor again.", "A little better.", "My throat still hurts.", "Next week."]],
    [121, 22, ["After lunch.", "At three.", "Your ticket.", "In the morning."]],
    [122, 23, ["Near the station.", "Two bedrooms.", "Next to the bathroom.", "I like my home very much."]],
    [123, 23, ["Summer.", "It is very hot.", "Winter is too cold for me.", "Cold weather."]],
    [124, 22, ["Some tea.", "I do not want milk.", "A little sugar.", "This tea is very good."]],
    [125, 24, ["On Sunday.", "In the park.", "It is good for your health.", "Do you want to come with me?"]],
    [126, 29, ["No hot water.", "The light.", "Send someone now.", "On the second floor."]],
    [127, 24, ["On Monday and Wednesday.", "At nine.", "On Thursday.", "Study tonight."]],
    [128, 19, ["Last week.", "It was really funny.", "The story was a little long.", "On Saturday."]],
    [129, 23, ["On Sunday.", "At home.", "Help me cook.", "More rice."]],
    [130, 23, ["This store.", "Very fresh.", "It is cheaper here.", "A bag."]],
    [131, 28, ["A small park.", "To the station.", "At night.", "It is a good place to live."]],
    [132, 20, ["My package.", "Last week.", "The order number.", "Tomorrow."]],
    [133, 25, ["To the beach.", "At a hotel.", "On Sunday.", "Have a good trip."]],
    [134, 23, ["It is too small for me.", "A larger size.", "In blue and black.", "The blue one."]],
    [135, 24, ["At the corner.", "A big bank.", "Stay there.", "Right by the door."]],
    [136, 18, ["I forgot to call you.", "I am really sorry.", "Send me the report today.", "It will not happen again."]],
    [137, 25, ["Find a new job.", "More money.", "It is very important to me.", "This year."]],
    [138, 21, ["Make an appointment.", "Change my address.", "On Friday at ten.", "Your passport."]],
    [139, 27, ["A small black bag.", "On the bus.", "A phone.", "Please call me if you find it."]],
    [140, 25, ["At night.", "My sister.", "Sing together.", "I am not very good at this."]],
    [141, 21, ["My computer.", "I did not turn it off.", "Turn it off and on again.", "It is working now."]],
    [142, 19, ["For Amy.", "It is a surprise.", "A cake.", "At seven."]],
    [143, 23, ["In the afternoon.", "Very strong.", "Stay inside.", "On Saturday."]],
    [144, 30, ["A taxi or the bus.", "A taxi is faster but more expensive.", "A little longer.", "We can take the bus."]],
    [145, 24, ["At seven.", "The windows.", "Turn off the lights.", "On the table."]],
    [146, 21, ["Charge my phone.", "You can use mine.", "I will give it back soon.", "Until three."]],
    [147, 22, ["In a small town.", "I walked to school every day.", "A small dog.", "It was a happy time."]],
    [148, 22, ["It will rain on Friday.", "On Sunday.", "At eight.", "Tell everyone."]],
    [149, 20, ["Near the station.", "The fish.", "It is not too expensive.", "I will have the fish."]],
    [150, 25, ["This book.", "I forgot to bring it back.", "Two dollars.", "By card."]],
    [151, 22, ["This morning.", "My leg.", "Help me stand up.", "See a doctor."]],
    [152, 23, ["Cooking at home.", "Washing the dishes.", "Do the laundry.", "We can share the work."]],
    [153, 24, ["Two dollars.", "Orders over ten dollars.", "Tomorrow.", "Yes, we can deliver it tomorrow."]],
    [154, 22, ["A good weekend.", "A lot of work.", "Take a coffee break.", "After lunch."]],
    [155, 26, ["From seven to nine.", "Members.", "Your card.", "Tomorrow."]],
    [156, 23, ["Ben from the office.", "Your order.", "At the office.", "This afternoon."]],
    [157, 22, ["On Friday.", "Study together.", "At the library.", "My notes and a pen."]],
    [158, 21, ["Too small.", "That table is not free.", "Outside.", "Yes, you can sit here."]],
    [159, 25, ["Work for me on Friday.", "I have to see a doctor.", "I can work for you on Friday.", "The manager."]],
    [160, 23, ["My friend.", "Tea.", "This blue cup.", "Wrap it for me."]],
    [161, 22, ["Park my car here.", "Behind the store.", "How much is it per hour?", "Two dollars per hour."]],
    [162, 21, ["I am new here.", "Your neighbor.", "The second floor.", "You can ask me for help."]],
    [163, 19, ["Your umbrella.", "Today.", "Here is your umbrella.", "You can borrow it again."]],
    [164, 22, ["The elevator.", "A heavy bag.", "This afternoon.", "Call me."]],
    [165, 20, ["For tonight.", "The time.", "Eight.", "Yes, eight is okay."]],
    [166, 23, ["Who was your favorite teacher?", "Very funny.", "I learned a lot from my teacher.", "Be a teacher."]],
    [167, 20, ["Every Sunday.", "It was so good.", "In the kitchen.", "The taste."]],
    [168, 26, ["On Saturday.", "Very hot.", "A hat and water.", "Swim in the sea."]],
    [169, 20, ["Your passport.", "Two bags.", "Gate nine.", "At ten."]],
    [170, 21, ["My bag.", "A little cold.", "A blanket.", "At nine."]],
    [171, 24, ["Why are you here?", "To visit my family.", "For ten days.", "At a hotel."]],
    [172, 21, ["Exchange some money.", "You can see it here.", "In cash.", "Your receipt."]],
    [173, 22, ["Last week.", "The new apartment is bigger.", "This box.", "In the kitchen."]],
    [174, 19, ["My tooth.", "A doctor.", "Open your mouth.", "Do not eat for one hour."]],
    [175, 24, ["A new phone.", "A good camera.", "In black.", "I will buy the black phone."]],
    [176, 23, ["The night market.", "That is a good idea.", "Chicken.", "Two."]],
    [177, 18, ["Tomorrow.", "There is no work tomorrow.", "We should stay inside.", "Rice and water."]],
    [178, 20, ["Pay this bill.", "Yes, you can pay it here.", "This machine.", "Yes, please."]],
    [179, 24, ["The next train.", "A window seat.", "Car two.", "One hour."]],
    [180, 21, ["A beautiful island.", "The mountains.", "What about the food?", "The night market."]],
    [181, 22, ["Be a volunteer.", "This weekend.", "Clean the park.", "Your name."]],
    [182, 23, ["Next week.", "Water my plants.", "Every day.", "A gift."]],
    [183, 20, ["Playing the guitar.", "Hard but fun.", "Every evening.", "Yes, I want to try it."]],
    [184, 18, ["How can I book?", "You can book online.", "Go to the website.", "An email."]],
    [185, 23, ["Amy.", "A girl.", "Very small.", "Next week."]],
    [186, 22, ["What do you usually have for breakfast?", "Eggs and milk.", "I do not have time.", "Breakfast is important."]],
    [187, 17, ["An old photo.", "My father.", "So young.", "This day."]],
    [188, 20, ["This is not my package.", "The wrong name.", "Take it back.", "Tomorrow."]],
    [189, 22, ["My key.", "Did you look in your bag?", "On the table.", "By the door."]],
    [190, 23, ["Have lunch together.", "Near here.", "At noon.", "I will pay today."]],
  ];
  assert.equal(scenarios.length, expectedPilot.units - 13);
  for (const [number, count, answers] of scenarios) {
    const id = `a2-u${number}`;
    assert.equal(a2Rows.filter((row) => row.unit_id === id).length, count);
    const passage = a2Reading.passages.find((entry) => entry.passageId === `${id}-p01`);
    assert.ok(passage.sentences.length >= 5);
    assert.deepEqual(passage.questions.map((entry) => entry.correctAnswer), answers);
    assert.ok(passage.questions.every((entry) => entry.qaStatus === "pilot_review_required"));
  }
});

test("keeps the A2 local course copy small while preserving learner edits", () => {
  const entry = catalogJson.levels.find((level) => level.level === "A2");
  const updatedAt = "2026-11-24T00:00:00.000Z";
  const unchanged = createStoredCourseDelta(entry, a2Rows, a2Rows, "revision", updatedAt);
  assert.deepEqual(unchanged.changedRows, []);
  assert.ok(JSON.stringify(unchanged).length < 1000, "unedited rows must not fill browser storage");
  const restored = restoreStoredCourseData(JSON.stringify(unchanged), entry, a2Rows, "revision");
  assert.deepEqual(restored.rows, a2Rows);
  assert.equal(restored.updatedAt, updatedAt);

  const edited = a2Rows.map((row, index) => (index === 7 ? { ...row, note: "本機修改的提示" } : row));
  const delta = createStoredCourseDelta(entry, edited, a2Rows, "revision", updatedAt);
  assert.deepEqual(delta.changedRows.map((row) => row.occurrence_id), [a2Rows[7].occurrence_id]);
  assert.equal(restoreStoredCourseData(JSON.stringify(delta), entry, a2Rows, "revision").rows[7].note, "本機修改的提示");

  // Copies saved by earlier versions keep working until the next save replaces them.
  const legacy = createStoredCourseData(entry, [...edited].reverse(), "revision", updatedAt);
  assert.equal(restoreStoredCourseData(JSON.stringify(legacy), entry, a2Rows, "revision").rows[7].note, "本機修改的提示");
  assert.equal(restoreStoredCourseData(JSON.stringify(delta), entry, a2Rows, "other-revision"), null);
  const unknown = { ...delta, changedRows: [{ ...delta.changedRows[0], occurrence_id: "a2-u999-l01-p01-s01-t01" }] };
  assert.equal(restoreStoredCourseData(JSON.stringify(unknown), entry, a2Rows, "revision"), null);

  const reordered = createStoredCourseDelta(entry, [...edited].reverse(), a2Rows, "revision", updatedAt);
  assert.deepEqual(reordered, delta);
  assert.ok(JSON.stringify(reordered).length < 10_000, "sorting the spreadsheet must not store the entire course");
  assert.deepEqual(restoreStoredCourseData(JSON.stringify(reordered), entry, a2Rows, "revision").rows, edited);

  const duplicate = [a2Rows[1], ...a2Rows.slice(1)];
  assert.throws(() => createStoredCourseDelta(entry, duplicate, a2Rows, "revision"), /occurrence_id/);
  const foreign = [{ ...a2Rows[0], occurrence_id: "a2-u999-l01-p01-s01-t01" }, ...a2Rows.slice(1)];
  assert.throws(() => createStoredCourseDelta(entry, foreign, a2Rows, "revision"), /缺少正式 occurrence_id/);
});

test("migrates schemaVersion 3 to 6 without changing A1 data", () => {
  const legacy = {
    schemaVersion: 3,
    completedLessonIds: ["a1-u1-l1"],
    passedUnitIds: ["a1-u1"],
    levelPassed: true,
    totalAttempts: 12,
    correctAnswers: 9,
    totalSeconds: 321,
    pasteCount: 2,
    studyDates: ["2026-07-27"],
    reviewItems: {
      "a1-u1-l1-t01": {
        tokenId: "a1-u1-l1-t01",
        answer: "I",
        prompt: "我",
        familiarity: "熟悉",
        dueAt: "2026-08-01T00:00:00.000Z",
        intervalDays: 5,
        successfulDays: 1,
      },
    },
    lexemeProgress: {},
    senseProgress: {},
    sentencePatternProgress: {},
    tokenProgress: {
      "a1-u1-l1-t01": {
        attempts: 2,
        hintsUsed: 1,
        answerRevealed: false,
        elapsedSeconds: 8,
        audioReplays: 1,
        usedPaste: false,
        correctAnswers: 1,
        lastAnsweredAt: "2026-07-27T00:00:00.000Z",
      },
    },
    sentenceStats: {},
    patternStats: {},
    passageStats: {},
    tokenHintLevels: {},
    chunkHintLevels: {},
    patternHintLevels: {},
    reviewExerciseTypes: {},
  };
  const migrated = migrateProgressToV6(legacy);
  assert.equal(migrated.schemaVersion, 6);
  assert.equal(migrated.selectedLevel, "A1");
  assert.deepEqual(
    migrated.levelProgress.A1.completedLessonIds,
    legacy.completedLessonIds,
  );
  assert.deepEqual(
    migrated.levelProgress.A1.passedUnitIds,
    legacy.passedUnitIds,
  );
  assert.deepEqual(
    migrated.levelProgress.A1.tokenProgress,
    legacy.tokenProgress,
  );
  assert.equal(
    migrated.levelProgress.A1.reviewItems["a1-u1-l1-t01"].dueAt,
    legacy.reviewItems["a1-u1-l1-t01"].dueAt,
  );
  assert.equal(migrated.levelProgress.A1.totalAttempts, 12);
  assert.deepEqual(migrated.passedLevelIds, ["A1"]);
  assert.deepEqual(
    migrated.levelProgress.A2.completedLessonIds,
    [],
  );
  assert.deepEqual(migrated.levelProgress.B1.completedLessonIds, []);
  assert.deepEqual(migrated.levelProgress.B2.completedLessonIds, []);
  assert.deepEqual(migrated.vocabularyProgress, {});
});

test("keeps A1 and A2 progress isolated and restorable", () => {
  const initial = createEmptyMultiLevelProgress();
  initial.levelProgress.A1.completedLessonIds = ["a1-u1-l1"];
  const selectedA2 = { ...initial, selectedLevel: "A2" };
  const updated = updateSelectedLevelProgress(
    selectedA2,
    (progress) => ({
      ...progress,
      completedLessonIds: ["a2-u01-l01"],
    }),
  );
  assert.deepEqual(updated.levelProgress.A1.completedLessonIds, [
    "a1-u1-l1",
  ]);
  assert.deepEqual(updated.levelProgress.A2.completedLessonIds, [
    "a2-u01-l01",
  ]);
  assert.deepEqual(
    migrateProgressToV6(JSON.parse(JSON.stringify(updated))),
    updated,
  );
});

test("enforces formal A2 unlock while allowing a non-mutating pilot entry", () => {
  const passedLevelIds = [];
  assert.equal(canAccessLevel("A2", passedLevelIds, false), false);
  assert.equal(canAccessLevel("A2", passedLevelIds, true), true);
  assert.deepEqual(passedLevelIds, []);
  assert.equal(canAccessLevel("A2", ["A1"], false), true);
  assert.equal(canAccessLevel("B1", ["A1"], false), false);
  assert.equal(canAccessLevel("B1", ["A2"], false), false);
  assert.equal(canAccessLevel("B1", ["A1", "A2"], false), true);
  assert.equal(canAccessLevel("B2", ["A1", "A2"], false), false);
  assert.equal(canAccessLevel("B2", ["B1"], false), false);
  assert.equal(
    canAccessLevel("B2", ["A1", "A2", "B1"], false),
    true,
  );
  assert.equal(canAccessLevel("B2", [], true), true);
  assert.equal(canAccessLevel("B1", ["A1", "A2"], true, "disabled"), false);
  assert.equal(canAccessLevel("B2", ["A1", "A2", "B1"], true, "disabled"), false);
  assert.equal(isLevelAssessmentEnabled("A1"), true);
  assert.equal(isLevelAssessmentEnabled("A2"), false);
  assert.equal(isLevelAssessmentEnabled("B1"), false);
  assert.equal(isLevelAssessmentEnabled("B2"), false);
});

test("isolates an A2 loading failure from a valid A1 level", async () => {
  const failedA2Fetcher = async (url) => {
    if (url === "/data/a2-course-v1.csv") {
      return response("", 500);
    }
    return curriculumFetcher(url);
  };
  const result = await loadAvailableCourseLevels(failedA2Fetcher);
  assert.equal(result.levels.A1.units.length, 8);
  assert.equal(result.levels.A2, undefined);
  assert.match(result.errors.A2, /A2 課程 CSV 載入失敗/);
});
