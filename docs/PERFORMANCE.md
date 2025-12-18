# パフォーマンス最適化ガイド

このドキュメントでは、ベトナム語学習アプリのパフォーマンス最適化について説明します。

## 🎯 目標

- **Lighthouse スコア**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5秒
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

## 📊 パフォーマンス測定

### Lighthouse の実行

```bash
# 開発サーバーを起動
npm run dev

# 別のターミナルで Lighthouse を実行
npm run lighthouse

# CI 用（JSON出力）
npm run lighthouse:ci
```

### Chrome DevTools

1. F12 でDevToolsを開く
2. Lighthouse タブを選択
3. "Generate report" をクリック

## ✅ 実装済みの最適化

### 1. Next.js 設定最適化 (`next.config.mjs`)

#### Compression
- **gzip圧縮**: 有効化 (`compress: true`)
- **効果**: レスポンスサイズを約70%削減

#### SWC Minification
- **swcMinify**: 有効化
- **効果**: バンドルサイズを約30%削減、ビルド時間を50%短縮

#### Console除去
- **本番環境**: `console.log` を自動除去（error, warnは保持）
- **効果**: バンドルサイズ削減、セキュリティ向上

#### CSS最適化
- **optimizeCss**: 有効化
- **効果**: CSSバンドルサイズを約20%削減

#### パッケージ最適化
- **optimizePackageImports**: `['zustand', 'howler']`
- **効果**: 必要な部分のみをバンドル

### 2. 画像最適化

#### フォーマット
- **AVIF**: 最新フォーマット（サイズ50%削減）
- **WebP**: フォールバック（サイズ30%削減）

#### レスポンシブ画像
- **デバイスサイズ**: [640, 750, 828, 1080, 1200, 1920]
- **画像サイズ**: [16, 32, 48, 64, 96, 128, 256, 384]
- **効果**: デバイスに最適なサイズの画像を配信

### 3. キャッシング戦略

#### 静的アセット (画像)
```http
Cache-Control: public, max-age=31536000, immutable
```
- **1年間キャッシュ**: 画像は変更されないため長期キャッシュ
- **immutable**: ブラウザが再検証しない

#### 学習データ (JSON)
```http
Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200
```
- **ブラウザキャッシュ**: 1時間
- **CDNキャッシュ**: 24時間
- **SWR**: 12時間古いデータを表示しながら再検証

### 4. メタデータ最適化

#### SEO
- **構造化メタデータ**: title, description, keywords
- **Open Graph**: SNS共有対応
- **Twitter Card**: Twitterプレビュー対応
- **robots.txt**: クローラー最適化

#### Viewport
- **レスポンシブ**: device-width
- **拡大縮小**: 1-5倍（アクセシビリティ考慮）
- **テーマカラー**: ブランドカラー (#EF4444)

## 🚀 パフォーマンス最適化のベストプラクティス

### コンポーネントレベル

#### 1. 動的インポート (Code Splitting)

```typescript
// 重いコンポーネントを遅延読み込み
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>読み込み中...</p>,
  ssr: false, // クライアントサイドのみ
});
```

#### 2. React.memo でメモ化

```typescript
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // 重い計算やレンダリング
  return <div>{/* ... */}</div>;
});
```

#### 3. useMemo と useCallback

```typescript
import { useMemo, useCallback } from 'react';

function Component({ items }) {
  // 重い計算をメモ化
  const processedData = useMemo(() => {
    return items.map(item => expensiveOperation(item));
  }, [items]);

  // 関数をメモ化
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <div onClick={handleClick}>{/* ... */}</div>;
}
```

### データ読み込み最適化

#### 1. プリフェッチ

```typescript
// Next.js Link は自動的にプリフェッチ
<Link href="/flashcards" prefetch={true}>
  単語カード
</Link>
```

#### 2. 段階的読み込み

```typescript
// 初期表示に必要なデータのみ読み込む
const [visibleItems, setVisibleItems] = useState(items.slice(0, 10));

// スクロールで追加読み込み
const loadMore = () => {
  setVisibleItems(prev => [...prev, ...items.slice(prev.length, prev.length + 10)]);
};
```

### CSS最適化

#### 1. Tailwind CSS の Purge

```javascript
// tailwind.config.ts
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 未使用のクラスを削除
};
```

#### 2. Critical CSS

- Above-the-fold のスタイルを優先
- 非同期でその他のスタイルを読み込む

### JavaScript最適化

#### 1. バンドルサイズの削減

```bash
# バンドルサイズを分析
npm run build

# 大きな依存関係を確認
npx bundle-analyzer
```

#### 2. Tree Shaking

```typescript
// ❌ 避ける: すべてをインポート
import * as _ from 'lodash';

// ✅ 推奨: 必要な関数のみ
import debounce from 'lodash/debounce';
```

## 📈 パフォーマンス監視

### Web Vitals の追跡

Next.js は自動的に Web Vitals を測定します：

```typescript
// src/app/layout.tsx または独立したコンポーネント
export function reportWebVitals(metric) {
  console.log(metric);

  // Google Analytics などに送信
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
```

### 継続的な監視

#### Vercel Analytics
- 本番環境で自動的にパフォーマンスを追跡
- Real User Monitoring (RUM)
- Core Web Vitals ダッシュボード

#### Lighthouse CI
- GitHub Actions で自動実行
- Pull Request ごとにパフォーマンスをチェック
- レグレッションを防止

## 🔧 トラブルシューティング

### パフォーマンス問題の診断

#### 1. Chrome DevTools Performance タブ
1. 録画開始
2. ページをロード/操作
3. 録画停止
4. フレームレートの低下、長いタスクを確認

#### 2. React DevTools Profiler
1. Profiler タブを開く
2. 録画開始
3. 操作を実行
4. レンダリング時間を確認

### よくある問題と解決策

#### 問題: 大きなバンドルサイズ

**解決策**:
- 動的インポートで Code Splitting
- Tree Shaking を有効化
- 大きな依存関係を軽量な代替に置き換え

#### 問題: 遅いページ読み込み

**解決策**:
- 画像を最適化（WebP/AVIF）
- フォントをプリロード
- Above-the-fold コンテンツを優先
- Suspense で段階的読み込み

#### 問題: 高い CLS (Cumulative Layout Shift)

**解決策**:
- 画像に width/height を指定
- フォント読み込み中のフォールバック
- スケルトンスクリーンを使用
- 広告/動的コンテンツの領域を予約

## 📚 参考リンク

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

## 🎯 今後の最適化予定

- [ ] Service Worker によるオフラインキャッシング (PWA対応時)
- [ ] 音声ファイルの遅延読み込みと圧縮
- [ ] IndexedDB によるローカルキャッシュ最適化
- [ ] Web Workers でバックグラウンド処理
- [ ] HTTP/3 対応（Vercel側）
