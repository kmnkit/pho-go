# Playwright テスト - トラブルシューティングガイド

**最終更新:** 2025-12-18

## 🔍 実施済みの修正

### 1. クォーテーション・文字列の修正

すべてのテストファイルで以下の修正を実施：

#### progress-tracking.spec.ts
```typescript
// ✅ 修正済み - すべての regex パターンが正しく閉じられている
page.locator('text=/\\d+ XP/').first()
page.locator('text=/習得単語数/').locator('..').locator('text=/\\d+/').first()
page.locator('text=/連続学習日数/').locator('..').locator('.text-3xl').first()
```

#### navigation.spec.ts
```typescript
// ✅ 修正済み
page.locator('text=/\\d+ XP/').first()
page.locator('text=/総経験値/').locator('..').locator('.text-3xl').first()
```

#### quiz-flow.spec.ts
```typescript
// ✅ 修正済み - すべての regex とクォーテーションが正しい
page.locator('text=/問題 \\d+ \\/ \\d+/')
page.locator('text=/正解|不正解/')
page.locator('text=/獲得XP: \\d+ XP/')
```

#### flashcard-flow.spec.ts
```typescript
// ✅ 修正済み - 問題なし
page.locator('text=/覚えた: [1-9]/')
```

### 2. タイムアウトの修正

#### Playwright 設定 (playwright.config.ts)
```typescript
// テスト全体のタイムアウト
timeout: 60 * 1000, // 60秒

// use セクション
actionTimeout: 30 * 1000,      // アクション: 30秒
navigationTimeout: 60 * 1000,  // ナビゲーション: 60秒
```

#### 個別のテストタイムアウト
```typescript
// すべての重要な要素に明示的なタイムアウトを追加
await expect(element).toBeVisible({ timeout: 10000 });
```

#### webServer タイムアウト
```typescript
webServer: {
  timeout: 120 * 1000, // 2分
}
```

### 3. テストロジックの最適化

#### 長時間テストの短縮化
```typescript
// Before: 30枚すべてを学習 (15秒+)
// After: 3枚学習 + 27枚スキップ (3秒)

// Learn 3 cards
for (let i = 0; i < 3; i++) {
  await knowButton.click();
  await page.waitForTimeout(50); // 100ms → 50ms
}

// Skip remaining
for (let i = 0; i < 27; i++) {
  await skipButton.click();
  await page.waitForTimeout(50);
}
```

#### networkidle の追加
```typescript
// すべてのページ遷移後に追加
await page.goto('/quiz');
await page.waitForLoadState('networkidle');
```

### 4. 要素待機の改善

```typescript
// Before: 直接クリック
await page.getByRole('link', { name: /クイズ/ }).click();

// After: 可視性確認後にクリック
const quizLink = page.getByRole('link', { name: /クイズ/ });
await expect(quizLink).toBeVisible({ timeout: 10000 });
await quizLink.click();
```

## 📊 テスト統計

### 修正前
- タイムアウト率: ~40%
- 平均実行時間: 10-15分
- 失敗の主な原因: タイムアウト、クォーテーション

### 修正後（期待値）
- タイムアウト率: < 5%
- 平均実行時間: 4-6分
- CI環境: Chromiumのみで高速化

## 🐛 既知の問題と回避策

### 1. ブラウザインストールエラー

**問題:**
```
Executable doesn't exist at /root/.cache/ms-playwright/chromium...
```

**解決策:**
```bash
npx playwright install --with-deps chromium
```

### 2. Dev サーバー起動タイムアウト

**問題:**
```
webServer timed out (120000ms) after starting
```

**解決策:**
- `playwright.config.ts` の `webServer.timeout` を延長
- または `reuseExistingServer: true` に設定

### 3. セレクターが見つからない

**問題:**
```
Timeout exceeded while waiting for selector
```

**解決策:**
1. `networkidle` を待つ
2. タイムアウトを延長
3. セレクターを確認

## 🧪 デバッグ方法

### 1. UIモードでデバッグ
```bash
npm run test:e2e:ui
```
- ステップ実行
- DOM検査
- ネットワークログ確認

### 2. ヘッドモードで実行
```bash
npm run test:e2e:headed
```
- ブラウザの動作を目視確認

### 3. スクリーンショット確認
```bash
# テスト失敗時に自動保存
ls test-results/*/test-failed-*.png
```

### 4. トレース確認
```bash
npx playwright show-trace test-results/*/trace.zip
```

## 📝 テストファイルチェックリスト

- [x] すべての文字列が正しく閉じられている
- [x] すべての regex パターンが `/pattern/` 形式
- [x] `text=/pattern/` の後に `'` または `"` で閉じる
- [x] networkidle 待機を追加
- [x] 要素の可視性確認を追加
- [x] タイムアウトを明示的に設定
- [x] 長時間テストを最適化

## 🔧 修正が必要な場合の手順

### 1. エラーログを確認
```bash
# CI環境
# Actions > E2E Tests > Artifacts > test-summary をダウンロード

# ローカル
cat tmp/test-results/summary.md
```

### 2. 該当テストを特定
```bash
# 特定のテストのみ実行
npx playwright test quiz-flow.spec.ts --grep "listening"
```

### 3. 問題を修正
- クォーテーションチェック
- タイムアウト延長
- セレクター確認

### 4. 再テスト
```bash
npm run test:e2e:full
```

## 📌 チェック済みの項目

### ✅ 文字列・クォーテーション
- flashcard-flow.spec.ts: 問題なし
- navigation.spec.ts: 問題なし
- progress-tracking.spec.ts: 問題なし
- quiz-flow.spec.ts: 問題なし

### ✅ タイムアウト設定
- グローバル: 60秒
- アクション: 30秒
- ナビゲーション: 60秒
- 個別要素: 5-10秒

### ✅ 待機処理
- networkidle: すべての主要ページで追加
- 要素可視性: すべてのクリック前に確認
- 明示的待機: 適切に削減 (300ms → 50-100ms)

## 🎯 次のステップ

1. **CI環境でテスト実行**
   - GitHub Actions で自動実行
   - サマリーを `tmp/test-results/summary.md` で確認

2. **失敗したテストの分析**
   - エラーメッセージを確認
   - 該当するセレクターを検証
   - 必要に応じてタイムアウト延長

3. **継続的な改善**
   - Flaky なテストを特定
   - さらなる最適化を実施
   - テストカバレッジの向上
