'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserProgressActions } from '@/stores/userProgressStore';
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer';
import type { Word } from '@/types';

// Dynamic import for QuizResults - only loaded when quiz is complete
const QuizResults = dynamicImport(() => import('@/components/QuizResults'), {
  loading: () => (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-xl p-8 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  ssr: false,
});

interface QuizQuestion {
  word: Word;
  choices: string[];
  correctAnswer: string;
}

export default function ListeningQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<QuizQuestion[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  const { addExperiencePoints } = useUserProgressActions();
  const currentQuestion = questions[currentIndex];
  const { play } = useAudioPlayer(currentQuestion?.word.audio_url || '');

  // Load words and generate questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        let allWords: Word[] = [];

        if (categoryParam === 'all') {
          const categories = ['greetings', 'numbers', 'daily', 'food', 'business'];
          for (const cat of categories) {
            const wordsModule = await import(`@/data/words/${cat}.json`);
            allWords = [...allWords, ...wordsModule.default];
          }
        } else {
          const wordsModule = await import(`@/data/words/${categoryParam}.json`);
          allWords = wordsModule.default;
        }

        const shuffled = allWords.sort(() => Math.random() - 0.5);
        const selectedWords = shuffled.slice(0, 10);

        const quizQuestions = selectedWords.map((word) => {
          const wrongChoices = allWords
            .filter((w) => w.id !== word.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((w) => w.japanese);

          const choices = [word.japanese, ...wrongChoices].sort(
            () => Math.random() - 0.5
          );

          return {
            word,
            choices,
            correctAnswer: word.japanese,
          };
        });

        setQuestions(quizQuestions);
      } catch (error) {
        console.error('Failed to load questions:', error);
        router.push('/quiz');
      }
    };

    loadQuestions();
  }, [categoryParam, router]);

  // Auto-play audio when question changes
  useEffect(() => {
    if (currentQuestion && !showFeedback) {
      const timer = setTimeout(() => {
        play();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, showFeedback, play]);

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    setSelectedAnswer(answer);
    setShowFeedback(true);

    if (isCorrect) {
      setScore(score + 1);
      addExperiencePoints(5);
    } else {
      setWrongAnswers([...wrongAnswers, currentQuestion]);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setQuizComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <p className="text-gray-600">問題を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    return (
      <QuizResults
        score={score}
        totalQuestions={questions.length}
        wrongAnswers={wrongAnswers}
        categoryParam={categoryParam}
        quizType="listening"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🔊 リスニングクイズ
          </h1>
          <button
            onClick={() => router.push('/quiz')}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕ 終了
          </button>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              問題 {currentIndex + 1} / {questions.length}
            </span>
            <span>正解: {score}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600 mb-4">
            音声を聞いて、日本語の意味を選んでください
          </p>

          {/* Audio Player */}
          <div className="mb-6">
            <div className="text-7xl mb-4">🔊</div>
            <button
              onClick={play}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium text-lg hover:bg-blue-600 transition-colors"
            >
              🔊 もう一度聞く
            </button>
          </div>

          {/* Show Vietnamese text only after answer */}
          {showFeedback && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">ベトナム語</p>
              <p className="text-3xl font-bold text-primary-600">
                {currentQuestion.word.vietnamese}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                ({currentQuestion.word.pronunciation})
              </p>
            </div>
          )}
        </div>

        {/* Choices */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {currentQuestion.choices.map((choice, idx) => {
            const isSelected = selectedAnswer === choice;
            const isCorrect = choice === currentQuestion.correctAnswer;
            const showCorrect = showFeedback && isCorrect;
            const showIncorrect = showFeedback && isSelected && !isCorrect;

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(choice)}
                disabled={showFeedback}
                className={`p-4 rounded-lg border-2 text-left text-lg font-medium transition-all ${
                  showCorrect
                    ? 'bg-green-100 border-green-500 ring-2 ring-green-300'
                    : showIncorrect
                    ? 'bg-red-100 border-red-500 ring-2 ring-red-300'
                    : isSelected
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-white border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{choice}</span>
                  {showCorrect && <span className="text-2xl">✓</span>}
                  {showIncorrect && <span className="text-2xl">✗</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div
              className={`p-4 rounded-lg mb-4 ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'bg-green-50'
                  : 'bg-red-50'
              }`}
            >
              <p
                className={`text-lg font-semibold mb-2 ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}
              >
                {selectedAnswer === currentQuestion.correctAnswer
                  ? '🎉 正解！+5 XP'
                  : '❌ 不正解'}
              </p>
              <p className="text-gray-700">
                <strong>正解:</strong> {currentQuestion.correctAnswer}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              次の問題へ →
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-gray-500">
        💡 ヒント: 何度も音声を聞いて、発音のパターンを覚えましょう
      </div>
    </div>
  );
}
