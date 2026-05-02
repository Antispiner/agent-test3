import { test, expect } from "@playwright/test";

test("user can add ancestor and chat", async ({ page, request, baseURL }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /\+\s*Add/i }).click();
  await expect(page).toHaveURL(/\/add$/);

  await page.getByLabel(/name/i).fill("Бабушка Алла");
  await page.getByLabel(/relation/i).fill("бабушка");
  await page.getByLabel(/birth/i).fill("1920");
  await page.getByLabel(/death/i).fill("1995");
  await page.getByLabel(/birthplace/i).fill("Малешев");
  await page.getByLabel(/language/i).fill("ru");

  const lifeEvents = page.getByLabel(/life.?events?/i);
  await lifeEvents.fill("пережила войну");

  await Promise.all([
    page.waitForURL(/\/chat\/[^/]+$/),
    page.getByRole("button", { name: /save|create|submit/i }).click(),
  ]);

  const chatId = page.url().split("/chat/")[1];
  expect(chatId).toBeTruthy();

  const input = page.getByRole("textbox").last();
  await input.fill("Расскажи о войне");
  await input.press("Enter");

  const ancestorMessage = page
    .locator('[data-role="ancestor"], .msg-ancestor, [data-author="ancestor"]')
    .first();
  await expect(ancestorMessage).toBeVisible({ timeout: 30_000 });
  await expect(ancestorMessage).not.toHaveText("");

  const resp = await request.get(`${baseURL}/api/chat/${chatId}/messages`);
  expect(resp.status()).toBe(200);
  const messages = await resp.json();
  expect(Array.isArray(messages)).toBe(true);
  expect(messages.length).toBeGreaterThanOrEqual(2);
});
