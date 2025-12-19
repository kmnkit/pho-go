'use client';

import { useState, useCallback, memo } from 'react';
import alphabetData from '@/data/alphabet.json';
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer';

interface AlphabetLetter {
  letter: string;
  uppercase: string;
  lowercase: string;
  pronunciation: string;
  audio_url: string;
  examples: string[];
}

interface LetterButtonProps {
  letter: AlphabetLetter;
  isSelected: boolean;
  onClick: (letter: AlphabetLetter) => void;
}

// Memoized LetterButton component
const LetterButton = memo<LetterButtonProps>(function LetterButton({
  letter,
  isSelected,
  onClick,
}) {
  const handleClick = useCallback(() => {
    onClick(letter);
  }, [letter, onClick]);

  return (
    <button
      onClick={handleClick}
      className={`
        aspect-square rounded-lg border-2 transition-all
        hover:scale-110 hover:shadow-lg hover:border-primary-500
        flex items-center justify-center text-2xl font-bold
        ${
          isSelected
            ? 'bg-primary-500 text-white border-primary-600'
            : 'bg-white text-gray-900 border-gray-200'
        }
      `}
    >
      {letter.letter}
    </button>
  );
});

export default function AlphabetPage() {
  const [selectedLetter, setSelectedLetter] = useState<AlphabetLetter | null>(null);

  // Memoize the close handler
  const handleClose = useCallback(() => {
    setSelectedLetter(null);
  }, []);

  // Memoize the letter selection handler
  const handleLetterClick = useCallback((letter: AlphabetLetter) => {
    setSelectedLetter(letter);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ベトナム語アルファベット
        </h1>
        <p className="text-gray-600">
          29文字のベトナム語アルファベットをマスターしましょう。各文字をクリックして詳細を確認できます。
        </p>
      </div>

      {/* Alphabet Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-3 mb-8">
        {alphabetData.map((letter) => (
          <LetterButton
            key={letter.letter}
            letter={letter}
            isSelected={selectedLetter?.letter === letter.letter}
            onClick={handleLetterClick}
          />
        ))}
      </div>

      {/* Letter Detail Card */}
      {selectedLetter && (
        <LetterDetailCard letter={selectedLetter} onClose={handleClose} />
      )}

      {/* Guide Section */}
      {!selectedLetter && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            💡 学習のヒント
          </h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>ベトナム語には29文字のアルファベットがあります</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>特殊文字（Ă、Â、Đ、Ê、Ô、Ơ、Ư）に注意しましょう</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>各文字をクリックして発音を聞いてみましょう</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>例文を見て、実際の使い方を確認しましょう</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

interface LetterDetailCardProps {
  letter: AlphabetLetter;
  onClose: () => void;
}

// Memoized LetterDetailCard component
const LetterDetailCard = memo<LetterDetailCardProps>(
  function LetterDetailCard({ letter, onClose }) {
    const { play, isPlaying } = useAudioPlayer(letter.audio_url);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 mb-8 border-2 border-primary-200">
      {/* Header with Close Button */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="text-6xl font-bold text-primary-600">
            {letter.letter}
          </div>
          <div>
            <p className="text-sm text-gray-500">大文字・小文字</p>
            <p className="text-xl font-semibold text-gray-900">
              {letter.uppercase} / {letter.lowercase}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      {/* Pronunciation Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">発音</h3>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-blue-600">
            {letter.pronunciation}
          </div>
          <button
            onClick={play}
            disabled={isPlaying}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all
              ${
                isPlaying
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md'
              }
            `}
          >
            {isPlaying ? '🔊 再生中...' : '🔊 音声を聞く'}
          </button>
        </div>
      </div>

      {/* Examples Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          例 (この文字を含む単語)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {letter.examples.map((example, index) => (
            <div
              key={index}
              className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200"
            >
              <p className="text-gray-900 font-medium">{example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Hint */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          他の文字を選択するには、上のグリッドをクリックしてください
        </p>
      </div>
    </div>
  );
});
