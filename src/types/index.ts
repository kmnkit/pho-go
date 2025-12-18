// 単語データ型
export interface Word {
  id: string;
  vietnamese: string;
  japanese: string;
  pronunciation: string; // カタカナ読み
  audio_url: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  example_sentence?: {
    vietnamese: string;
    japanese: string;
  };
}

// カテゴリー型
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  wordCount: number;
}

// アルファベット型
export interface Alphabet {
  letter: string;
  pronunciation: string;
  audio_url: string;
  examples: string[];
}

// 声調型
export interface Tone {
  id: string;
  name: string;
  vietnamese_name: string;
  symbol: string;
  description: string;
  audio_url: string;
  pattern: string; // 高低パターン (例: "↗" "↘")
  examples: {
    word: string;
    meaning: string;
  }[];
}

// 学習セッション型
export interface StudySession {
  date: string;
  duration_minutes: number;
  words_practiced: number;
  quiz_score?: number;
  activity_type?: 'flashcard' | 'quiz' | 'learning';
  xp_earned?: number;
  words_learned?: number;
}

// ユーザー学習データ型
export interface UserProgress {
  user_id: string;
  learned_words: string[]; // 習得済み単語のID配列
  current_level: number;
  experience_points: number;
  streak_days: number;
  last_study_date: string;
  study_sessions: StudySession[];
}

// クイズ問題型
export interface QuizQuestion {
  id: string;
  type: 'ja-to-vi' | 'vi-to-ja' | 'listening';
  question: string;
  options: string[];
  correct_answer: string;
  word_id: string;
  audio_url?: string;
}

// クイズ結果型
export interface QuizResult {
  total_questions: number;
  correct_answers: number;
  incorrect_word_ids: string[];
  score_percentage: number;
  time_taken_seconds: number;
}
