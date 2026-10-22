import { expect, test } from '@playwright/test';

// These pages must work from a static host, with no client JavaScript.
test.use({ javaScriptEnabled: false });

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://127.0.0.1:4173').origin;
  // External avatar/embed servers should not affect static-site validation.
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin === origin) {
      await route.continue();
    } else {
      await route.fulfill({ status: 204, body: '' });
    }
  });
});

test('homepage includes every article and external entry without JavaScript', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('6715.jp');
  await expect(page.locator('.entry-list > li')).toHaveCount(45);
  await expect(page.locator('.entry-list a[href^="/posts/"]')).toHaveCount(30);
  await expect(page.locator(".entry-list a[target='_blank']")).toHaveCount(15);
  await expect(page.locator('header a')).toHaveText('6715.jp');
  await expect(page.locator('#profile')).toContainText('sekai');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://6715.jp/');
});

test('article and tag links use ordinary static navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('.entry-list a[href="/posts/1/"]').click();
  await expect(page.locator('main h1')).toHaveText('ブログを始めました');
  await expect(page.locator('article')).toContainText('表題のとおりです。');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://6715.jp/posts/1/',
  );
  await page.goto('/posts/30/');
  const tag = page.locator('.article-meta a[href^="/tags/"]').first();
  const tagName = await tag.textContent();
  await tag.click();
  await expect(page.locator('main h2')).toContainText(tagName ?? '');
  await expect(page.locator('.entry-list > li').first()).toBeVisible();
  await page.locator('header a').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle('6715.jp');
});

test('math, tables, highlighted code, and local images are server rendered', async ({ page }) => {
  await page.goto('/posts/6/');
  await expect(page.locator('.article-content .katex').first()).toBeVisible();
  await expect(page.locator('.article-content .katex-display').first()).toBeVisible();
  await expect(page.locator('.article-content .katex-error')).toHaveCount(0);
  await expect(page.locator('.article-content table')).toHaveCount(1);
  await expect(page.locator('.article-content table tr')).toHaveCount(5);
  await expect(page.locator('.article-content pre code').first()).toBeVisible();
  await expect(page.locator('.article-content button.copy').first()).toBeHidden();
  await page.goto('/posts/14/');
  const image = page.locator('.article-content img[src$="1.png"]').first();
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
});

test('footnotes and back references point to existing static fragments', async ({ page }) => {
  await page.goto('/posts/30/');
  const references = page.locator('.article-content a[href^="#fn"]');
  expect(await references.count()).toBeGreaterThan(4);
  const missing = await references.evaluateAll((anchors) =>
    anchors
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => !document.getElementById(decodeURIComponent(href.slice(1)))),
  );
  expect(missing).toEqual([]);
  await page.goto('/posts/19/');
  await expect(page.locator('.article-content :is(del, s)').first()).toBeVisible();
});

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 375, height: 812 },
]) {
  test(`layout remains readable at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    for (const route of ['/', '/posts/6/', '/posts/30/', '/tags/CTF/']) {
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        main: document.querySelector('main')!.getBoundingClientRect().width,
        direction: getComputedStyle(document.querySelector('.entry-list li') ?? document.body)
          .flexDirection,
      }));
      // Article 30 includes long, unbroken URLs inside nested lists. They
      // overflow identically in the old site; retain that typography while
      // checking the actual content container and images remain constrained.
      if (route !== '/posts/30/') {
        expect(dimensions.scrollWidth, `horizontal overflow on ${route}`).toBeLessThanOrEqual(
          dimensions.width + 1,
        );
      }
      expect(dimensions.main).toBeLessThanOrEqual(800);
      expect(dimensions.main).toBeLessThanOrEqual(viewport.width - 32);
      const wideImages = await page
        .locator('.article-content img')
        .evaluateAll((images) =>
          images
            .filter(
              (image) =>
                image.getBoundingClientRect().width >
                document.querySelector('main')!.getBoundingClientRect().width + 1,
            )
            .map((image) => image.getAttribute('src')),
        );
      expect(wideImages).toEqual([]);
      if (route === '/') {
        expect(dimensions.direction).toBe(viewport.width <= 768 ? 'column' : 'row');
      }
    }
    await page.goto('/posts/30/');
    await page.screenshot({ path: testInfo.outputPath(`article-${viewport.width}.png`) });
  });
}

test('custom 404 and sitemap exist on the static host', async ({ page, request }) => {
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Not Found | 6715.jp');
  await expect(page.locator('main h2')).toHaveText('404');
  await expect(page.locator('main h3')).toHaveText('Not Found');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('https://6715.jp/posts/30/');
});
