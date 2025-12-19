'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import categoriesData from '@/data/categories.json';

interface QuizMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  difficulty: string;
}

const quizModes: QuizMode[] = [
  {
    id: 'ja-to-vi',
    name: '日本語 → ベトナム語',
    description: '日本語を見てベトナム語を選ぶ4択クイズ',
    icon: '🇯🇵➡️🇻🇳',
    path: '/quiz/ja-to-vi',
    difficulty: 'intermediate',
  },
  {
    id: 'vi-to-ja',
    name: 'ベトナム語 → 日本語',
    description: 'ベトナム語を見て日本語を選ぶ4択クイズ',
    icon: '🇻🇳➡️🇯🇵',
    path: '/quiz/vi-to-ja',
    difficulty: 'beginner',
  },
  {
    id: 'listening',
    name: 'リスニングクイズ',
    description: '音声を聞いて日本語訳を選ぶクイズ',
    icon: '🔊',
    path: '/quiz/listening',
    difficulty: 'intermediate',
  },
];

interface QuizModeCardProps {
  mode: QuizMode;
  selectedCategory: string;
}

// Memoized QuizModeCard component to prevent unnecessary re-renders
const QuizModeCard = memo<QuizModeCardProps>(function QuizModeCard({
  mode,
  selectedCategory,
}) {
  return (
    <Link
      href={`${mode.path}?category=${selectedCategory}`}
      className="group"
    >
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-2 border-gray-100 hover:border-primary-400 hover:scale-105 cursor-pointer h-full">
        {/* Icon */}
        <div className="text-5xl mb-4 text-center">{mode.icon}</div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center group-hover:text-primary-600 transition-colors">
          {mode.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 text-center">
          {mode.description}
        </p>

        {/* Difficulty Badge */}
        <div className="flex justify-center mb-4">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              mode.difficulty === 'beginner'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {mode.difficulty === 'beginner' ? '初級向け' : '中級向け'}
          </span>
        </div>

        {/* Action */}
        <div className="text-center pt-4 border-t border-gray-100">
          <span className="text-primary-600 font-semibold group-hover:translate-x-1 transition-transform inline-block">
            クイズを始める →
          </span>
        </div>
      </div>
    </Link>
  );
});

export default function QuizPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">クイズ</h1>
        <p className="text-gray-600">
          4択クイズやリスニングで実力をチェックしましょう。正解するたびに経験値を獲得できます！
        </p>
      </div>

      {/* Category Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          カテゴリーを選択
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🌟 全カテゴリー
          </button>
          {categoriesData.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Mode Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          クイズモードを選択
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizModes.map((mode) => (
            <QuizModeCard
              key={mode.id}
              mode={mode}
              selectedCategory={selectedCategory}
            />
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          💡 クイズのポイント
        </h2>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>各クイズは10問で1セットです</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>正解するたびに +5 XP を獲得できます</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              初心者の方は「ベトナム語→日本語」から始めるのがおすすめです
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              リスニングクイズで発音を確認しながら実力アップしましょう
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
