'use client';

import { useState, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import tonesData from '@/data/tones.json';

// Dynamic import for ToneDetailCard - only loaded when a tone is selected
const ToneDetailCard = dynamic(() => import('@/components/ToneDetailCard'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-xl p-6 mb-8 border-2 border-primary-200 animate-pulse">
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  ),
  ssr: false,
});

interface ToneExample {
  word: string;
  meaning: string;
  pronunciation: string;
}

interface Tone {
  id: string;
  name: string;
  vietnamese_name: string;
  symbol: string;
  description: string;
  audio_url: string;
  pattern: string;
  pitch_level: string;
  examples: ToneExample[];
}

interface ToneCardProps {
  tone: Tone;
  isSelected: boolean;
  onClick: (tone: Tone) => void;
}

// Memoized ToneCard component to prevent unnecessary re-renders
const ToneCard = memo<ToneCardProps>(function ToneCard({
  tone,
  isSelected,
  onClick,
}) {
  const handleClick = useCallback(() => {
    onClick(tone);
  }, [tone, onClick]);

  return (
    <button
      onClick={handleClick}
      className={`
        p-6 rounded-lg border-2 transition-all text-left
        hover:scale-105 hover:shadow-xl
        ${
          isSelected
            ? 'bg-primary-500 text-white border-primary-600 shadow-lg'
            : 'bg-white text-gray-900 border-gray-200 hover:border-primary-400'
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold mb-1">{tone.name}</h3>
          <p
            className={`text-sm ${
              isSelected ? 'text-white/80' : 'text-gray-500'
            }`}
          >
            {tone.vietnamese_name}
          </p>
        </div>
        <div className="text-3xl">{tone.pattern}</div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium ${
            isSelected ? 'text-white' : 'text-gray-600'
          }`}
        >
          記号: {tone.symbol}
        </span>
      </div>
    </button>
  );
});

export default function TonesPage() {
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null);

  // Memoize the tone selection handler
  const handleToneClick = useCallback((tone: Tone) => {
    setSelectedTone(tone);
  }, []);

  // Memoize the close handler
  const handleClose = useCallback(() => {
    setSelectedTone(null);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            ベトナム語の声調
          </h1>
          <Link
            href="/learn/tones/quiz"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
          >
            🎯 クイズに挑戦
          </Link>
        </div>
        <p className="text-gray-600">
          6つの声調を理解することは、ベトナム語習得の重要な第一歩です。同じ音でも声調が違えば意味が変わります。
        </p>
      </div>

      {/* Tones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tonesData.map((tone) => (
          <ToneCard
            key={tone.id}
            tone={tone}
            isSelected={selectedTone?.id === tone.id}
            onClick={handleToneClick}
          />
        ))}
      </div>

      {/* Tone Detail Card */}
      {selectedTone && (
        <ToneDetailCard tone={selectedTone} onClose={handleClose} />
      )}

      {/* Guide Section */}
      {!selectedTone && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            💡 声調学習のポイント
          </h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                ベトナム語には6つの声調（平声、鋭声、玄声、問声、跌声、重声）があります
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                声調を間違えると全く違う意味になります（例：ma=幽霊、má=頬、mà=しかし）
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                まずは音声を繰り返し聞いて、パターンを耳で覚えましょう
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>各声調のカードをクリックして詳細を確認してください</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
