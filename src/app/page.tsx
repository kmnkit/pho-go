'use client';

import Link from 'next/link';
import { useUserProgress, useLevelProgress } from '@/stores/userProgressStore';

/**
 * Home page component displaying user progress and quick access navigation
 */
export default function Home() {
  const { current_level, streak_days, learned_words } = useUserProgress();
  const { xpInCurrentLevel, xpRequiredForNextLevel, progressPercentage } = useLevelProgress();

  // 今日の学習目標（仮）
  const dailyGoal = 10; // 10単語
  const todayProgress = 0; // 今日学習した単語数

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ようこそ！Việt Pocket へ
        </h1>
        <p className="text-gray-600">今日も楽しくベトナム語を学びましょう</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">連続学習日数</p>
              <p className="text-3xl font-bold text-orange-600">
                {streak_days} 日
              </p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </div>

        {/* Level */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">現在のレベル</p>
              <p className="text-3xl font-bold text-blue-600">
                Level {current_level}
              </p>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {xpInCurrentLevel} / {xpRequiredForNextLevel} XP
            </p>
          </div>
        </div>

        {/* Learned Words */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">習得済み単語</p>
              <p className="text-3xl font-bold text-green-600">
                {learned_words.length}
              </p>
            </div>
            <div className="text-4xl">📚</div>
          </div>
        </div>
      </div>

      {/* Today's Goal */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            今日の学習目標
          </h2>
          <span className="text-sm text-gray-500">
            {todayProgress} / {dailyGoal} 単語
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all"
            style={{ width: `${(todayProgress / dailyGoal) * 100}%` }}
          />
        </div>
      </div>

      {/* Quick Access Cards */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        クイックアクセス
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href="/learn/alphabet"
          className="group p-6 bg-white rounded-lg shadow hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
            📝
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">
            アルファベット
          </h3>
          <p className="text-sm text-gray-600">
            29文字と6つの声調を学習
          </p>
        </Link>

        <Link
          href="/flashcards"
          className="group p-6 bg-white rounded-lg shadow hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
            🎴
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">
            単語カード
          </h3>
          <p className="text-sm text-gray-600">
            カテゴリー別に単語を覚える
          </p>
        </Link>

        <Link
          href="/quiz"
          className="group p-6 bg-white rounded-lg shadow hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
            🎯
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">クイズ</h3>
          <p className="text-sm text-gray-600">
            4択やリスニングで復習
          </p>
        </Link>

        <Link
          href="/progress"
          className="group p-6 bg-white rounded-lg shadow hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
            📊
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">
            学習統計
          </h3>
          <p className="text-sm text-gray-600">進捗を確認しよう</p>
        </Link>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          はじめての方へ
        </h2>
        <ol className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            まずは<Link href="/learn/alphabet" className="text-primary-600 hover:underline">アルファベット</Link>から始めましょう
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <Link href="/flashcards" className="text-primary-600 hover:underline">単語カード</Link>で基本的な単語を覚えましょう
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <Link href="/quiz" className="text-primary-600 hover:underline">クイズ</Link>で理解度をチェックしましょう
          </li>
        </ol>
      </div>
    </div>
  );
}
