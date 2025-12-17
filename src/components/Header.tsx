'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🇻🇳</span>
              <span className="text-xl font-bold text-primary-600">
                Vietnamese Cards
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/learn/alphabet"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              アルファベット
            </Link>
            <Link
              href="/flashcards"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              単語カード
            </Link>
            <Link
              href="/quiz"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              クイズ
            </Link>
            <Link
              href="/progress"
              className="text-gray-700 hover:text-primary-600 transition-colors"
            >
              学習統計
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">メニューを開く</span>
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link
              href="/learn/alphabet"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              アルファベット
            </Link>
            <Link
              href="/flashcards"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              単語カード
            </Link>
            <Link
              href="/quiz"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              クイズ
            </Link>
            <Link
              href="/progress"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              学習統計
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
