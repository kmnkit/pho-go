# Supabase セットアップガイド

このガイドでは、Việt Pocket アプリに Supabase を統合するための手順を説明します。

## 📋 前提条件

- Node.js 18+ がインストールされている
- Supabase アカウント（[supabase.com](https://supabase.com) で無料作成可能）
- Git がインストールされている

---

## 🚀 セットアップ手順

### Step 1: Supabase プロジェクトの作成

1. [Supabase ダッシュボード](https://app.supabase.com)にアクセス
2. "New Project" をクリック
3. プロジェクト情報を入力：
   - **Name**: `viet-pocket` (任意の名前)
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` を推奨
4. "Create new project" をクリック（数分かかります）

### Step 2: 環境変数の設定

1. Supabase ダッシュボードで作成したプロジェクトを開く
2. 左サイドバーから **Settings** → **API** を選択
3. 以下の情報をコピー：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbGc...` (長い文字列)
   - **service_role**: `eyJhbGc...` (長い文字列、秘密に保つ！)

4. プロジェクトルートに `.env.local` ファイルを作成：

```bash
cp .env.local.example .env.local
```

5. `.env.local` を編集して、コピーした値を設定：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...（anon public の値）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...（service_role の値）
```

**⚠️ 重要**: `SUPABASE_SERVICE_ROLE_KEY` は絶対にクライアントサイドコードで使用しないでください！

### Step 3: データベーススキーマの適用

#### 方法 A: Supabase Dashboard から適用（推奨）

1. Supabase ダッシュボードで **SQL Editor** を開く
2. `supabase/migrations/20251219000001_initial_schema.sql` の内容をコピー
3. SQL Editor に貼り付けて "Run" をクリック
4. エラーがないことを確認

#### 方法 B: Supabase CLI を使用（上級者向け）

```bash
# Supabase CLI のインストール
npm install -g supabase

# Supabase プロジェクトにリンク
supabase link --project-ref xxx

# マイグレーションの適用
supabase db push
```

### Step 4: 認証設定

1. Supabase ダッシュボードで **Authentication** → **Settings** を開く

2. **Site URL** を設定：
   - 開発環境: `http://localhost:3000`
   - 本番環境: `https://your-domain.com`

3. **Redirect URLs** を追加：
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback` (本番用)

4. **Email Templates** を確認（オプション）
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### Step 5: OAuth プロバイダーの設定（オプション）

#### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
2. OAuth 2.0 クライアント ID を作成
3. **承認済みのリダイレクト URI** に追加：
   ```
   https://xxx.supabase.co/auth/v1/callback
   ```
4. Supabase ダッシュボードの **Authentication** → **Providers** → **Google** で有効化
5. Client ID と Client Secret を入力

#### GitHub OAuth

1. [GitHub Developer Settings](https://github.com/settings/developers) で OAuth App を作成
2. **Authorization callback URL**:
   ```
   https://xxx.supabase.co/auth/v1/callback
   ```
3. Supabase ダッシュボードの **Authentication** → **Providers** → **GitHub** で有効化
4. Client ID と Client Secret を入力

### Step 6: 必要なパッケージのインストール

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Step 7: 動作確認

開発サーバーを起動：

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いて動作確認。

---

## 🧪 データベース接続のテスト

Supabase が正しく設定されているか確認するため、簡単なテストを実行します。

### テストコード（一時的）

`src/app/test-supabase/page.tsx` を作成：

```typescript
import { createServerClient } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
  const supabase = createServerClient()

  // データベース接続テスト
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1)

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">
          ❌ Supabase Connection Failed
        </h1>
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">
        ✅ Supabase Connected Successfully!
      </h1>
      <p className="mt-4">Database is accessible and ready to use.</p>
    </div>
  )
}
```

`http://localhost:3000/test-supabase` にアクセスして確認。

成功したら、テストページを削除してください。

---

## 📊 データベース構造の確認

Supabase ダッシュボードの **Table Editor** で以下のテーブルが作成されていることを確認：

### users テーブル
- `id` (uuid, primary key)
- `email` (text)
- `display_name` (text)
- `avatar_url` (text, nullable)
- `preferred_language` (text: 'ja' | 'vi')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### user_progress テーブル
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `learned_words` (text[])
- `current_level` (integer)
- `experience_points` (integer)
- `streak_days` (integer)
- `last_study_date` (date)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### study_sessions テーブル
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `session_date` (timestamptz)
- `duration_minutes` (integer)
- `words_practiced` (integer)
- `words_learned` (integer)
- `quiz_score` (integer, nullable)
- `activity_type` (text)
- `xp_earned` (integer)
- `created_at` (timestamptz)

---

## 🔒 Row Level Security (RLS) の確認

**Database** → **Tables** → テーブル選択 → **Policies** タブで、各テーブルに以下のポリシーが設定されていることを確認：

### users テーブル
- ✅ Users can view own profile
- ✅ Users can update own profile
- ✅ Users can insert own profile

### user_progress テーブル
- ✅ Users can view own progress
- ✅ Users can update own progress
- ✅ Users can insert own progress

### study_sessions テーブル
- ✅ Users can view own sessions
- ✅ Users can insert own sessions

---

## 🛠️ トラブルシューティング

### エラー: "Failed to fetch"

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. `.env.local` ファイルが存在することを確認
2. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しく設定されているか確認
3. 開発サーバーを再起動: `npm run dev`

### エラー: "Row Level Security policy violation"

**原因**: RLS ポリシーが正しく設定されていない

**解決策**:
1. Supabase ダッシュボードで **Table Editor** → テーブル選択 → **Policies** を確認
2. マイグレーション SQL を再実行

### エラー: "relation does not exist"

**原因**: テーブルが作成されていない

**解決策**:
1. Supabase ダッシュボードの **SQL Editor** でマイグレーション SQL を実行
2. **Table Editor** でテーブルが存在することを確認

### データベース接続が遅い

**原因**: リージョンが遠い

**解決策**:
1. Supabase プロジェクトを Tokyo リージョンで再作成
2. または、Vercel のデプロイリージョンを Tokyo に設定

---

## 📚 次のステップ

セットアップが完了したら：

1. **認証機能の実装**: `docs/SUPABASE_SPECIFICATION.md` の Phase 2 を参照
2. **データ同期の実装**: Phase 3 を参照
3. **既存データの移行**: Phase 3 のマイグレーションツールを使用

---

## 🔗 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**最終更新**: 2025-12-19
**バージョン**: 1.0
