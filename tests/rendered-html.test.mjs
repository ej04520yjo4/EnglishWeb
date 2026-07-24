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
  const [page, data, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/course-data.ts", import.meta.url), "utf8"),
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
  assert.match(page, /autoFocus=\{index === 0\}/);
  assert.match(page, /index === selectedLesson\.tokens\.length - 1/);
  assert.match(page, /最後一格按 Enter 檢查答案/);
  assert.match(data, /would like to/);
  assert.match(data, /courseUnits/);
  assert.match(layout, /lang="zh-Hant"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", root)));
});
