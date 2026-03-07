import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

export async function openContext(storageStatePath: string): Promise<{ browser: Browser; ctx: BrowserContext; page: Page }> {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: storageStatePath });
  const page = await ctx.newPage();
  return { browser, ctx, page };
}

async function expectLoggedIn(page: Page) {
  // If we get redirected to /login, the session is not valid.
  const url = page.url();
  if (url.includes("/login") || url.includes("flow/login")) {
    throw new Error("X session not logged in (storageState invalid/expired).");
  }
}

export async function postTweet(storageStatePath: string, text: string) {
  const { browser, ctx, page } = await openContext(storageStatePath);
  try {
    // Compose page (more stable than home sometimes)
    await page.goto("https://x.com/compose/post", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await expectLoggedIn(page);

    // textbox + post button (selectors change sometimes, keep a few fallbacks)
    const textbox = page.locator('[data-testid="tweetTextarea_0"], div[role="textbox"]');
    await textbox.first().click({ timeout: 15000 });
    await textbox.first().fill(text, { timeout: 15000 });

    const btn = page.locator('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
    await btn.first().click({ timeout: 15000 });

    // Wait for post to go through (best effort)
    await page.waitForTimeout(2500);
  } finally {
    await ctx.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
