import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Traditional Chinese learning experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-Hant">/);
  assert.match(html, /<title>英句練習｜互動式英文句子學習<\/title>/);
  assert.match(html, /課程地圖/);
  assert.match(html, /A–Z 基礎/);
  assert.match(html, /正在載入 A1 正式課程資料/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/);
});

test("keeps course data and product metadata ready for the MVP", async () => {
  const [
    page,
    data,
    a1Data,
    exercises,
    curriculumCatalog,
    roadmap,
    layout,
    packageJson,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/course-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/a1-mvp-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/a1-exercises.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/data/course-catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../app/course-roadmap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /localStorage/);
  assert.match(page, /exportContentXlsx/);
  assert.doesNotMatch(page, /checkDictation|dictation-answer/);
  assert.match(page, /stage === "reading-recognition"/);
  assert.match(page, /stage === "pattern-transfer"/);
  assert.match(page, /stage === "text-response"/);
  assert.match(page, /stage === "passage-comprehension"/);
  assert.match(page, /recall-word-grid/);
  assert.match(page, /把下面提示寫成英文/);
  assert.match(page, /你的英文答案/);
  assert.match(page, /event\.repeat/);
  const thirdAttemptGuard = page.indexOf("if (nextAttempt >= 3)");
  const nearMissCheck = page.indexOf("editDistance(clean(recallAnswer)", thirdAttemptGuard);
  assert.ok(thirdAttemptGuard >= 0);
  assert.ok(nearMissCheck > thirdAttemptGuard);
  assert.match(page, /這是一個 \{currentTokenWords\.length\} 詞語塊/);
  assert.match(page, /event\.key === " "/);
  assert.match(page, /expectedWordCount/);
  assert.match(page, /空白鍵／→ 前往下一格/);
  assert.match(page, /aria-keyshortcuts="Enter"/);
  assert.match(page, /detail-next-button/);
  assert.match(page, /title="按 Enter 開始"/);
  assert.match(page, /autoFocus=\{index === 0 && !rebuildAnswerRevealed\}/);
  assert.match(page, /index === selectedLesson\.tokens\.length - 1/);
  assert.match(page, /最後一格按 Enter 檢查/);
  assert.match(page, /已嘗試 3 次，正確答案已放入各格/);
  assert.match(page, /rebuildAnswerRevealed \? "下一步 →"/);
  assert.match(page, /id="pattern-transfer-answer"[\s\S]{0,320}autoFocus/);
  assert.match(page, /id=\{`recognition-option-\$\{option\.id\}`\}/);
  assert.match(page, /id=\{`text-response-option-\$\{option\.id\}`\}/);
  assert.match(page, /stage === "passage-rebuild"/);
  assert.match(page, /checkPassageRebuild/);
  assert.match(page, /checkPassageComprehension/);
  assert.match(page, /continueAfterLesson/);
  assert.match(page, /進入單元測驗/);
  assert.match(page, /autoFocus=\{unitDone && !unitPassed\}/);
  assert.match(page, /autoFocus=\{!assessment\.checked\}/);
  assert.match(page, /key=\{assessment\.checked \? "assessment-next" : "assessment-submit"\}/);
  assert.match(page, /title=\{assessment\.checked \? "按 Enter 繼續"/);
  assert.match(page, /KK 音標/);
  assert.match(page, /const renderPhonetics/);
  assert.match(page, /17 個母音・24 個子音/);
  assert.match(page, /播放鍵直接聽音標本身/);
  assert.match(page, /playKkAudio\(entry\)/);
  assert.doesNotMatch(page, /speak\(entry\.example/);
  const alphabetSection = page.slice(
    page.indexOf("const renderAlphabet"),
    page.indexOf("const renderPhonetics"),
  );
  assert.doesNotMatch(alphabetSection, /entry\.kk|entry\.ipa/);
  assert.match(page, /美式 IPA/);
  assert.match(page, /advancedCoursePlans/);
  assert.doesNotMatch(data, /export const courseUnits/);
  assert.match(a1Data, /buildCourseUnitsFromRows/);
  assert.match(a1Data, /\/data\/a1-course-v3\.csv/);
  const catalog = JSON.parse(curriculumCatalog);
  assert.deepEqual(
    catalog.levels.map((entry) => entry.level),
    ["A1", "A2", "B1", "B2"],
  );
  assert.equal(
    catalog.levels[0].patternExercisesUrl,
    "/data/a1-pattern-exercises.json",
  );
  assert.equal(
    catalog.levels[0].readingExercisesUrl,
    "/data/a1-reading-exercises.json",
  );
  assert.match(page, /loadCourseExerciseData/);
  assert.match(exercises, /validatePatternExerciseData/);
  assert.match(exercises, /validateReadingExerciseData/);
  assert.match(data, /\{ letter: "A", kk: "\/e\/", ipa: "\/eɪ\/" \}/);
  for (const level of ["A2", "B1", "B2", "C1", "C2"]) {
    assert.match(roadmap, new RegExp(`code: "${level}"`));
  }
  assert.match(roadmap, /一般過去式/);
  assert.match(roadmap, /C2 綜合真實任務/);
  assert.match(layout, /lang="zh-Hant"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", root)));
});
