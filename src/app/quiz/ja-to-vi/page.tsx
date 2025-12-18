'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserProgressStore } from '@/stores/userProgressStore';

interface Word {
  id: string;
  vietnamese: string;
  japanese: string;
  pronunciation: string;
  category: string;
}

interface QuizQuestion {
  word: Word;
  choices: string[];
  correctAnswer: string;
}

export default function JaToViQuizPage() {
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

  const { addExperiencePoints, updateStreak, addStudySession } =
    useUserProgressStore();

  // Load words and generate questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        let allWords: Word[] = [];

        if (categoryParam === 'all') {
          // Load all categories
          const categories = ['greetings', 'numbers', 'daily', 'food', 'business'];
          for (const cat of categories) {
            const wordsModule = await import(`@/data/words/${cat}.json`);
            allWords = [...allWords, ...wordsModule.default];
          }
        } else {
          const wordsModule = await import(`@/data/words/${categoryParam}.json`);
          allWords = wordsModule.default;
        }

        // Shuffle and take 10 words
        const shuffled = allWords.sort(() => Math.random() - 0.5);
        const selectedWords = shuffled.slice(0, 10);

        // Generate questions with choices
        const quizQuestions = selectedWords.map((word) => {
          // Get 3 random wrong answers
          const wrongChoices = allWords
            .filter((w) => w.id !== word.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((w) => w.vietnamese);

          // Combine with correct answer and shuffle
          const choices = [word.vietnamese, ...wrongChoices].sort(
            () => Math.random() - 0.5
          );

          return {
            word,
            choices,
            correctAnswer: word.vietnamese,
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

  // Update streak and add study session on quiz completion
  useEffect(() => {
    if (quizComplete && questions.length > 0) {
      updateStreak();
      addStudySession({
        date: new Date().toISOString(),
        duration_minutes: Math.ceil(questions.length * 0.5), // Estimate: 30 sec per question
        words_practiced: questions.length,
        quiz_score: score,
        activity_type: 'quiz',
        xp_earned: score * 5,
        words_learned: score,
      });
    }
  }, [quizComplete, score, questions.length, updateStreak, addStudySession]);

  const currentQuestion = questions[currentIndex];

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

  const handleRestart = () => {
    router.push(`/quiz/ja-to-vi?category=${categoryParam}`);
    router.refresh();
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
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🎉' : percentage >= 60 ? '👏' : '📚'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              クイズ完了！
            </h1>
            <p className="text-5xl font-bold text-primary-600 mb-2">
              {score} / {questions.length}
            </p>
            <p className="text-xl text-gray-600">正解率: {percentage}%</p>
            <p className="text-lg text-green-600 mt-2">
              獲得XP: {score * 5} XP
            </p>
          </div>

          {/* Evaluation Message */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            {percentage >= 80 ? (
              <p className="text-lg text-gray-700">
                素晴らしい！完璧に近い結果です！
              </p>
            ) : percentage >= 60 ? (
              <p className="text-lg text-gray-700">
                いい調子です！もう少し練習すればマスターできそうです。
              </p>
            ) : (
              <p className="text-lg text-gray-700">
                頑張りましょう！繰り返し練習することが上達の鍵です。
              </p>
            )}
          </div>

          {/* Wrong Answers */}
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
                    <p className="text-sm text-gray-600">問題: {q.word.japanese}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      正解: {q.word.vietnamese}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({q.word.pronunciation})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRestart}
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🇯🇵➡️🇻🇳 日本語 → ベトナム語
          </h1>
          <button
            onClick={() => router.push('/quiz')}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕ 終了
          </button>
        </div>

        {/* Progress */}
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
        {/* Question */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600 mb-2">日本語を読んで、対応するベトナム語を選んでください</p>
          <h2 className="text-4xl font-bold text-gray-900">
            {currentQuestion.word.japanese}
          </h2>
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
              <p className="text-sm text-gray-600">
                発音: {currentQuestion.word.pronunciation}
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
    </div>
  );
}
