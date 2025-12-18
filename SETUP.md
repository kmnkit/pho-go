# Việt Pocket - セットアップガイド

このドキュメントでは、開発環境とプロダクション環境のセットアップ方法を説明します。

## 目次

1. [基本セットアップ](#基本セットアップ)
2. [Google OAuth設定（オプション）](#google-oauth設定)
3. [データベース設定（オプション）](#データベース設定)
4. [GitHub Actions設定](#github-actions設定)
5. [Vercelデプロイ設定](#vercelデプロイ設定)

---

## 基本セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/kmnkit/pho-go.git
cd pho-go
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成します：

```bash
cp .env.local.example .env.local
```

**最小限の設定（ローカル開発用）:**

```env
# NextAuth.js（必須）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
AUTH_SECRET=your-generated-secret-here
```

**シークレットの生成方法:**

```bash
# ランダムな32文字以上のシークレットを生成
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. アプリケーションの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

---

## Google OAuth設定

Google認証を使用する場合のセットアップ手順です。

### 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（例: `viet-pocket`）
3. プロジェクトを選択

### 2. OAuth同意画面の設定

1. **APIとサービス** → **OAuth同意画面** に移動
2. **外部** を選択して作成
3. 必須項目を入力:
   - **アプリ名**: Việt Pocket
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス
4. **保存して次へ**

### 3. スコープの追加（オプション）

1. **スコープを追加または削除** をクリック
2. 以下のスコープを追加:
   - `userinfo.email`
   - `userinfo.profile`
3. **保存して次へ**

### 4. OAuth 2.0 クライアントIDの作成

1. **認証情報** タブに移動
2. **認証情報を作成** → **OAuth クライアント ID** を選択
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 名前: `Việt Pocket Web Client`
5. **承認済みのリダイレクト URI** を追加:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.com/api/auth/callback/google
   ```
6. **作成** をクリック

### 5. 認証情報を環境変数に追加

作成された**クライアントID**と**クライアントシークレット**をコピーして`.env.local`に追加:

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvw
```

---

## データベース設定

Google OAuthを使用する場合、セッション管理のためにPostgreSQLデータベースが必要です。

### オプション1: Vercel Postgres（推奨）

#### 1. Vercel Postgresの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択
3. **Storage** タブ → **Create Database**
4. **Postgres** を選択
5. データベース名を入力（例: `viet-pocket-db`）
6. リージョンを選択
7. **Create** をクリック

#### 2. 環境変数の取得

Vercelが自動的に以下の環境変数を生成します：
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`

これらを`.env.local`にコピー:

```env
# Database
POSTGRES_URL=postgres://default:xxxxx@xxxx.postgres.vercel-storage.com:5432/verceldb
POSTGRES_URL_NON_POOLING=postgres://default:xxxxx@xxxx.postgres.vercel-storage.com:5432/verceldb
```

#### 3. データベーススキーマのマイグレーション

```bash
# Drizzle ORMでマイグレーション実行
npm run db:push

# または手動でスキーマを適用
npm run db:migrate
```

### オプション2: Neon（無料プラン）

#### 1. Neonアカウント作成

1. [Neon](https://neon.tech/) にアクセス
2. **Sign Up** でアカウント作成（GitHubアカウント推奨）

#### 2. プロジェクト作成

1. **New Project** をクリック
2. プロジェクト名: `viet-pocket`
3. PostgreSQLバージョン: 最新版
4. リージョン: 最も近いリージョンを選択
5. **Create Project** をクリック

#### 3. 接続文字列の取得

1. プロジェクトダッシュボードで **Connection Details** を確認
2. 接続文字列をコピーして`.env.local`に追加:

```env
# Database (Neon)
POSTGRES_URL=postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
```

### オプション3: ローカルPostgreSQL

#### Docker Composeを使用

`docker-compose.yml`を作成:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: vietnamese_words_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

起動:

```bash
docker-compose up -d
```

環境変数:

```env
# Database (Local)
POSTGRES_URL=postgres://admin:password@localhost:5432/vietnamese_words_db
```

---

## GitHub Actions設定

CI/CDパイプラインで必要な環境変数を設定します。

### 1. GitHub Secretsの追加

1. GitHubリポジトリページに移動
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** をクリック
4. 以下のシークレットを追加:

| Name | Value | Required |
|------|-------|----------|
| `NEXTAUTH_SECRET` | 生成したランダム文字列 | ✅ 必須 |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID | ❌ オプション |
| `GOOGLE_CLIENT_SECRET` | Google OAuthシークレット | ❌ オプション |
| `POSTGRES_URL` | データベース接続文字列 | ❌ オプション |

### 2. シークレットの生成例

```bash
# NEXTAUTH_SECRETの生成
openssl rand -base64 32
```

### 3. ワークフローの確認

`.github/workflows/e2e-tests.yml`が環境変数を正しく設定していることを確認:

```yaml
- name: Setup environment variables
  run: |
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
    echo "NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}" >> .env.local
```

---

## Vercelデプロイ設定

### 1. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. **Add New** → **Project**
3. GitHubリポジトリを選択
4. **Import** をクリック

### 2. 環境変数の設定

**Environment Variables** セクションで以下を追加:

#### Production環境

```env
# NextAuth.js
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<生成したシークレット>
AUTH_SECRET=<生成したシークレット>

# Google OAuth（オプション）
GOOGLE_CLIENT_ID=<Google Cloud Consoleで取得>
GOOGLE_CLIENT_SECRET=<Google Cloud Consoleで取得>

# Database（オプション）
POSTGRES_URL=<Vercel PostgresまたはNeonの接続文字列>
```

#### Preview環境

Preview環境でも同じ環境変数を設定（URLは`NEXTAUTH_URL=https://your-domain-*.vercel.app`）

### 3. デプロイ

1. **Deploy** をクリック
2. ビルドが完了するまで待機
3. デプロイされたURLにアクセスして動作確認

---

## トラブルシューティング

### 1. "Missing secret"エラー

**原因**: `NEXTAUTH_SECRET`が設定されていない

**解決策**:
```bash
# .env.localに追加
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# 出力された文字列をNEXTAUTH_SECRETとして設定
```

### 2. データベース接続エラー

**原因**: PostgreSQL URLが無効または接続できない

**解決策**:
- 接続文字列が正しいか確認
- データベースサービスが起動しているか確認
- ファイアウォール設定を確認
- Google OAuth を使用しない場合は環境変数をコメントアウト

### 3. Google OAuth認証エラー

**原因**: リダイレクトURIが正しく設定されていない

**解決策**:
1. Google Cloud Consoleで**承認済みのリダイレクトURI**を確認
2. 以下の形式で追加されているか確認:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.com/api/auth/callback/google
   ```

### 4. ビルドエラー（GitHub Actions）

**原因**: CI環境で環境変数が設定されていない

**解決策**:
- GitHub Secretsに`NEXTAUTH_SECRET`を追加
- `.github/workflows/e2e-tests.yml`が環境変数を設定していることを確認

---

## まとめ

### 必須設定

✅ `.env.local`ファイルの作成
✅ `NEXTAUTH_SECRET`の設定

### オプション設定

❌ Google OAuth（ソーシャルログインが必要な場合）
❌ PostgreSQLデータベース（Google OAuth使用時）

### 開発モードの起動

```bash
npm run dev
```

### プロダクションビルド

```bash
npm run build
npm run start
```

### パフォーマンス分析

```bash
# Bundle size分析
npm run analyze

# Lighthouse測定
npm run lighthouse
```

---

**ご質問やサポートが必要な場合は、GitHubのIssuesでお問い合わせください。**
