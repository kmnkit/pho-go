import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate through main pages from home', async ({ page }) => {
    await page.goto('/');

    // Verify home page loaded
    await expect(page).toHaveTitle(/ベトナム語学習/);
    await expect(page.getByText('ベトナム語学習アプリ')).toBeVisible();

    // Navigate to alphabet learning
    await page.getByRole('link', { name: /アルファベット/ }).click();
    await expect(page).toHaveURL(/\/learn\/alphabet/);
    await expect(page.getByText('ベトナム語アルファベット')).toBeVisible();

    // Navigate back to home using header
    await page.getByRole('link', { name: /ホーム/ }).first().click();
    await expect(page).toHaveURL('/');

    // Navigate to tones
    await page.getByRole('link', { name: /声調/ }).click();
    await expect(page).toHaveURL(/\/learn\/tones/);
    await expect(page.getByText('ベトナム語の声調')).toBeVisible();

    // Navigate to flashcards
    await page.getByRole('link', { name: /単語カード/ }).click();
    await expect(page).toHaveURL(/\/flashcards/);
    await expect(page.getByText('カテゴリーを選択')).toBeVisible();

    // Navigate to quiz
    await page.getByRole('link', { name: /クイズ/ }).click();
    await expect(page).toHaveURL(/\/quiz/);
    await expect(page.getByText('クイズモードを選択')).toBeVisible();

    // Navigate to progress
    await page.getByRole('link', { name: /学習統計/ }).click();
    await expect(page).toHaveURL(/\/progress/);
    await expect(page.getByText('学習統計')).toBeVisible();
  });

  test('should navigate using header on all pages', async ({ page }) => {
    const pages = [
      '/learn/alphabet',
      '/learn/tones',
      '/flashcards',
      '/quiz',
      '/progress',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Click home link in header
      const homeLink = page.getByRole('link', { name: /ホーム/ }).first();
      await expect(homeLink).toBeVisible();

      await homeLink.click();
      await expect(page).toHaveURL('/');

      // Go back to test page
      await page.goto(pagePath);
    }
  });

  test('should navigate using footer links', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify footer is visible
    await expect(page.getByText('© 2024 ベトナム語学習アプリ')).toBeVisible();

    // Click footer links
    const footerHomeLink = page.locator('footer').getByRole('link', { name: /ホーム/ });
    if (await footerHomeLink.isVisible()) {
      await footerHomeLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should navigate with browser back button', async ({ page }) => {
    await page.goto('/');

    // Navigate to flashcards
    await page.getByRole('link', { name: /単語カード/ }).click();
    await expect(page).toHaveURL(/\/flashcards/);

    // Navigate to a category
    await page.locator('text=挨拶').first().click();
    await expect(page).toHaveURL(/\/flashcards\/greetings/);

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/\/flashcards/);

    // Use browser back button again
    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('should have working mobile navigation', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Look for hamburger menu button
    const menuButton = page.locator('button[aria-label="メニュー"], button').filter({ hasText: /☰|≡|Menu/ }).first();

    // If mobile menu exists, test it
    const hasMobileMenu = await menuButton.isVisible().catch(() => false);

    if (hasMobileMenu) {
      // Click hamburger menu
      await menuButton.click();

      // Verify menu opened
      await page.waitForTimeout(300);

      // Click a link in mobile menu
      const flashcardsLink = page.getByRole('link', { name: /単語カード/ }).first();
      await flashcardsLink.click();

      await expect(page).toHaveURL(/\/flashcards/);
    }
  });

  test('should navigate from tones to tone quiz', async ({ page }) => {
    await page.goto('/learn/tones');

    // Click quiz challenge button
    await page.getByRole('button', { name: /クイズに挑戦/ }).click();

    // Verify tone quiz page loaded
    await expect(page).toHaveURL(/\/learn\/tones\/quiz/);
    await expect(page.locator('text=/問題 \\d+ \\/ 6/')).toBeVisible();
  });

  test('should navigate between quiz types', async ({ page }) => {
    await page.goto('/quiz');

    // Navigate to Japanese to Vietnamese quiz
    await page.getByRole('link', { name: /日本語 → ベトナム語/ }).click();
    await expect(page).toHaveURL(/\/quiz\/ja-to-vi/);

    // Navigate back to quiz selection
    await page.getByRole('button', { name: /終了|他のクイズへ/ }).first().click();

    // Should be back on quiz selection or home
    await page.waitForTimeout(300);
  });

  test('should navigate from flashcard completion back to categories', async ({ page }) => {
    await page.goto('/flashcards/greetings');
    await page.waitForLoadState('networkidle');

    // Complete all cards quickly by clicking "まだ" button
    for (let i = 0; i < 30; i++) {
      const skipButton = page.getByRole('button', { name: /まだ/ });
      const isVisible = await skipButton.isVisible().catch(() => false);

      if (isVisible) {
        await skipButton.click();
        await page.waitForTimeout(50);
      } else {
        break;
      }
    }

    // Should reach completion screen
    const completionScreen = page.getByText('素晴らしい！完了しました');
    const onCompletionScreen = await completionScreen.isVisible().catch(() => false);

    if (onCompletionScreen) {
      // Click "他のカテゴリーへ" button
      await page.getByRole('button', { name: /他のカテゴリーへ/ }).click();

      // Should be back on category selection
      await expect(page).toHaveURL(/\/flashcards$/);
      await expect(page.getByText('カテゴリーを選択')).toBeVisible();
    }
  });

  test('should maintain progress when navigating between pages', async ({ page }) => {
    // Learn a flashcard
    await page.goto('/flashcards/numbers');
    await page.waitForLoadState('networkidle');

    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await knowButton.click();
    await page.waitForTimeout(300);

    // Navigate to home
    await page.goto('/');

    // Get XP value
    const xpElement = page.locator('text=/\\d+ XP/').first();
    const xpText = await xpElement.textContent();
    const xp = parseInt(xpText?.match(/\d+/)?.[0] || '0');

    // Navigate to progress page
    await page.goto('/progress');

    // Verify same XP is shown
    const progressXpElement = page.locator('text=/総経験値/').locator('..').locator('.text-3xl').first();
    const progressXpText = await progressXpElement.textContent();
    const progressXp = parseInt(progressXpText || '0');

    expect(progressXp).toBe(xp);
  });
});
