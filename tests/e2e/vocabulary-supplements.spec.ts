import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("public/data/vocabulary-applications-v1.json", "utf8")) as { entries: { lexemeId: string; sentence: string }[] };
const answer = (id: string) => data.entries.find((entry) => entry.lexemeId === id)?.sentence ?? "";
const progress = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("yingju-progress-v1") ?? "{}"));
const open = async (page: Page) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" })).toBeVisible();
  await page.getByRole("button", { name: "前往3000 單字庫", exact: true }).click();
  await expect(page.getByTestId("vocabulary-library-count")).toContainText("3000");
};
const start = async (page: Page, id: string) => {
  await expect(page.getByTestId("vocabulary-library-application-coverage")).toContainText("3000 / 3000");
  await page.getByTestId("vocabulary-library-search").fill(id);
  await page.getByTestId(`vocabulary-library-apply-${id}`).click();
  await expect(page.getByTestId("vocabulary-library-application-input")).toBeFocused();
};
const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

test("supplement requests remain lazy and all 3000 KK entries retain their variants without progress writes", async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => { if (/vocabulary-(applications|phonetics)-v1/.test(request.url())) requests.push(request.url()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" })).toBeVisible();
  expect(requests).toEqual([]);
  const before = await progress(page);
  await page.getByRole("button", { name: "前往3000 單字庫", exact: true }).click();
  await expect(page.getByTestId("vocabulary-library-phonetic-coverage")).toContainText("3000 / 3000");
  await page.getByTestId("vocabulary-library-search").fill("read");
  const phonetics = page.getByTestId("vocabulary-library-phonetics-read");
  await phonetics.locator("summary").click();
  await expect(phonetics).toContainText("候選 1");
  await expect(phonetics).toContainText("候選 2");
  await expect(phonetics).toContainText("未自動選定");
  expect((await progress(page)).vocabularyProgress).toEqual(before.vocabularyProgress);
  await noOverflow(page);
  await page.screenshot({ path: `tmp/kk-candidates-${testInfo.project.name}.png`, fullPage: false });
});

test("complete sentence application records clean target evidence and survives reload without changing courses", async ({ page }, testInfo) => {
  await open(page);
  const before = await progress(page);
  await start(page, "book");
  await expect(page.getByTestId("vocabulary-library-application-practice")).not.toContainText(answer("book"));
  await page.screenshot({ path: `tmp/application-${testInfo.project.name}.png`, fullPage: false });
  await page.getByTestId("vocabulary-library-application-input").fill(answer("book"));
  await page.getByTestId("vocabulary-library-application-input").press("Enter");
  await expect(page.getByTestId("vocabulary-library-application-feedback")).toBeVisible();
  const after = await progress(page);
  expect(after.vocabularyProgress.book.applicationCorrectEvidenceIds).toHaveLength(1);
  expect(after.levelProgress).toEqual(before.levelProgress);
  expect(after.passedLevelIds).toEqual(before.passedLevelIds);
  await page.reload();
  expect((await progress(page)).vocabularyProgress.book.applicationCorrectEvidenceIds).toHaveLength(1);
  await noOverflow(page);
});

test("holding Enter on the check button consumes only one attempt", async ({ page }) => {
  await open(page);
  await start(page, "book");
  await page.getByTestId("vocabulary-library-application-input").fill("This is wrong.");
  await page.getByTestId("vocabulary-library-application-check").focus();
  await page.keyboard.down("Enter");
  for (let repeat = 0; repeat < 4; repeat += 1) await page.keyboard.down("Enter");
  await page.keyboard.up("Enter");
  await expect(page.getByText(/第 1 次作答/)).toBeVisible();
  await expect(page.getByTestId("vocabulary-library-application-revealed")).toHaveCount(0);
  await page.getByTestId("vocabulary-library-application-check").press("Enter");
  await expect(page.getByText(/第 2 次作答/)).toBeVisible();
});

test("extra words fail and three mistakes reveal only after confirmation, retype adds no clean credit", async ({ page }) => {
  await open(page);
  await start(page, "book");
  const input = page.getByTestId("vocabulary-library-application-input");
  for (let count = 0; count < 3; count += 1) {
    await input.fill(`${answer("book")} today`);
    await input.press("Enter");
  }
  await expect(page.getByTestId("vocabulary-library-application-revealed")).toContainText(answer("book"));
  await expect(page.getByTestId("vocabulary-library-application-practice")).toBeVisible();
  await input.fill(answer("book"));
  await input.press("Enter");
  await expect(page.getByTestId("vocabulary-library-application-feedback")).toBeVisible();
  expect((await progress(page)).vocabularyProgress.book.applicationCorrectEvidenceIds).toEqual([]);
  await page.reload();
  await expect(page.getByRole("heading", { name: "把英文從「看得懂」練成「寫得出來」" })).toBeVisible();
  await page.getByRole("button", { name: "前往3000 單字庫", exact: true }).click();
  await start(page, "book");
  await page.getByTestId("vocabulary-library-application-input").fill(answer("book"));
  await page.getByTestId("vocabulary-library-application-input").press("Enter");
  await expect(page.getByTestId("vocabulary-library-application-feedback")).toBeVisible();
  expect((await progress(page)).vocabularyProgress.book.applicationCorrectEvidenceIds).toEqual([]);
  await noOverflow(page);
});

test("pasting a whole correct sentence never grants clean application credit", async ({ page }) => {
  await open(page);
  await start(page, "apple");
  const input = page.getByTestId("vocabulary-library-application-input");
  await input.dispatchEvent("paste");
  await input.fill(answer("apple"));
  await input.press("Enter");
  await expect(page.getByTestId("vocabulary-library-application-feedback")).toBeVisible();
  expect((await progress(page)).vocabularyProgress.apple.applicationCorrectEvidenceIds).toEqual([]);
});

test("supplement failure does not disable established word practice or formal courses", async ({ page }) => {
  await page.route("**/data/vocabulary-applications-v1.json", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.route("**/data/vocabulary-phonetics-v1.json", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await open(page);
  await expect(page.getByText(/句子應用載入失敗/)).toBeVisible();
  await page.getByTestId("vocabulary-library-spell-i").click();
  await expect(page.getByTestId("vocabulary-library-spelling-practice")).toBeVisible();
  await noOverflow(page);
});

test("the last target also has a usable contextual application", async ({ page }) => {
  await open(page);
  const last = data.entries.at(-1)!;
  await start(page, last.lexemeId);
  await page.getByTestId("vocabulary-library-application-input").fill(last.sentence);
  await page.getByTestId("vocabulary-library-application-input").press("Enter");
  await expect(page.getByTestId("vocabulary-library-application-feedback")).toBeVisible();
  await noOverflow(page);
});
