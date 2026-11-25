import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parseCourseCsv, serializeCourseCsv } from "../../app/curriculum/validation.ts";

const storageKey = "yingju-course-rows-a2-v1";
const officialRows = parseCourseCsv(readFileSync(
  new URL("../../public/data/a2-course-v1.csv", import.meta.url), "utf8",
));
const original = officialRows[0];
const localPrompt = "我（本機提示）";
const rejectedPrompt = "我（未儲存的提示）";

const openA2Content = async (page: Page) => {
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/data/a2-reading-exercises.json") && response.ok()),
    page.goto("/"),
  ]);
  await page.getByRole("button", { name: "前往內容管理", exact: true }).click();
  await expect(page.getByRole("heading", { name: "課程內容管理" })).toBeVisible();
  await page.getByTestId("level-selector-a2").click();
  await expect(page.getByText(/試行課程來源：public\/data\/a2-course-v1\.csv/)).toBeVisible();
  await page.locator(".filter-row select").selectOption(original.unit_id);
};

const importReordered = (page: Page, prompt: string) => {
  const rows = [{ ...original, prompt }, ...officialRows.slice(1)].reverse();
  return page.locator('input[type="file"]').setInputFiles({
    name: "sorted-a2.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(serializeCourseCsv(rows), "utf8"),
  });
};

test("persists reordered A2 imports and leaves the last saved course intact on a quota error", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem("yingju-settings-v1", JSON.stringify({ showAdvancedPilots: true }));
  });
  await openA2Content(page);
  await importReordered(page, localPrompt);
  await expect(page.locator(".toast")).toContainText("匯入成功");
  const saved = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  expect(saved).not.toBeNull();
  expect(saved!.length).toBeLessThan(10_000);
  expect(JSON.parse(saved!).changedRows).toMatchObject([{ occurrence_id: original.occurrence_id, prompt: localPrompt }]);

  await page.evaluate((key) => {
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Storage is full", "QuotaExceededError");
      nativeSetItem.call(this, name, value);
    };
  }, storageKey);
  await importReordered(page, rejectedPrompt);
  await expect(page.locator(".toast")).toContainText("A2 課程未套用：瀏覽器儲存空間不足");
  const firstPrompt = page.locator(".admin-table tbody tr").first().locator("input").nth(1);
  await expect(firstPrompt).toHaveValue(localPrompt);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(saved);

  await openA2Content(page);
  await expect(firstPrompt).toHaveValue(localPrompt);
  await page.getByRole("button", { name: "還原正式課程資料" }).click();
  await expect(firstPrompt).toHaveValue(original.prompt);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
});
