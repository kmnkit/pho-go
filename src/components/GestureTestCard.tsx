'use client';

import { useState, useRef, useEffect } from 'react';
import { css } from '@emotion/css';
import { useGestureRecognition, GestureEvent, GestureDirection } from '@/lib/hooks/useGestureRecognition';

/**
 * Test component for gesture recognition
 * Used to validate >95% gesture accuracy requirement
 */
export const GestureTestCard: React.FC = () => {
  const [gestureLog, setGestureLog] = useState<(GestureEvent & { timestamp: Date })[]>([]);
  const [testResults, setTestResults] = useState<{
    total: number;
    successful: number;
    accuracy: number;
  }>({ total: 0, successful: 0, accuracy: 0 });

  const handleGesture = (gesture: GestureEvent) => {
    const timestampedGesture = { ...gesture, timestamp: new Date() };
    setGestureLog(prev => [...prev.slice(-9), timestampedGesture]); // Keep last 10 gestures

    // Update test results
    setTestResults(prev => {
      const newTotal = prev.total + 1;
      const newSuccessful = gesture.confidence > 0.8 ? prev.successful + 1 : prev.successful;
      const newAccuracy = (newSuccessful / newTotal) * 100;
      
      return {
        total: newTotal,
        successful: newSuccessful,
        accuracy: newAccuracy,
      };
    });
  };

  const cardRef = useRef<HTMLDivElement>(null);

  const {
    bindDrag,
    isDragging,
    lastGesture,
    resetPosition,
    getGestureStats,
    animateElement,
  } = useGestureRecognition(
    {
      swipeThreshold: 80, // Slightly lower for testing
      velocityThreshold: 0.2,
      enableHapticFeedback: true,
    },
    handleGesture
  );

  // Connect the element to animation system
  useEffect(() => {
    if (cardRef.current) {
      animateElement(cardRef.current);
    }
  }, [animateElement]);

  const resetTest = () => {
    setGestureLog([]);
    setTestResults({ total: 0, successful: 0, accuracy: 0 });
    resetPosition();
  };

  const getDirectionEmoji = (direction: GestureDirection): string => {
    switch (direction) {
      case GestureDirection.LEFT:
        return '⬅️';
      case GestureDirection.RIGHT:
        return '➡️';
      case GestureDirection.UP:
        return '⬆️';
      case GestureDirection.DOWN:
        return '⬇️';
      default:
        return '❓';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        ジェスチャー認識テスト
      </h2>

      {/* Test Card */}
      <div className="relative h-64 mb-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl overflow-hidden touch-none">
        <div
          ref={cardRef}
          {...bindDrag()}
          className={css`
            position: absolute;
            inset: 1rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            touch-action: none;
            
            ${isDragging && `
              cursor: grabbing;
              box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
            `}
          `}
        >
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-lg font-semibold text-gray-700">
              スワイプしてテスト
            </p>
            {isDragging && (
              <p className="text-sm text-blue-600 mt-2">
                ドラッグ中...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {testResults.accuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">精度</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {testResults.successful}/{testResults.total}
          </div>
          <div className="text-sm text-gray-600">成功/総数</div>
        </div>
      </div>

      {/* Target Achievement */}
      <div className={`
        p-4 rounded-lg text-center mb-4
        ${testResults.accuracy >= 95 
          ? 'bg-green-100 text-green-800 border border-green-300' 
          : testResults.accuracy >= 90
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          : 'bg-gray-100 text-gray-800 border border-gray-300'
        }
      `}>
        {testResults.accuracy >= 95 ? '🎉 目標達成: >95%精度!' : '目標: 95%以上の精度'}
      </div>

      {/* Recent Gestures */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          最近のジェスチャー
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {gestureLog.length === 0 ? (
            <p className="text-gray-500 text-sm">まだジェスチャーがありません</p>
          ) : (
            gestureLog.slice().reverse().map((gesture, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {getDirectionEmoji(gesture.direction)}
                  </span>
                  <span>{gesture.direction}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={getConfidenceColor(gesture.confidence)}>
                    {(gesture.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-gray-400 text-xs">
                    {gesture.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gesture Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">テスト方法:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• カードを上下左右にスワイプ</li>
          <li>• 素早く明確な動作で</li>
          <li>• 95%以上の精度を目指す</li>
          <li>• 片手操作をテスト</li>
        </ul>
      </div>

      {/* Controls */}
      <div className="flex space-x-3">
        <button
          onClick={resetTest}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          リセット
        </button>
        <button
          onClick={() => {
            const stats = getGestureStats();
            console.log('Gesture Statistics:', stats);
            alert(`
統計情報:
精度: ${stats.accuracy.toFixed(1)}%
平均速度: ${stats.averageVelocity.toFixed(2)}
平均応答時間: ${stats.responseTime.toFixed(0)}ms
            `);
          }}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          統計表示
        </button>
      </div>

      {/* Debug Info */}
      {lastGesture && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <strong>最新ジェスチャー:</strong><br />
          方向: {lastGesture.direction} | 
          速度: {lastGesture.velocity.toFixed(2)} | 
          距離: {lastGesture.distance.toFixed(0)}px |
          信頼度: {(lastGesture.confidence * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
};