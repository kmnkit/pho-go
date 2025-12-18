import type { Metadata, Viewport } from 'next';
// import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WebVitals from '@/components/WebVitals';
import SkipLink from '@/components/SkipLink';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ベトナム語学習アプリ - Việt Pocket',
    template: '%s | Việt Pocket',
  },
  description:
    '日本のビジネスパーソン向けベトナム語学習アプリ。ゲーミフィケーション要素を取り入れ、楽しくベトナム語の基礎を習得。フラッシュカード、クイズ、進捗管理機能を搭載。',
  keywords: [
    'ベトナム語',
    '学習',
    '単語カード',
    'フラッシュカード',
    'クイズ',
    'ビジネス',
    'Vietnamese',
    'Language Learning',
  ],
  authors: [{ name: 'Việt Pocket' }],
  creator: 'Việt Pocket',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://vietnamese-word-cards.vercel.app',
    title: 'ベトナム語学習アプリ - Việt Pocket',
    description:
      '日本のビジネスパーソン向けベトナム語学習アプリ。楽しくベトナム語の基礎を習得。',
    siteName: 'Việt Pocket',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ベトナム語学習アプリ - Việt Pocket',
    description:
      '日本のビジネスパーソン向けベトナム語学習アプリ。楽しくベトナム語の基礎を習得。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#EF4444',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex flex-col min-h-screen font-sans">
        <WebVitals />
        <KeyboardShortcuts />
        <SkipLink />
        <Header />
        <main id="main-content" className="flex-grow" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
