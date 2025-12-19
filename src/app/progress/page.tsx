'use client';

import { useMemo } from 'react';
import { useUserProgress } from '@/stores/userProgressStore';
import categoriesData from '@/data/categories.json';

export default function ProgressPage() {
  const {
    learned_words,
    current_level,
    experience_points,
    streak_days,
    last_study_date,
    study_sessions,
  } = useUserProgress();

  // Calculate level progress
  const levelProgress = useMemo(
    () => ((experience_points % 100) / 100) * 100,
    [experience_points]
  );

  // Calculate category progress - memoized to avoid recalculation
  const categoryProgress = useMemo(
    () =>
      categoriesData.map((category) => {
        const categoryWords = learned_words.filter((wordId) =>
          wordId.startsWith(category.id)
        );
        const progress = (categoryWords.length / category.wordCount) * 100;
        return {
          ...category,
          learnedCount: categoryWords.length,
          progress: Math.round(progress),
        };
      }),
    [learned_words]
  );

  // Calculate total study time - memoized
  const totalStudyMinutes = useMemo(
    () =>
      study_sessions.reduce(
        (total, session) => total + (session.duration_minutes || 0),
        0
      ),
    [study_sessions]
  );

  // Recent study sessions - memoized
  const recentSessions = useMemo(
    () => study_sessions.slice(-7).reverse(),
    [study_sessions]
  );

  // Calculate streak status - memoized
  const isStreakActive = useMemo(() => {
    if (!last_study_date) return false;
    const lastStudy = new Date(last_study_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastStudy.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  }, [last_study_date]);

  // Helper function to calculate required XP for a level
  const getRequiredXPForLevel = (level: number) => level * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">学習統計</h1>
        <p className="text-gray-600">
          あなたの学習進捗と成果を確認しましょう。
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total XP */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">総経験値</h3>
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-3xl font-bold">{experience_points}</p>
          <p className="text-xs opacity-75 mt-1">XP</p>
        </div>

        {/* Current Level */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">現在のレベル</h3>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-3xl font-bold">Lv.{current_level}</p>
          <p className="text-xs opacity-75 mt-1">
            次のレベルまで {100 - (experience_points % 100)} XP
          </p>
        </div>

        {/* Learned Words */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">習得単語数</h3>
            <span className="text-2xl">📚</span>
          </div>
          <p className="text-3xl font-bold">{learned_words.length}</p>
          <p className="text-xs opacity-75 mt-1">/ 200 単語</p>
        </div>

        {/* Streak */}
        <div
          className={`rounded-lg shadow-lg p-6 text-white ${
            isStreakActive
              ? 'bg-gradient-to-br from-orange-500 to-orange-600'
              : 'bg-gradient-to-br from-gray-400 to-gray-500'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">連続学習日数</h3>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-3xl font-bold">{streak_days}</p>
          <p className="text-xs opacity-75 mt-1">
            {isStreakActive ? '継続中！' : '記録を更新しよう'}
          </p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          レベル進捗
        </h2>
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Lv.{current_level}</span>
            <span>Lv.{current_level + 1}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all flex items-center justify-end pr-2"
              style={{ width: `${levelProgress}%` }}
            >
              {levelProgress > 10 && (
                <span className="text-xs text-white font-semibold">
                  {Math.round(levelProgress)}%
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {experience_points % 100} / 100 XP
          </p>
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          カテゴリー別進捗
        </h2>
        <div className="space-y-4">
          {categoryProgress.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-medium text-gray-900">
                    {category.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {category.learnedCount} / {category.wordCount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${category.progress}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {category.progress}% 完了
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Study Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Study Time */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            学習時間
          </h2>
          <div className="text-center py-6">
            <p className="text-5xl font-bold text-primary-600 mb-2">
              {totalStudyMinutes}
            </p>
            <p className="text-gray-600">分</p>
            <p className="text-sm text-gray-500 mt-4">
              総学習時間（累計）
            </p>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            最近の学習セッション
          </h2>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.activity_type === 'flashcard'
                        ? '📇 単語カード'
                        : '📝 クイズ'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.date).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary-600">
                      +{session.xp_earned || 0} XP
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.words_learned || 0} 単語
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-sm">まだ学習セッションがありません</p>
              <p className="text-xs mt-1">学習を始めて記録を作りましょう！</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements Hint */}
      <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          🎯 次の目標
        </h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {learned_words.length < 50 && (
            <li>• 50単語習得まで残り {50 - learned_words.length} 単語</li>
          )}
          {streak_days < 7 && (
            <li>• 7日連続学習まで残り {7 - streak_days} 日</li>
          )}
          {current_level < 5 && (
            <li>
              • レベル5到達まで残り{' '}
              {getRequiredXPForLevel(5) - experience_points} XP
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
