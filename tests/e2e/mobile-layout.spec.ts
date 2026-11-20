import { expect, test } from "@playwright/test";

const homeHeading = "把英文從「看得懂」練成「寫得出來」";

test("phone home keeps the plan in view and uses a compact navigation row", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "phone layout only");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: homeHeading })).toBeVisible();

  const primaryAction = page.getByRole("button", { name: /開始這一課/ });
  await expect(primaryAction).toBeFocused();
  // Focusing the primary action must not scroll past the hero and daily plan.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  const navigation = page.getByRole("navigation", { name: "主要導覽" });
  const navigationBox = await navigation.boundingBox();
  expect(navigationBox?.height ?? 0).toBeLessThan(80);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  // Keyboard hints are noise on a touch screen.
  await expect(primaryAction.locator("kbd")).toBeHidden();

  // The current destination scrolls into the row without moving the page.
  await page.getByRole("button", { name: "前往學習進度", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "前往學習進度", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("button", { name: "前往學習進度", exact: true }),
  ).toBeInViewport();
});

test("desktop keeps keyboard hints and the vertical sidebar", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "desktop layout only");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: homeHeading })).toBeVisible();
  const primaryAction = page.getByRole("button", { name: /開始這一課/ });
  await expect(primaryAction).toBeFocused();
  await expect(primaryAction.locator("kbd")).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "主要導覽" });
  expect((await navigation.boundingBox())?.height ?? 0).toBeGreaterThan(300);
});
