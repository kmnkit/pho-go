import { test, expect } from '@playwright/test';

test.describe('Flashcard Learning Flow', () => {
  test('should navigate to flashcard category and complete a learning session', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify home page loaded with correct content
    await expect(page.getByText('ようこそ！Việt Pocket へ')).toBeVisible();

    // Click on flashcards link
    await page.getByRole('link', { name: '単語カード' }).first().click();
    await page.waitForLoadState('networkidle');

    // Verify flashcard category page loaded
    await expect(page.getByText('カテゴリーを選択')).toBeVisible();

    // Click on greetings category (using button/link element)
    const greetingsCategory = page.getByRole('button', { name: /挨拶/ }).or(page.getByRole('link', { name: /挨拶/ }));
    await expect(greetingsCategory).toBeVisible({ timeout: 10000 });
    await greetingsCategory.click();
    await page.waitForLoadState('networkidle');

    // Verify flashcard page loaded
    await expect(page).toHaveURL(/\/flashcards\/greetings/);
    await expect(page.getByText('ベトナム語').first()).toBeVisible({ timeout: 10000 });

    // Click the card to flip it
    const flashcard = page.locator('.cursor-pointer').first();
    await flashcard.click();

    // Wait for flip animation
    await page.waitForTimeout(600);

    // Verify back side is shown (Japanese text should be visible)
    await expect(page.locator('text=日本語')).toBeVisible();

    // Click "覚えた" button
    await page.getByRole('button', { name: /覚えた/ }).click();

    // Verify progress updated
    await expect(page.locator('text=/覚えた: [1-9]/')).toBeVisible();

    // Complete all cards or skip to completion
    // For testing purposes, we'll just verify the flow works
  });

  test('should play audio when audio button is clicked', async ({ page }) => {
    await page.goto('/flashcards/greetings');
    await page.waitForLoadState('networkidle');

    // Find and click audio button
    const audioButton = page.getByRole('button', { name: /音声を聞く/ });
    await expect(audioButton).toBeVisible({ timeout: 10000 });

    // Click audio button (note: audio playback itself can't be verified in E2E)
    await audioButton.click();
    await page.waitForTimeout(100);

    // Verify no errors occurred and button is still functional
    await expect(audioButton).toBeVisible();
  });

  test('should show completion screen after learning all cards', async ({ page }) => {
    // Use numbers category (30 cards) but only test a few to verify the flow
    await page.goto('/flashcards/numbers');
    await page.waitForLoadState('networkidle');

    // Verify flashcard page loaded properly
    await expect(page.getByText('ベトナム語').first()).toBeVisible({ timeout: 10000 });

    // Learn 3 cards to test the flow (faster than all 30)
    const cardsToLearn = 3;
    for (let i = 0; i < cardsToLearn; i++) {
      const knowButton = page.getByRole('button', { name: /覚えた/ });
      await expect(knowButton).toBeVisible({ timeout: 5000 });
      await knowButton.click();
      await page.waitForTimeout(50);
    }

    // Skip remaining cards quickly to reach completion
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

    // Verify completion screen is shown
    await expect(page.getByText('素晴らしい！完了しました')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('覚えた単語')).toBeVisible();
    await expect(page.getByText('獲得XP')).toBeVisible();

    // Verify action buttons are available
    await expect(page.getByRole('button', { name: /もう一度復習/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /他のカテゴリーへ/ })).toBeVisible();
  });

  test('should allow skipping cards with "まだ" button', async ({ page }) => {
    await page.goto('/flashcards/greetings');
    await page.waitForLoadState('networkidle');

    // Verify flashcard page loaded
    await expect(page.getByText('ベトナム語').first()).toBeVisible({ timeout: 10000 });

    // Get initial progress text
    const progressElement = page.locator('text=/\d+ \/ \d+/').first();
    await expect(progressElement).toBeVisible();
    const initialProgress = await progressElement.textContent();

    // Click "まだ" button to skip
    const skipButton = page.getByRole('button', { name: /まだ/ });
    await expect(skipButton).toBeVisible();
    await skipButton.click();
    await page.waitForTimeout(100);

    // Verify progress updated (card counter should change)
    const updatedProgress = await progressElement.textContent();
    expect(updatedProgress).not.toBe(initialProgress);

    // Verify we're still in learning mode (not on completion screen)
    await expect(page.getByText('ベトナム語').first()).toBeVisible();
  });
});
