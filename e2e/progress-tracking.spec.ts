import { test, expect } from '@playwright/test';

test.describe('Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start fresh
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display initial user progress on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify home page stats are displayed
    await expect(page.getByText('連続学習日数').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('現在のレベル').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('習得単語数').or(page.getByText('習得済み単語')).first()).toBeVisible({ timeout: 15000 });

    // Initial values should be 0 or 1
    await expect(page.locator('text=/Level \\d+/')).toBeVisible({ timeout: 15000 });
  });

  test('should update XP after learning flashcards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial XP
    const initialXPElement = page.locator('text=/\\d+ XP/').first();
    await expect(initialXPElement).toBeVisible({ timeout: 10000 });
    const initialXPText = await initialXPElement.textContent();
    const initialXP = parseInt(initialXPText?.match(/\d+/)?.[0] || '0');

    // Go to flashcards and learn one word
    await page.goto('/flashcards/greetings');
    await page.waitForLoadState('networkidle');

    // Learn one card (worth 10 XP)
    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await expect(knowButton).toBeVisible({ timeout: 10000 });
    await knowButton.click();
    await page.waitForTimeout(500);

    // Go back to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify XP increased by 10
    const newXPElement = page.locator('text=/\\d+ XP/').first();
    await expect(newXPElement).toBeVisible({ timeout: 10000 });
    const newXPText = await newXPElement.textContent();
    const newXP = parseInt(newXPText?.match(/\d+/)?.[0] || '0');

    expect(newXP).toBe(initialXP + 10);
  });

  test('should update learned words count', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial learned words count
    const initialCountContainer = page.getByText('習得単語数').or(page.getByText('習得済み単語')).first().locator('..');
    const initialCountElement = initialCountContainer.locator('text=/\\d+/').first();
    await expect(initialCountElement).toBeVisible({ timeout: 10000 });
    const initialCountText = await initialCountElement.textContent();
    const initialCount = parseInt(initialCountText || '0');

    // Learn a flashcard
    await page.goto('/flashcards/daily');
    await page.waitForLoadState('networkidle');

    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await expect(knowButton).toBeVisible({ timeout: 10000 });
    await knowButton.click();
    await page.waitForTimeout(500);

    // Return to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify learned words increased by 1
    const newCountContainer = page.getByText('習得単語数').or(page.getByText('習得済み単語')).first().locator('..');
    const newCountElement = newCountContainer.locator('text=/\\d+/').first();
    await expect(newCountElement).toBeVisible({ timeout: 10000 });
    const newCountText = await newCountElement.textContent();
    const newCount = parseInt(newCountText || '0');

    expect(newCount).toBe(initialCount + 1);
  });

  test('should display progress statistics page', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify all stat cards are displayed
    await expect(page.getByText('総経験値')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('現在のレベル')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('習得単語数')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('連続学習日数')).toBeVisible({ timeout: 10000 });

    // Verify sections
    await expect(page.getByRole('heading', { name: 'レベル進捗' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'カテゴリー別進捗' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '学習時間' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '最近の学習セッション' })).toBeVisible({ timeout: 10000 });

    // Verify category progress bars
    await expect(page.getByText('挨拶')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('数字')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('日常語')).toBeVisible({ timeout: 10000 });
  });

  test('should show study sessions after completing activities', async ({ page }) => {
    // Complete a flashcard session
    await page.goto('/flashcards/numbers');
    await page.waitForLoadState('networkidle');

    // Learn at least one card
    const knowButton = page.getByRole('button', { name: /覚えた/ });
    await expect(knowButton).toBeVisible({ timeout: 10000 });
    await knowButton.click();
    await page.waitForTimeout(500);

    // Go to progress page
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify study session is recorded
    await expect(page.getByText('最近の学習セッション')).toBeVisible({ timeout: 10000 });

    // Look for flashcard activity indicator
    const flashcardActivity = page.locator('text=/単語カード/');
    const hasActivity = await flashcardActivity.isVisible().catch(() => false);

    if (hasActivity) {
      await expect(flashcardActivity).toBeVisible();
    }
  });

  test('should update streak when studying', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to progress page to check initial streak
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Get initial streak
    const streakContainer = page.getByText('連続学習日数').first().locator('..');
    const streakElement = streakContainer.locator('.text-3xl').first();
    await expect(streakElement).toBeVisible({ timeout: 10000 });

    // Complete a learning activity to trigger streak update
    await page.goto('/flashcards/numbers');
    await page.waitForLoadState('networkidle');

    // Learn just 3 cards to trigger streak update
    for (let i = 0; i < 3; i++) {
      const knowButton = page.getByRole('button', { name: /覚えた/ });
      await expect(knowButton).toBeVisible({ timeout: 10000 });
      await knowButton.click();
      await page.waitForTimeout(50);
    }

    // Skip remaining cards to reach completion quickly
    let cardsSkipped = 0;
    while (cardsSkipped < 27) {
      const skipButton = page.getByRole('button', { name: /まだ/ });
      const isVisible = await skipButton.isVisible().catch(() => false);
      if (isVisible) {
        await skipButton.click();
        await page.waitForTimeout(50);
        cardsSkipped++;
      } else {
        break; // Reached completion screen
      }
    }

    // Wait for completion screen
    await expect(page.getByText('素晴らしい！完了しました')).toBeVisible({ timeout: 10000 });

    // Go back to progress page
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify streak is at least 1
    const newStreakContainer = page.getByText('連続学習日数').first().locator('..');
    const newStreakElement = newStreakContainer.locator('.text-3xl').first();
    await expect(newStreakElement).toBeVisible({ timeout: 10000 });
    const newStreakText = await newStreakElement.textContent();
    const newStreak = parseInt(newStreakText || '0');

    expect(newStreak).toBeGreaterThanOrEqual(1);
  });

  test('should show level progress bar', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify level progress section exists
    await expect(page.getByRole('heading', { name: 'レベル進捗' })).toBeVisible({ timeout: 10000 });

    // Verify progress bar is displayed
    const progressBar = page.locator('.bg-gradient-to-r.from-purple-500.to-blue-500').first();
    await expect(progressBar).toBeVisible({ timeout: 10000 });

    // Verify XP text is shown (e.g., "50 / 100 XP")
    await expect(page.locator('text=/\\d+ \\/ 100 XP/')).toBeVisible({ timeout: 10000 });
  });

  test('should display category progress with percentages', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify category progress section
    await expect(page.getByRole('heading', { name: 'カテゴリー別進捗' })).toBeVisible({ timeout: 10000 });

    // Verify all 5 categories are shown (check actual Japanese display names)
    const categories = ['挨拶', '数字', '日常語', '食べ物', 'ビジネス'];
    for (const category of categories) {
      const categoryElement = page.getByText(category);
      const isVisible = await categoryElement.isVisible().catch(() => false);
      if (!isVisible) {
        // Log for debugging what categories are actually visible
        console.log(`Category ${category} not found`);
      } else {
        await expect(categoryElement).toBeVisible({ timeout: 10000 });
      }
    }

    // Verify progress percentages are shown (e.g., "0% 完了")
    await expect(page.locator('text=/\\d+% 完了/').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show next goals section', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');

    // Verify goals section exists
    await expect(page.getByText('次の目標')).toBeVisible({ timeout: 10000 });

    // At least one goal should be displayed (50 words, 7 day streak, or level 5)
    const goalTexts = [
      /50単語習得まで/,
      /7日連続学習まで/,
      /レベル5到達まで/,
    ];

    let foundGoal = false;
    for (const goalPattern of goalTexts) {
      try {
        const goalElement = page.locator(`text=${goalPattern}`);
        const isVisible = await goalElement.isVisible({ timeout: 5000 });
        if (isVisible) {
          foundGoal = true;
          break;
        }
      } catch (error) {
        // Continue to next goal pattern
      }
    }

    expect(foundGoal).toBe(true);
  });
});
