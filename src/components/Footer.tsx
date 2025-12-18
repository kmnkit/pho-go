import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto" aria-label="フッター">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Việt Pocket について
            </h3>
            <p className="text-sm text-gray-600">
              初心者向けのベトナム語学習アプリ。楽しく単語やフレーズを習得しましょう。
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="フッタークイックリンク">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              クイックリンク
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/learn/alphabet"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  アルファベット学習
                </Link>
              </li>
              <li>
                <Link
                  href="/flashcards"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  単語カード
                </Link>
              </li>
              <li>
                <Link
                  href="/quiz"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  クイズ
                </Link>
              </li>
              <li>
                <Link
                  href="/progress"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  学習統計
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="フッターリソースリンク">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              リソース
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600"
                  aria-label="GitHub（新しいタブで開く）"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  このアプリについて
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            &copy; {currentYear} Việt Pocket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
