'use client';

import Link from 'next/link';

/**
 * Offline Page
 * Displayed by Service Worker when the user is offline and no cached version is available
 * Task IDs: PWA-002
 */
export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Offline Icon */}
        <div className="flex justify-center">
          <svg
            className="w-24 h-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            オフラインです
          </h1>
          <p className="text-gray-600">
            インターネット接続を確認してください
          </p>
        </div>

        {/* Offline Features */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <h2 className="font-semibold text-blue-900 mb-2 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            オフラインで利用可能な機能
          </h2>
          <ul className="text-sm text-blue-800 space-y-1 ml-7">
            <li>キャッシュ済みのフラッシュカード</li>
            <li>保存済みの単語リスト</li>
            <li>学習進捗の表示</li>
            <li>アルファベット学習（音声キャッシュ済み）</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            再読み込み
          </button>

          <Link
            href="/"
            className="block w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ホームに戻る
          </Link>
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-500 pt-4">
          <p>
            オンラインに戻ると、自動的にデータが同期されます
          </p>
        </div>
      </div>
    </div>
  );
}
