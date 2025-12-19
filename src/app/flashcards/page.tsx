'use client';

import { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import categoriesData from '@/data/categories.json';
import { useUserProgressStore } from '@/stores/userProgressStore';

interface Category {
  id: string;
  name: string;
  name_vietnamese: string;
  description: string;
  icon: string;
  color: string;
  wordCount: number;
  difficulty: string;
  order: number;
}

interface CategoryCardProps {
  category: Category;
  learnedCount: number;
  progressPercentage: number;
}

// Memoized CategoryCard component to prevent unnecessary re-renders
const CategoryCard = memo<CategoryCardProps>(function CategoryCard({
  category,
  learnedCount,
  progressPercentage,
}) {
  return (
    <Link
      key={category.id}
      href={`/flashcards/${category.id}`}
      className="group"
    >
      <div
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 border-2 border-gray-100 hover:border-primary-400 hover:scale-105 cursor-pointer h-full"
        style={{
          borderTopColor: category.color,
          borderTopWidth: '4px',
        }}
      >
        {/* Icon and Title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{category.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                {category.name}
              </h2>
              <p className="text-sm text-gray-500">
                {category.name_vietnamese}
              </p>
            </div>
          </div>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              category.difficulty === 'beginner'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {category.difficulty === 'beginner' ? '初級' : '中級'}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {category.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">学習進捗</span>
            <span className="font-semibold text-gray-900">
              {learnedCount} / {category.wordCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: category.color,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progressPercentage}% 完了
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {category.wordCount}語収録
            </span>
            <span className="text-primary-600 font-semibold group-hover:translate-x-1 transition-transform inline-block">
              学習開始 →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default function FlashcardsPage() {
  const { learned_words } = useUserProgressStore();

  // Memoized function to calculate learned words per category
  const getCategoryProgress = useCallback(
    (categoryId: string) => {
      return learned_words.filter((wordId) => wordId.startsWith(categoryId))
        .length;
    },
    [learned_words]
  );

  // Memoize category data with progress calculation
  const categoriesWithProgress = useMemo(
    () =>
      categoriesData.map((category: Category) => {
        const learnedCount = getCategoryProgress(category.id);
        const progressPercentage = Math.round(
          (learnedCount / category.wordCount) * 100
        );
        return {
          category,
          learnedCount,
          progressPercentage,
        };
      }),
    [getCategoryProgress]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">単語カード</h1>
        <p className="text-gray-600">
          カテゴリーを選んで、楽しく単語を覚えましょう。フラッシュカード形式で効率的に学習できます。
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {categoriesWithProgress.map(
          ({ category, learnedCount, progressPercentage }) => (
            <CategoryCard
              key={category.id}
              category={category}
              learnedCount={learnedCount}
              progressPercentage={progressPercentage}
            />
          )
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          💡 フラッシュカードの使い方
        </h2>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>カテゴリーを選択して、単語学習を始めましょう</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>カードをクリックして裏面を確認できます</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              「覚えた」ボタンで進捗を記録し、経験値を獲得できます
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>音声ボタンで正しい発音を確認しましょう</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
