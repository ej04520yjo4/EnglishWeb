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
  assert.match(html, /把英文從「看得懂」練成「說得出來」/);
  assert.match(html, /課程地圖/);
  assert.match(html, /A–Z 基礎/);
  assert.match(html, /I am Amy\./);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/);
});

test("keeps course data and product metadata ready for the MVP", async () => {
  const [page, data, roadmap, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/course-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/course-roadmap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /localStorage/);
  assert.match(page, /exportContentXlsx/);
  assert.match(page, /checkDictation/);
  assert.match(page, /recall-word-grid/);
  assert.match(page, /這是一個 \{currentTokenWords\.length\} 詞語塊/);
  assert.match(page, /event\.key === " "/);
  assert.match(page, /expectedWordCount/);
  assert.match(page, /按空白鍵可換格/);
  assert.match(page, /aria-keyshortcuts="Enter"/);
  assert.match(page, /detail-next-button/);
  assert.match(page, /title="按 Enter 開始"/);
  assert.match(page, /autoFocus=\{index === 0 && !rebuildAnswerRevealed\}/);
  assert.match(page, /index === selectedLesson\.tokens\.length - 1/);
  assert.match(page, /最後一格按 Enter 檢查答案/);
  assert.match(page, /已嘗試 3 次，正確答案已放入各格/);
  assert.match(page, /rebuildAnswerRevealed \? "下一步 →"/);
  assert.match(page, /id="dictation-answer"[\s\S]{0,180}autoFocus/);
  assert.match(page, /continueAfterLesson/);
  assert.match(page, /進入單元測驗/);
  assert.match(page, /autoFocus=\{unitDone && !unitPassed\}/);
  assert.match(page, /autoFocus=\{!assessment\.checked\}/);
  assert.match(page, /key=\{assessment\.checked \? "assessment-next" : "assessment-submit"\}/);
  assert.match(page, /title=\{assessment\.checked \? "按 Enter 繼續"/);
  assert.match(page, /KK 音標/);
  assert.match(page, /const renderPhonetics/);
  assert.match(page, /17 個母音・24 個子音/);
  const alphabetSection = page.slice(
    page.indexOf("const renderAlphabet"),
    page.indexOf("const renderPhonetics"),
  );
  assert.doesNotMatch(alphabetSection, /entry\.kk|entry\.ipa/);
  assert.match(page, /美式 IPA/);
  assert.match(page, /advancedCoursePlans/);
  assert.match(data, /would like to/);
  assert.match(data, /courseUnits/);
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
