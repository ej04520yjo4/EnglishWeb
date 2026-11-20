import { expect, Page, test } from "@playwright/test";

const settingsKey = "yingju-settings-v1";
const homeHeading = "把英文從「看得懂」練成「寫得出來」";
const storageWarning = /瀏覽器儲存空間已滿或被封鎖/;

const waitForHome = async (page: Page) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: homeHeading })).toBeVisible();
};

const openSettings = async (page: Page) => {
  await page.getByRole("button", { name: "設定", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "設定", exact: true }),
  ).toBeVisible();
};

test("a full storage quota shows a warning instead of a blank page", async ({ page }) => {
  await waitForHome(page);
  await openSettings(page);
  const autoplay = page.getByRole("checkbox", { name: /題目開始自動播放/ });
  await expect(autoplay).toBeChecked();
  const savedSettings = await page.evaluate(
    (key) => localStorage.getItem(key),
    settingsKey,
  );

  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Simulated full quota", "QuotaExceededError");
    };
  });
  await autoplay.uncheck();

  await expect(page.getByRole("status").filter({ hasText: storageWarning }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "設定", exact: true }))
    .toBeVisible();
  await expect(autoplay).not.toBeChecked();
  await expect(page.getByTestId("storage-status")).toHaveText(/本機進度未能儲存/);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), settingsKey),
  ).toBe(savedSettings);
});

test("blocked site storage still opens the home page", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Simulated blocked storage", "SecurityError");
      },
    });
  });
  await waitForHome(page);
  await page.getByRole("button", { name: /開始這一課/ }).first().click();
  await expect(page.getByRole("heading", { name: "我是誰" })).toBeVisible();
});
