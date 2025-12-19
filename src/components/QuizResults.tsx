'use client';

import { useRouter } from 'next/navigation';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  wrongAnswers: Array<{
    word: {
      vietnamese: string;
      japanese: string;
      pronunciation: string;
    };
  }>;
  categoryParam: string;
  quizType: 'listening' | 'ja-to-vi' | 'vi-to-ja';
}

export default function QuizResults({
  score,
  totalQuestions,
  wrongAnswers,
  categoryParam,
  quizType,
}: QuizResultsProps) {
  const router = useRouter();
  const percentage = (score / totalQuestions) * 100;

  const getQuizTitle = () => {
    switch (quizType) {
      case 'listening':
        return '🔊 リスニングクイズ';
      case 'ja-to-vi':
        return '🇯🇵→🇻🇳 日本語→ベトナム語';
      case 'vi-to-ja':
        return '🇻🇳→🇯🇵 ベトナム語→日本語';
    }
  };

  const getQuizPath = () => {
    return `/quiz/${quizType}?category=${categoryParam}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">
            {percentage === 100 ? '🎉' : percentage >= 80 ? '😊' : percentage >= 60 ? '🙂' : '💪'}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            クイズ完了！
          </h2>
          <p className="text-gray-600">{getQuizTitle()}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">正解数</p>
              <p className="text-4xl font-bold text-primary-500">
                {score} / {totalQuestions}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">正解率</p>
              <p className="text-4xl font-bold text-primary-500">
                {Math.round(percentage)}%
              </p>
            </div>
          </div>

          {percentage === 100 ? (
            <p className="text-lg text-gray-700">
              完璧です！素晴らしい！
            </p>
          ) : percentage >= 80 ? (
            <p className="text-lg text-gray-700">
              {quizType === 'listening'
                ? '素晴らしい！リスニング力が高いですね！'
                : 'よくできました！語彙力が高いですね！'}
            </p>
          ) : percentage >= 60 ? (
            <p className="text-lg text-gray-700">
              {quizType === 'listening'
                ? 'いい調子です！繰り返し聞くことで耳が慣れてきます。'
                : 'いい調子です！継続して学習しましょう。'}
            </p>
          ) : (
            <p className="text-lg text-gray-700">
              {quizType === 'listening'
                ? '頑張りましょう！毎日少しずつ聞くことが上達の鍵です。'
                : '頑張りましょう！毎日少しずつ学習することが大切です。'}
            </p>
          )}
        </div>

        {wrongAnswers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              間違えた問題
            </h3>
            <div className="space-y-2">
              {wrongAnswers.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {q.word.vietnamese}
                  </p>
                  <p className="text-sm text-gray-600">
                    正解: {q.word.japanese}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({q.word.pronunciation})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(getQuizPath())}
            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            もう一度挑戦
          </button>
          <button
            onClick={() => router.push('/quiz')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            他のクイズへ
          </button>
        </div>
      </div>
    </div>
  );
}
