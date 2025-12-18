'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer';
import { useUserProgressStore } from '@/stores/userProgressStore';
import categoriesData from '@/data/categories.json';

interface Word {
  id: string;
  vietnamese: string;
  japanese: string;
  pronunciation: string;
  audio_url: string;
  category: string;
  difficulty: string;
  example_sentence?: {
    vietnamese: string;
    japanese: string;
  };
}

export default function FlashcardCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.category as string;

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionLearned, setSessionLearned] = useState<string[]>([]);
  const [sessionSkipped, setSessionSkipped] = useState<string[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  const { addLearnedWord, addExperiencePoints, updateStreak, addStudySession } =
    useUserProgressStore();

  const category = categoriesData.find((c) => c.id === categoryId);
  const currentWord = words[currentIndex];
  const { play } = useAudioPlayer(currentWord?.audio_url || '');

  // Load words for this category
  useEffect(() => {
    const loadWords = async () => {
      try {
        const wordsModule = await import(
          `@/data/words/${categoryId}.json`
        );
        setWords(wordsModule.default);
      } catch (error) {
        console.error('Failed to load words:', error);
        router.push('/flashcards');
      }
    };

    if (categoryId) {
      loadWords();
    }
  }, [categoryId, router]);

  // Update streak and add study session on completion
  useEffect(() => {
    if (showCompletion && sessionLearned.length > 0) {
      updateStreak();
      addStudySession({
        date: new Date().toISOString(),
        duration_minutes: Math.ceil(sessionLearned.length * 0.5), // Estimate: 30 sec per card
        words_practiced: words.length,
        activity_type: 'flashcard',
        xp_earned: sessionLearned.length * 10,
        words_learned: sessionLearned.length,
      });
    }
  }, [showCompletion, sessionLearned, updateStreak, addStudySession, words.length]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnow = () => {
    if (!currentWord) return;

    // Add to learned words
    addLearnedWord(currentWord.id);
    addExperiencePoints(10);
    setSessionLearned([...sessionLearned, currentWord.id]);

    // Move to next card
    nextCard();
  };

  const handleDontKnow = () => {
    if (!currentWord) return;

    setSessionSkipped([...sessionSkipped, currentWord.id]);

    // Move to next card
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex + 1 >= words.length) {
      setShowCompletion(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionLearned([]);
    setSessionSkipped([]);
    setShowCompletion(false);
  };

  if (!category || words.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (showCompletion) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            素晴らしい！完了しました
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">覚えた単語</p>
              <p className="text-3xl font-bold text-green-600">
                {sessionLearned.length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">獲得XP</p>
              <p className="text-3xl font-bold text-blue-600">
                {sessionLearned.length * 10}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              もう一度復習
            </button>
            <button
              onClick={() => router.push('/flashcards')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              他のカテゴリーへ
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              ホームに戻る
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/flashcards')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 戻る
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {category.icon} {category.name}
              </h1>
              <p className="text-sm text-gray-600">
                {category.name_vietnamese}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/flashcards')}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              {currentIndex + 1} / {words.length}
            </span>
            <span>覚えた: {sessionLearned.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / words.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-8">
        <div
          className="relative w-full aspect-[3/2] max-w-2xl mx-auto"
          style={{ perspective: '1000px' }}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 cursor-pointer`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            onClick={handleFlip}
          >
            {/* Front Side */}
            <div
              className="absolute w-full h-full bg-white rounded-lg shadow-xl p-8 flex flex-col items-center justify-center border-4 border-primary-200"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <p className="text-sm text-gray-500 mb-4">ベトナム語</p>
              <h2 className="text-5xl font-bold text-gray-900 mb-6 text-center">
                {currentWord?.vietnamese}
              </h2>
              <p className="text-gray-500 text-sm">
                タップして裏面を表示
              </p>
            </div>

            {/* Back Side */}
            <div
              className="absolute w-full h-full bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg shadow-xl p-8 flex flex-col items-center justify-center border-4 border-primary-300"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <p className="text-sm text-gray-600 mb-2">日本語</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {currentWord?.japanese}
              </h2>
              <p className="text-sm text-gray-600 mb-4">発音</p>
              <p className="text-2xl font-semibold text-blue-600 mb-6">
                {currentWord?.pronunciation}
              </p>

              {currentWord?.example_sentence && (
                <div className="mt-4 p-4 bg-white bg-opacity-70 rounded-lg text-center">
                  <p className="text-sm text-gray-700 mb-1">
                    {currentWord.example_sentence.vietnamese}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentWord.example_sentence.japanese}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audio Button */}
        <div className="text-center mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              play();
            }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            🔊 音声を聞く
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        <button
          onClick={handleDontKnow}
          className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors"
        >
          ← まだ
        </button>
        <button
          onClick={handleKnow}
          className="px-8 py-4 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors"
        >
          覚えた →
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-gray-500">
        💡 「覚えた」を押すと経験値+10 XP獲得！
      </div>
    </div>
  );
}
