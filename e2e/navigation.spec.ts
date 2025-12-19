import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate through main pages from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify home page loaded
    await expect(page).toHaveTitle(/Việt Pocket/);
    await expect(page.getByText('ようこそ！Việt Pocket へ')).toBeVisible();

    // Navigate to alphabet learning
    await page.getByRole('link', { name: 'アルファベット' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/learn\/alphabet/);
    await expect(page.getByRole('heading', { name: 'ベトナム語アルファベット' })).toBeVisible();

    // Navigate back to home using logo link
    const homeLink = page.getByRole('link', { name: 'ホームページへ戻る' });
    await homeLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');

    // Navigate to tones
    await page.getByRole('link', { name: '声調' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/learn\/tones/);
    await expect(page.getByRole('heading', { name: 'ベトナム語の声調' })).toBeVisible();

    // Navigate to flashcards
    await page.getByRole('link', { name: '単語カード' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/flashcards/);
    await expect(page.getByRole('heading', { name: '単語カード' })).toBeVisible();

    // Navigate to quiz
    await page.getByRole('link', { name: 'クイズ' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/quiz/);
    await expect(page.getByRole('heading', { name: 'クイズモードを選択' })).toBeVisible();

    // Navigate to progress
    await page.getByRole('link', { name: '学習統計' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/progress/);
    await expect(page.getByRole('heading', { name: '学習統計' })).toBeVisible();
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
      await page.waitForLoadState('networkidle');

      // Click home link (logo)
      const homeLink = page.getByRole('link', { name: 'ホームページへ戻る' });
      await expect(homeLink).toBeVisible({ timeout: 10000 });

      await homeLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/');

      // Go back to test page
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate using footer links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify footer is visible with correct copyright text
    const currentYear = new Date().getFullYear();
    await expect(page.getByText(`© ${currentYear} Việt Pocket`)).toBeVisible({ timeout: 10000 });

    // Test footer quick links navigation
    const footerNav = page.locator('nav[aria-label="フッタークイックリンク"]');
    
    // Test alphabet link in footer
    const alphabetLink = footerNav.getByRole('link', { name: /アルファベット学習/ });
    await expect(alphabetLink).toBeVisible();
    await alphabetLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/learn\/alphabet/);
  });

  test('should navigate with browser back button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to flashcards
    await page.getByRole('link', { name: '単語カード' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/flashcards/);

    // Navigate to greetings category using button (not select)
    const greetingsButton = page.getByRole('button', { name: /挨拶/ }).or(page.getByRole('link', { name: /挨拶/ }));
    await expect(greetingsButton).toBeVisible({ timeout: 10000 });
    await greetingsButton.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/flashcards\/greetings/);

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/flashcards/);

    // Use browser back button again
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });

  test('should work correctly on mobile viewport', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify mobile menu button is visible
    const mobileMenuButton = page.getByRole('button', { name: 'モバイルメニュー' });
    await expect(mobileMenuButton).toBeVisible({ timeout: 10000 });

    // Open mobile menu
    await mobileMenuButton.click();
    await page.waitForTimeout(300);

    // Test flashcards navigation from mobile menu
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible({ timeout: 5000 });
    
    const flashcardsLink = mobileMenu.getByRole('link', { name: /単語カード/ });
    await expect(flashcardsLink).toBeVisible();
    await flashcardsLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/flashcards/);

    // Verify category selection works on mobile
    const greetingsCategory = page.getByRole('button', { name: /挨拶/ }).or(page.getByRole('link', { name: /挨拶/ }));
    await expect(greetingsCategory).toBeVisible({ timeout: 10000 });
  });

  test('should navigate from tones to tone quiz', async ({ page }) => {
    await page.goto('/learn/tones');
    await page.waitForLoadState('networkidle');

    // Click quiz challenge button
    const quizButton = page.getByRole('button', { name: /クイズに挑戦/ });
    await expect(quizButton).toBeVisible({ timeout: 10000 });
    await quizButton.click();
    await page.waitForLoadState('networkidle');

    // Verify tone quiz page loaded
    await expect(page).toHaveURL(/\/learn\/tones\/quiz/);
    await expect(page.locator('text=/問題 \\d+ \\/ 6/')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between quiz types', async ({ page }) => {
    await page.goto('/quiz');
    await page.waitForLoadState('networkidle');

    // Navigate to Japanese to Vietnamese quiz
    const jaToViQuiz = page.getByRole('link', { name: /日本語 → ベトナム語/ });
    await expect(jaToViQuiz).toBeVisible({ timeout: 10000 });
    await jaToViQuiz.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/quiz\/ja-to-vi/);

    // Navigate back to quiz selection using exit button
    const exitButton = page.getByRole('button', { name: /終了/ });
    await expect(exitButton).toBeVisible({ timeout: 10000 });
    await exitButton.click();
    await page.waitForLoadState('networkidle');

    // Should be back on quiz selection
    await expect(page).toHaveURL(/\/quiz/);
  });

  test('should navigate from flashcard completion back to categories', async ({ page }) => {
    await page.goto('/flashcards/greetings');
    await page.waitForLoadState('networkidle');

    // Complete flashcard session quickly - learn 3 cards and skip the rest
    let cardsProcessed = 0;
    const maxCards = 30;
    
    while (cardsProcessed < maxCards) {
      // First learn 3 cards
      if (cardsProcessed < 3) {
        const knowButton = page.getByRole('button', { name: /覚えた/ });
        const isKnowVisible = await knowButton.isVisible().catch(() => false);
        
        if (isKnowVisible) {
          await knowButton.click();
          await page.waitForTimeout(50);
          cardsProcessed++;
          continue;
        }
      }
      
      // Then skip remaining cards
      const skipButton = page.getByRole('button', { name: /まだ/ });
      const isSkipVisible = await skipButton.isVisible().catch(() => false);
      
      if (isSkipVisible) {
        await skipButton.click();
        await page.waitForTimeout(50);
        cardsProcessed++;
      } else {
        break;
      }
    }

    // Should reach completion screen
    const completionScreen = page.getByText('素晴らしい！完了しました');
    await expect(completionScreen).toBeVisible({ timeout: 10000 });

    // Click "他のカテゴリーへ" button
    const categoryButton = page.getByRole('button', { name: /他のカテゴリーへ/ });
    await expect(categoryButton).toBeVisible();
    await categoryButton.click();
    await page.waitForLoadState('networkidle');

    // Should be back on category selection
    await expect(page).toHaveURL(/\/flashcards$/);
    await expect(page.getByRole('heading', { name: '単語カード' })).toBeVisible();
  });

  test('should maintain progress when navigating between pages', async ({ page }) => {
    // Learn a flashcard
    await page.goto('/flashcards/numbers');
    await page.waitForLoadState('networkidle');

    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await expect(knowButton).toBeVisible({ timeout: 10000 });
    await knowButton.click();
    await page.waitForTimeout(300);

    // Navigate to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get XP value from home page progress display
    const xpElement = page.locator('text=/\\d+ XP/').first();
    await expect(xpElement).toBeVisible({ timeout: 10000 });
    const xpText = await xpElement.textContent();
    const xp = parseInt(xpText?.match(/\d+/)?.[0] || '0');

    // Navigate to progress page
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify same XP is shown on progress page
    const progressXpContainer = page.locator('text=/総経験値/').locator('..');
    const progressXpElement = progressXpContainer.locator('.text-3xl').first();
    await expect(progressXpElement).toBeVisible({ timeout: 10000 });
    const progressXpText = await progressXpElement.textContent();
    const progressXp = parseInt(progressXpText || '0');

    expect(progressXp).toBe(xp);
  });
});
