# Supabase 認証・データ永続化 仕様書

## 概要

Việt Pocket アプリに Supabase を統合し、ユーザー認証とクラウドベースの学習データ永続化を実装します。

**目的**:
- ユーザーアカウント管理と認証
- 複数デバイス間での学習データ同期
- オフライン対応を維持しながらクラウドバックアップ
- 学習データの長期保存と分析

**実装方針**:
- 既存の Zustand + localStorage の仕組みを維持（オフライン対応）
- Supabase は追加レイヤーとして統合（段階的移行）
- Row Level Security (RLS) で強固なセキュリティ

---

## 1. 認証機能

### 1.1 認証方式

#### サポートする認証方法

1. **Email/Password 認証** (必須)
   - メールアドレスとパスワードでの登録・ログイン
   - メール確認（確認メール送信）
   - パスワードリセット機能

2. **Social 認証** (推奨)
   - Google OAuth
   - GitHub OAuth
   - 将来的に追加: Apple, Facebook

3. **匿名認証** (オプション)
   - 試用ユーザー向け
   - 後で正式アカウントに変換可能

#### 認証フロー

```typescript
// サインアップ
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      display_name: 'ユーザー名',
      preferred_language: 'ja', // or 'vi'
    },
  },
})

// ログイン
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})

// Google でログイン
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})

// ログアウト
const { error } = await supabase.auth.signOut()
```

### 1.2 セッション管理

- **セッション有効期限**: 7日間（デフォルト）
- **リフレッシュトークン**: 自動更新
- **セッション永続化**: localStorage に保存（Supabase が自動処理）

```typescript
// セッション状態の監視
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // ユーザーがログイン
    syncLocalDataToSupabase(session.user.id)
  } else if (event === 'SIGNED_OUT') {
    // ユーザーがログアウト
    clearLocalSensitiveData()
  }
})
```

### 1.3 ユーザープロフィール

```typescript
interface UserProfile {
  id: string                    // Supabase Auth user ID
  email: string
  display_name: string
  avatar_url?: string
  preferred_language: 'ja' | 'vi'
  created_at: string
  updated_at: string
}
```

---

## 2. データベース設計

### 2.1 テーブル構造

#### users テーブル

Supabase Auth と連携するユーザープロフィール拡張テーブル

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'ja' CHECK (preferred_language IN ('ja', 'vi')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 自動更新トリガー
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX users_email_idx ON public.users(email);
```

#### user_progress テーブル

ユーザーの学習進捗データ

```sql
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  learned_words TEXT[] DEFAULT '{}' NOT NULL,  -- 学習済み単語IDの配列
  current_level INTEGER DEFAULT 1 NOT NULL CHECK (current_level > 0),
  experience_points INTEGER DEFAULT 0 NOT NULL CHECK (experience_points >= 0),
  streak_days INTEGER DEFAULT 0 NOT NULL CHECK (streak_days >= 0),
  last_study_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 1ユーザー1レコードの制約
  UNIQUE(user_id)
);

-- インデックス
CREATE INDEX user_progress_user_id_idx ON public.user_progress(user_id);
CREATE INDEX user_progress_last_study_date_idx ON public.user_progress(last_study_date);

-- 自動更新トリガー
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### study_sessions テーブル

学習セッション履歴

```sql
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  words_practiced INTEGER NOT NULL CHECK (words_practiced >= 0),
  words_learned INTEGER DEFAULT 0 NOT NULL CHECK (words_learned >= 0),
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('flashcard', 'quiz', 'learning')),
  xp_earned INTEGER DEFAULT 0 NOT NULL CHECK (xp_earned >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックス
CREATE INDEX study_sessions_user_id_idx ON public.study_sessions(user_id);
CREATE INDEX study_sessions_session_date_idx ON public.study_sessions(session_date);
CREATE INDEX study_sessions_activity_type_idx ON public.study_sessions(activity_type);

-- 複合インデックス（ユーザー別の日付範囲クエリ用）
CREATE INDEX study_sessions_user_date_idx ON public.study_sessions(user_id, session_date DESC);
```

### 2.2 RLS (Row Level Security) ポリシー

全てのテーブルで RLS を有効化し、ユーザーは自分のデータのみアクセス可能にします。

```sql
-- RLS 有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- users テーブルのポリシー
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- user_progress テーブルのポリシー
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- study_sessions テーブルのポリシー
CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- study_sessions は更新・削除不可（監査目的）
```

### 2.3 データベース関数

#### update_updated_at_column 関数

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### get_user_stats 関数

ユーザー統計を効率的に取得

```sql
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sessions', COUNT(*),
    'total_duration_minutes', COALESCE(SUM(duration_minutes), 0),
    'total_words_practiced', COALESCE(SUM(words_practiced), 0),
    'total_xp_earned', COALESCE(SUM(xp_earned), 0),
    'average_quiz_score', COALESCE(AVG(quiz_score), 0),
    'sessions_last_7_days', COUNT(*) FILTER (WHERE session_date >= NOW() - INTERVAL '7 days'),
    'sessions_last_30_days', COUNT(*) FILTER (WHERE session_date >= NOW() - INTERVAL '30 days')
  ) INTO result
  FROM public.study_sessions
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. TypeScript 型定義

### 3.1 Supabase Database Types

```typescript
// src/types/supabase.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          preferred_language: 'ja' | 'vi'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          preferred_language?: 'ja' | 'vi'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          preferred_language?: 'ja' | 'vi'
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          learned_words: string[]
          current_level: number
          experience_points: number
          streak_days: number
          last_study_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          learned_words?: string[]
          current_level?: number
          experience_points?: number
          streak_days?: number
          last_study_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          learned_words?: string[]
          current_level?: number
          experience_points?: number
          streak_days?: number
          last_study_date?: string | null
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          duration_minutes: number
          words_practiced: number
          words_learned: number
          quiz_score: number | null
          activity_type: 'flashcard' | 'quiz' | 'learning'
          xp_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date: string
          duration_minutes: number
          words_practiced: number
          words_learned?: number
          quiz_score?: number | null
          activity_type: 'flashcard' | 'quiz' | 'learning'
          xp_earned?: number
          created_at?: string
        }
        Update: {
          // study_sessions は immutable（更新不可）
        }
      }
    }
  }
}
```

---

## 4. Supabase クライアント設定

### 4.1 環境変数

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # サーバーサイドのみ
```

### 4.2 クライアント初期化

```typescript
// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export const createClient = () => {
  return createClientComponentClient<Database>()
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createServerClient = () => {
  return createServerComponentClient<Database>({
    cookies,
  })
}
```

---

## 5. API 実装

### 5.1 既存 API エンドポイントの実装

#### /api/progress/words (単語の追加・削除)

```typescript
// src/app/api/progress/words/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = createServerClient()

  // 認証チェック
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { wordId, action } = await request.json()
  const userId = session.user.id

  // 現在の learned_words を取得
  const { data: progress, error: fetchError } = await supabase
    .from('user_progress')
    .select('learned_words')
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  let updatedWords = progress.learned_words || []

  if (action === 'add' && !updatedWords.includes(wordId)) {
    updatedWords = [...updatedWords, wordId]
  } else if (action === 'remove') {
    updatedWords = updatedWords.filter((id: string) => id !== wordId)
  }

  // 更新
  const { error: updateError } = await supabase
    .from('user_progress')
    .update({ learned_words: updatedWords })
    .eq('user_id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, learned_words: updatedWords })
}
```

#### /api/progress/xp (経験値の追加)

```typescript
// src/app/api/progress/xp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const POINTS_PER_LEVEL = 100

export async function PATCH(request: NextRequest) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { points } = await request.json()
  const userId = session.user.id

  // 現在の XP を取得
  const { data: progress, error: fetchError } = await supabase
    .from('user_progress')
    .select('experience_points')
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const newXP = progress.experience_points + points
  const newLevel = Math.floor(newXP / POINTS_PER_LEVEL) + 1

  // 更新
  const { error: updateError } = await supabase
    .from('user_progress')
    .update({
      experience_points: newXP,
      current_level: newLevel,
    })
    .eq('user_id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    experience_points: newXP,
    current_level: newLevel,
  })
}
```

#### /api/sessions (学習セッション記録)

```typescript
// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionData = await request.json()
  const userId = session.user.id

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      session_date: new Date().toISOString(),
      duration_minutes: sessionData.duration_minutes,
      words_practiced: sessionData.words_practiced,
      words_learned: sessionData.words_learned,
      quiz_score: sessionData.quiz_score,
      activity_type: sessionData.activity_type,
      xp_earned: sessionData.xp_earned,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, session: data })
}
```

#### /api/progress/sync (全データ同期)

```typescript
// src/app/api/progress/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET: サーバーデータを取得
export async function GET() {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // ユーザー進捗データ取得
  const { data: progress, error: progressError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 })
  }

  // 最新のセッション取得（最大1000件）
  const { data: sessions, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(1000)

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 })
  }

  return NextResponse.json({
    progress: {
      learnedWords: progress.learned_words,
      currentLevel: progress.current_level,
      experiencePoints: progress.experience_points,
      streakDays: progress.streak_days,
      lastStudyDate: progress.last_study_date,
    },
    sessions: sessions.map(s => ({
      date: s.session_date,
      duration_minutes: s.duration_minutes,
      words_practiced: s.words_practiced,
      words_learned: s.words_learned,
      quiz_score: s.quiz_score,
      activity_type: s.activity_type,
      xp_earned: s.xp_earned,
    })),
  })
}

// POST: ローカルデータをサーバーにアップロード
export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { progress, sessions } = await request.json()
  const userId = session.user.id

  // user_progress の upsert
  const { error: progressError } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      learned_words: progress.learned_words,
      current_level: progress.current_level,
      experience_points: progress.experience_points,
      streak_days: progress.streak_days,
      last_study_date: progress.last_study_date,
    })

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 })
  }

  // セッションのバッチ挿入（重複は無視）
  if (sessions && sessions.length > 0) {
    const sessionsToInsert = sessions.map((s: any) => ({
      user_id: userId,
      session_date: s.date,
      duration_minutes: s.duration_minutes,
      words_practiced: s.words_practiced,
      words_learned: s.words_learned,
      quiz_score: s.quiz_score,
      activity_type: s.activity_type,
      xp_earned: s.xp_earned,
    }))

    const { error: sessionsError } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)

    if (sessionsError) {
      console.warn('Some sessions failed to insert:', sessionsError)
      // 部分的な失敗は許容（重複など）
    }
  }

  return NextResponse.json({ success: true })
}
```

---

## 6. フロントエンド統合

### 6.1 認証コンポーネント

```typescript
// src/components/auth/AuthProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 6.2 Zustand Store の拡張

```typescript
// src/stores/userProgressStore.ts に追加

import { createClient } from '@/lib/supabase/client'

// ... 既存のコード ...

// Supabase クライアントのインスタンス
const supabase = createClient()

// API call を Supabase に変更
const apiCall = async (url: string, options: RequestInit = {}) => {
  // 既存の API エンドポイントを使用
  // または直接 Supabase を呼び出す
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`)
  }

  return response.json()
}

// 自動同期の設定
export const setupAutoSync = () => {
  const store = useUserProgressStore.getState()

  // ユーザーがログインしたら同期
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      store.actions.setSyncStatus('syncing')
      try {
        await store.actions.syncWithBackend()
      } catch (error) {
        console.error('Auto sync failed:', error)
        store.actions.setSyncStatus('error')
      }
    } else if (event === 'SIGNED_OUT') {
      store.actions.setSyncStatus('offline')
    }
  })

  // 定期的な同期（5分ごと）
  setInterval(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session && store.syncStatus !== 'syncing') {
      try {
        await store.actions.syncWithBackend()
      } catch (error) {
        console.warn('Periodic sync failed:', error)
      }
    }
  }, 5 * 60 * 1000)
}
```

---

## 7. セキュリティ要件

### 7.1 認証セキュリティ

- **パスワード要件**:
  - 最小8文字
  - 英数字混在を推奨
  - Supabase のデフォルト設定を使用

- **セッション管理**:
  - JWT トークンベース
  - HTTPS 必須（本番環境）
  - HttpOnly Cookie でトークン保存

- **レート制限**:
  - Supabase のビルトイン保護を使用
  - API エンドポイントにレート制限追加（Vercel Edge Config）

### 7.2 データセキュリティ

- **Row Level Security (RLS)**:
  - 全テーブルで有効化
  - ユーザーは自分のデータのみアクセス可能

- **API キー管理**:
  - ANON KEY: クライアントサイドで使用（安全）
  - SERVICE ROLE KEY: サーバーサイドのみ、環境変数で管理

- **データ検証**:
  - 入力データのバリデーション（Zod 使用推奨）
  - SQL インジェクション対策（Supabase が自動処理）

---

## 8. データ移行計画

### 8.1 localStorage から Supabase への移行

```typescript
// src/lib/migration/migrateLocalData.ts
import { createClient } from '@/lib/supabase/client'
import { useUserProgressStore } from '@/stores/userProgressStore'

export async function migrateLocalDataToSupabase(userId: string) {
  const supabase = createClient()
  const localState = useUserProgressStore.getState()

  try {
    // 1. user_progress の作成
    const { error: progressError } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        learned_words: localState.learned_words,
        current_level: localState.current_level,
        experience_points: localState.experience_points,
        streak_days: localState.streak_days,
        last_study_date: localState.last_study_date,
      })

    if (progressError && progressError.code !== '23505') {
      // 23505 = unique violation (既に存在する)
      throw progressError
    }

    // 2. study_sessions の移行
    const sessionsToMigrate = localState.study_sessions.map(s => ({
      user_id: userId,
      session_date: s.date,
      duration_minutes: s.duration_minutes,
      words_practiced: s.words_practiced,
      words_learned: s.words_learned,
      quiz_score: s.quiz_score,
      activity_type: s.activity_type,
      xp_earned: s.xp_earned,
    }))

    if (sessionsToMigrate.length > 0) {
      const { error: sessionsError } = await supabase
        .from('study_sessions')
        .insert(sessionsToMigrate)

      if (sessionsError) {
        console.warn('Some sessions failed to migrate:', sessionsError)
      }
    }

    console.log('✅ Local data migrated to Supabase successfully')
    return true
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}
```

### 8.2 移行フロー

1. **初回ログイン時**:
   - localStorage にデータが存在するか確認
   - 存在する場合、Supabase にマイグレーション
   - マイグレーション成功後、フラグを保存（再度実行しない）

2. **以降のセッション**:
   - Supabase からデータを取得
   - localStorage はバックアップとして維持

```typescript
// 使用例
useEffect(() => {
  const handleAuthChange = async (event: string, session: any) => {
    if (event === 'SIGNED_IN' && session) {
      const hasLocalData = localStorage.getItem('user-progress-storage')
      const migrated = localStorage.getItem('data-migrated-to-supabase')

      if (hasLocalData && !migrated) {
        try {
          await migrateLocalDataToSupabase(session.user.id)
          localStorage.setItem('data-migrated-to-supabase', 'true')
        } catch (error) {
          console.error('Migration failed:', error)
        }
      }

      // 同期
      await syncWithBackend()
    }
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    handleAuthChange
  )

  return () => subscription.unsubscribe()
}, [])
```

---

## 9. オフライン対応

### 9.1 戦略

- **Zustand + localStorage**: オフライン時の主要ストレージ（既存）
- **Supabase**: オンライン時の同期先
- **自動同期**: オンライン復帰時に自動でデータ同期

### 9.2 競合解決

```typescript
// Last Write Wins (LWW) 戦略
// updated_at タイムスタンプで最新のデータを優先

const mergeProgress = (local: UserProgress, server: UserProgress) => {
  const localTime = new Date(local.updated_at || 0).getTime()
  const serverTime = new Date(server.updated_at || 0).getTime()

  if (localTime > serverTime) {
    // ローカルが新しい → サーバーに送信
    return { action: 'upload', data: local }
  } else if (serverTime > localTime) {
    // サーバーが新しい → ローカルに適用
    return { action: 'download', data: server }
  } else {
    // 同じ → learned_words を union（マージ）
    return {
      action: 'merge',
      data: {
        ...server,
        learned_words: [...new Set([...local.learned_words, ...server.learned_words])],
      }
    }
  }
}
```

---

## 10. パフォーマンス最適化

### 10.1 クエリ最適化

```typescript
// インデックスを活用した効率的なクエリ
const { data } = await supabase
  .from('study_sessions')
  .select('*')
  .eq('user_id', userId)
  .gte('session_date', startDate)  // インデックス使用
  .order('session_date', { ascending: false })
  .limit(100)
```

### 10.2 キャッシング

```typescript
// React Query で Supabase データをキャッシュ
import { useQuery } from '@tanstack/react-query'

export function useUserProgress(userId: string) {
  return useQuery({
    queryKey: ['user-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  })
}
```

---

## 11. テスト計画

### 11.1 単体テスト

- API エンドポイントのテスト
- Supabase クライアント関数のテスト
- データ移行ロジックのテスト

### 11.2 統合テスト

- 認証フロー E2E テスト
- データ同期フローのテスト
- オフライン → オンライン復帰のテスト

### 11.3 セキュリティテスト

- RLS ポリシーの検証
- 未認証ユーザーのアクセス拒否確認
- SQL インジェクション耐性

---

## 12. 実装ロードマップ

### Phase 1: 基礎構築（1-2週間）

- [ ] Supabase プロジェクト作成
- [ ] データベーススキーマ実装
- [ ] RLS ポリシー設定
- [ ] TypeScript 型定義生成
- [ ] Supabase クライアント設定

### Phase 2: 認証実装（1週間）

- [ ] AuthProvider コンポーネント作成
- [ ] ログイン・サインアップ UI
- [ ] OAuth 統合（Google, GitHub）
- [ ] セッション管理

### Phase 3: データ同期（1-2週間）

- [ ] API エンドポイント実装
- [ ] Zustand Store の Supabase 統合
- [ ] 自動同期機能
- [ ] データ移行ツール

### Phase 4: テスト・最適化（1週間）

- [ ] E2E テスト作成
- [ ] パフォーマンステスト
- [ ] セキュリティ監査
- [ ] エラーハンドリング強化

### Phase 5: デプロイ（数日）

- [ ] 本番環境設定
- [ ] データベースマイグレーション実行
- [ ] モニタリング設定
- [ ] ユーザー向けドキュメント作成

---

## 13. 監視・メンテナンス

### 13.1 モニタリング

- **Supabase Dashboard**: クエリパフォーマンス、エラーログ
- **Vercel Analytics**: API レスポンスタイム
- **Sentry**: エラートラッキング

### 13.2 バックアップ

- Supabase の自動バックアップ（1日1回）
- ポイントインタイムリカバリ（PITR）有効化

### 13.3 スケーリング

- 初期: Free Tier (500MB データベース)
- 成長時: Pro Tier (8GB+)
- インデックス最適化とクエリチューニング

---

## 付録 A: 環境別設定

### 開発環境

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
```

### 本番環境

```bash
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
```

---

## 付録 B: 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Client Libraries](https://supabase.com/docs/reference/javascript/introduction)

---

**最終更新**: 2025-12-19
**バージョン**: 1.0
**作成者**: Claude Code
