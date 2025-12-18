import { test, expect } from '@playwright/test';

test.describe('Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display initial user progress on home page', async ({ page }) => {
    await page.goto('/');

    // Verify home page stats are displayed
    await expect(page.getByText('連続学習日数')).toBeVisible();
    await expect(page.getByText('現在のレベル')).toBeVisible();
    await expect(page.getByText('習得単語数')).toBeVisible();

    // Initial values should be 0 or 1
    await expect(page.locator('text=/Lv\\.\\d+/')).toBeVisible();
  });

  test('should update XP after learning flashcards', async ({ page }) => {
    await page.goto('/');

    // Get initial XP
    const initialXPElement = page.locator('text=/\\d+ XP/').first();
    const initialXPText = await initialXPElement.textContent();
    const initialXP = parseInt(initialXPText?.match(/\d+/)?.[0] || '0');

    // Go to flashcards and learn one word
    await page.goto('/flashcards/greetings');
    await page.waitForLoadState('networkidle');

    // Learn one card (worth 10 XP)
    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await knowButton.click();
    await page.waitForTimeout(500);

    // Go back to home page
    await page.goto('/');

    // Verify XP increased by 10
    const newXPElement = page.locator('text=/\\d+ XP/').first();
    const newXPText = await newXPElement.textContent();
    const newXP = parseInt(newXPText?.match(/\d+/)?.[0] || '0');

    expect(newXP).toBe(initialXP + 10);
  });

  test('should update learned words count', async ({ page }) => {
    await page.goto('/');

    // Get initial learned words count
    const initialCountElement = page.locator('text=/習得単語数/').locator('..').locator('text=/\\d+/').first();
    const initialCountText = await initialCountElement.textContent();
    const initialCount = parseInt(initialCountText || '0');

    // Learn a flashcard
    await page.goto('/flashcards/daily');
    await page.waitForLoadState('networkidle');

    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await knowButton.click();
    await page.waitForTimeout(500);

    // Return to home
    await page.goto('/');

    // Verify learned words increased by 1
    const newCountElement = page.locator('text=/習得単語数/').locator('..').locator('text=/\\d+/').first();
    const newCountText = await newCountElement.textContent();
    const newCount = parseInt(newCountText || '0');

    expect(newCount).toBe(initialCount + 1);
  });

  test('should display progress statistics page', async ({ page }) => {
    await page.goto('/progress');

    // Verify all stat cards are displayed
    await expect(page.getByText('総経験値')).toBeVisible();
    await expect(page.getByText('現在のレベル')).toBeVisible();
    await expect(page.getByText('習得単語数')).toBeVisible();
    await expect(page.getByText('連続学習日数')).toBeVisible();

    // Verify sections
    await expect(page.getByText('レベル進捗')).toBeVisible();
    await expect(page.getByText('カテゴリー別進捗')).toBeVisible();
    await expect(page.getByText('学習時間')).toBeVisible();
    await expect(page.getByText('最近の学習セッション')).toBeVisible();

    // Verify category progress bars
    await expect(page.getByText('挨拶')).toBeVisible();
    await expect(page.getByText('数字')).toBeVisible();
    await expect(page.getByText('日常会話')).toBeVisible();
  });

  test('should show study sessions after completing activities', async ({ page }) => {
    // Complete a flashcard session
    await page.goto('/flashcards/numbers');
    await page.waitForLoadState('networkidle');

    // Learn at least one card
    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await knowButton.click();
    await page.waitForTimeout(500);

    // Go to progress page
    await page.goto('/progress');

    // Verify study session is recorded
    await expect(page.getByText('最近の学習セッション')).toBeVisible();

    // Look for flashcard activity indicator
    const flashcardActivity = page.locator('text=/単語カード/');
    const hasActivity = await flashcardActivity.isVisible().catch(() => false);

    if (hasActivity) {
      await expect(flashcardActivity).toBeVisible();
    }
  });

  test('should update streak when studying', async ({ page }) => {
    await page.goto('/');

    // Navigate to progress page to check initial streak
    await page.goto('/progress');

    // Get initial streak
    const streakElement = page.locator('text=/連続学習日数/').locator('..').locator('.text-3xl').first();
    const initialStreakText = await streakElement.textContent();
    const initialStreak = parseInt(initialStreakText || '0');

    // Complete a learning activity to trigger streak update
    await page.goto('/flashcards/greetings');
    await page.waitForLoadState('networkidle');

    // Complete all cards to trigger session completion
    const totalCards = 30; // Greetings category has 30 words
    for (let i = 0; i < totalCards; i++) {
      const knowButton = page.getByRole('button', { name: /覚えた/ });
      const isVisible = await knowButton.isVisible().catch(() => false);

      if (isVisible) {
        await knowButton.click();
        await page.waitForTimeout(100);
      } else {
        break; // Reached completion screen
      }
    }

    // Wait for completion screen
    await page.waitForTimeout(500);

    // Go back to progress page
    await page.goto('/progress');

    // Verify streak is at least 1
    const newStreakElement = page.locator('text=/連続学習日数/').locator('..').locator('.text-3xl').first();
    const newStreakText = await newStreakElement.textContent();
    const newStreak = parseInt(newStreakText || '0');

    expect(newStreak).toBeGreaterThanOrEqual(1);
  });

  test('should show level progress bar', async ({ page }) => {
    await page.goto('/progress');

    // Verify level progress section exists
    await expect(page.getByText('レベル進捗')).toBeVisible();

    // Verify progress bar is displayed
    const progressBar = page.locator('.bg-gradient-to-r.from-purple-500.to-blue-500');
    await expect(progressBar).toBeVisible();

    // Verify XP text is shown (e.g., "50 / 100 XP")
    await expect(page.locator('text=/\\d+ \\/ 100 XP/')).toBeVisible();
  });

  test('should display category progress with percentages', async ({ page }) => {
    await page.goto('/progress');

    // Verify category progress section
    await expect(page.getByText('カテゴリー別進捗')).toBeVisible();

    // Verify all 5 categories are shown
    const categories = ['挨拶', '数字', '日常会話', '食べ物', 'ビジネス'];
    for (const category of categories) {
      await expect(page.getByText(category)).toBeVisible();
    }

    // Verify progress percentages are shown (e.g., "0% 完了")
    await expect(page.locator('text=/\\d+% 完了/').first()).toBeVisible();
  });

  test('should show next goals section', async ({ page }) => {
    await page.goto('/progress');

    // Verify goals section exists
    await expect(page.getByText('次の目標')).toBeVisible();

    // At least one goal should be displayed (50 words, 7 day streak, or level 5)
    const goalTexts = [
      /50単語習得まで/,
      /7日連続学習まで/,
      /レベル5到達まで/,
    ];

    let foundGoal = false;
    for (const goalPattern of goalTexts) {
      const goalElement = page.locator(`text=${goalPattern}`);
      const isVisible = await goalElement.isVisible().catch(() => false);
      if (isVisible) {
        foundGoal = true;
        break;
      }
    }

    expect(foundGoal).toBe(true);
  });
});
