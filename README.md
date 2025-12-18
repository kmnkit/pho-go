# 🇻🇳 Việt Pocket

日本のビジネスパーソン向けのベトナム語学習Webアプリケーションです。ゲーミフィケーション要素を取り入れ、楽しくベトナム語の基礎を習得できます。

## ✨ 主な機能

### 📖 学習コンテンツ
- **アルファベット学習**: ベトナム語の29文字を音声付きで学習
- **声調学習**: 6つの声調パターンをクイズ形式で習得
- **フラッシュカード**: カテゴリー別の単語カード（挨拶、数字、日常会話、食べ物、ビジネス）
- **クイズシステム**: 3種類のクイズモード（日本語→ベトナム語、ベトナム語→日本語、リスニング）

### 🎮 ゲーミフィケーション
- **経験値システム**: 学習でXPを獲得（フラッシュカード: 10XP、クイズ正解: 5XP）
- **レベルシステム**: 100XP = 1レベル
- **連続学習記録**: 毎日の学習でストリークを維持
- **学習統計**: 進捗状況、カテゴリー別達成率、学習時間を可視化

### 📊 進捗管理
- 習得単語数のトラッキング
- カテゴリー別の進捗バー
- 最近の学習セッション履歴
- 次の目標の提示

## 🚀 開発環境のセットアップ

### 前提条件
- Node.js 20以上
- npm

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/kmnkit/pho-go.git
cd pho-go

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集してNEXTAUTH_SECRETを設定
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# 👆 この出力をNEXTAUTH_SECRETとして使用

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

> **📖 詳細なセットアップガイド**: Google OAuth、データベース設定、デプロイ方法などの詳細は [SETUP.md](./SETUP.md) を参照してください。

## 📦 スクリプト

```bash
# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start

# リント
npm run lint

# 型チェック
npm run type-check

# E2Eテストの実行
npm run test:e2e

# E2EテストUIモード
npm run test:e2e:ui
```

## 🧪 テスト

E2E テストには Playwright を使用しています。詳細は [e2e/README.md](./e2e/README.md) を参照してください。

```bash
# Playwrightブラウザのインストール
npx playwright install

# 全E2Eテストを実行
npm run test:e2e

# UIモードで実行（推奨）
npm run test:e2e:ui
```

## 🏗️ 技術スタック

- **フレームワーク**: [Next.js 14](https://nextjs.org/) (App Router)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/)
- **状態管理**: [Zustand](https://github.com/pmndrs/zustand)
- **音声再生**: [Howler.js](https://howlerjs.com/)
- **テスト**: [Playwright](https://playwright.dev/)
- **デプロイ**: [Vercel](https://vercel.com/)

## 📁 プロジェクト構造

```
pho-go/
├── src/
│   ├── app/                  # Next.js App Router ページ
│   │   ├── flashcards/      # フラッシュカード機能
│   │   ├── quiz/            # クイズ機能
│   │   ├── learn/           # アルファベット・声調学習
│   │   └── progress/        # 学習統計ページ
│   ├── components/          # 共通コンポーネント
│   ├── data/                # 学習データ（JSON）
│   ├── lib/                 # ユーティリティ・フック
│   ├── stores/              # Zustand ストア
│   └── types/               # TypeScript型定義
├── e2e/                     # E2Eテスト
├── public/                  # 静的ファイル
└── playwright.config.ts     # Playwrightテスト設定
```

## 🌐 デプロイ

このアプリケーションは Vercel にデプロイされています。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kmnkit/pho-go)

### デプロイ手順

```bash
# Vercel CLIのインストール
npm install -g vercel

# デプロイ
vercel

# プロダクションデプロイ
vercel --prod
```

## 📝 学習データ

アプリには以下のコンテンツが含まれています:

- **アルファベット**: 29文字
- **声調**: 6種類
- **単語**: 200語
  - 挨拶: 30語
  - 数字: 30語
  - 日常会話: 50語
  - 食べ物: 40語
  - ビジネス: 50語

## 🔄 CI/CD

GitHub Actions で自動的にE2Eテストが実行されます。

- `main`, `develop`, `claude/**` ブランチへのプッシュ時
- プルリクエスト作成時

## 🛣️ ロードマップ

- [x] MVP実装（フラッシュカード、クイズ、統計）
- [x] E2Eテスト導入
- [ ] パフォーマンス最適化（Lighthouse 90+）
- [ ] アクセシビリティ改善
- [ ] ダークモード対応
- [ ] ソーシャル共有機能
- [ ] バックエンド統合（Supabase）
- [ ] ユーザー認証
- [ ] データ同期（複数デバイス対応）
- [ ] PWA対応（オフライン学習）
- [ ] 音声ファイル統合

## 📄 ライセンス

MIT

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を加える場合は、まずissueを開いて変更内容について議論してください。
