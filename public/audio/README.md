# 音声ファイルディレクトリ

このディレクトリには、ベトナム語学習アプリで使用する音声ファイルが配置されます。

## 📁 ディレクトリ構造

```
public/audio/
├── alphabet/          # ベトナム語アルファベット（29文字）
├── tones/            # 声調（6種類）
└── words/            # 単語の発音
    ├── greetings/    # 挨拶カテゴリー
    ├── numbers/      # 数字カテゴリー
    ├── daily/        # 日常会話カテゴリー
    ├── food/         # 食べ物カテゴリー
    └── business/     # ビジネスカテゴリー
```

## 🎵 必要な音声ファイル

### アルファベット (29ファイル)
`alphabet/` ディレクトリに以下のファイルを配置：

- `a.mp3` - A (ア)
- `a-breve.mp3` - Ă (ア短く)
- `a-circumflex.mp3` - Â (ウ曖昧)
- `b.mp3` - B (ブ)
- `c.mp3` - C (ク)
- `d.mp3` - D (ズ)
- `d-stroke.mp3` - Đ (ド)
- `e.mp3` - E (エ)
- `e-circumflex.mp3` - Ê (エ曖昧)
- `g.mp3` - G (グ)
- `h.mp3` - H (ハ)
- `i.mp3` - I (イ)
- `k.mp3` - K (ク)
- `l.mp3` - L (ル)
- `m.mp3` - M (ム)
- `n.mp3` - N (ヌ)
- `o.mp3` - O (オ)
- `o-circumflex.mp3` - Ô (オ曖昧)
- `o-horn.mp3` - Ơ (ウ)
- `p.mp3` - P (プ)
- `q.mp3` - Q (ク)
- `r.mp3` - R (ル/ザ)
- `s.mp3` - S (ス)
- `t.mp3` - T (ト)
- `u.mp3` - U (ウ)
- `u-circumflex.mp3` - Ư (ウ曖昧)
- `v.mp3` - V (ヴ)
- `x.mp3` - X (ス)
- `y.mp3` - Y (イ)

### 声調 (6ファイル)
`tones/` ディレクトリに以下のファイルを配置：

- `ngang.mp3` - 平声 (Thanh ngang)
- `sac.mp3` - 鋭声 (Thanh sắc)
- `huyen.mp3` - 玄声 (Thanh huyền)
- `hoi.mp3` - 問声 (Thanh hỏi)
- `nga.mp3` - 跌声 (Thanh ngã)
- `nang.mp3` - 重声 (Thanh nặng)

### 単語 (約200ファイル)

各カテゴリーのディレクトリに単語の音声ファイルを配置します。
ファイル名は `{ベトナム語単語をケバブケースに}.mp3` の形式です。

**例**:
- `words/greetings/xin-chao.mp3` - "Xin chào" (こんにちは)
- `words/greetings/chao-buoi-sang.mp3` - "Chào buổi sáng" (おはようございます)
- `words/numbers/mot.mp3` - "Một" (1)
- `words/food/com.mp3` - "Cơm" (ご飯)

## 📝 ファイル命名規則

### アルファベット
- 基本文字: 小文字のアルファベット (例: `a.mp3`, `b.mp3`)
- 特殊文字:
  - Ă → `a-breve.mp3`
  - Â → `a-circumflex.mp3`
  - Đ → `d-stroke.mp3`
  - Ê → `e-circumflex.mp3`
  - Ô → `o-circumflex.mp3`
  - Ơ → `o-horn.mp3`
  - Ư → `u-circumflex.mp3`

### 声調
- 声調ID (例: `ngang.mp3`, `sac.mp3`)

### 単語
- ベトナム語をケバブケースに変換
- スペースは `-` (ハイフン) に置換
- 声調記号は削除
- 小文字に統一
- 例:
  - "Xin chào" → `xin-chao.mp3`
  - "Cảm ơn" → `cam-on.mp3`
  - "Chào buổi sáng" → `chao-buoi-sang.mp3`

## 🎙️ 音声ファイルの仕様

### 推奨フォーマット
- **フォーマット**: MP3
- **ビットレート**: 128kbps (十分な音質で軽量)
- **サンプリングレート**: 44.1kHz
- **チャンネル**: モノラル (音声学習なので十分)
- **長さ**: 1-3秒程度

### 代替フォーマット (オプション)
より高度な最適化が必要な場合：
- **AAC/M4A**: より高い圧縮率
- **Opus**: Web用に最適化、より小さいファイルサイズ

## 🚀 音声ファイルの作成方法

### 方法1: TTS (Text-to-Speech) サービス
無料または低コストで大量の音声ファイルを生成：
- **Google Cloud Text-to-Speech**: ベトナム語対応、高品質
- **Azure Cognitive Services**: ベトナム語音声合成
- **AWS Polly**: ベトナム語対応

**サンプルスクリプト** (Google Cloud TTS):
```bash
# 例: "Xin chào" の音声を生成
gcloud text-to-speech synthesize \
  --text "Xin chào" \
  --language "vi-VN" \
  --voice-name "vi-VN-Wavenet-A" \
  --output-file "public/audio/words/greetings/xin-chao.mp3"
```

### 方法2: 録音
ネイティブスピーカーによる録音（最高品質）：
1. マイクとオーディオ録音ソフトウェアを準備
2. 静かな環境で録音
3. Audacity などで編集・ノーマライズ
4. MP3 形式でエクスポート

### 方法3: サンプル音声（開発・テスト用）
開発中にテストするための簡易的な音声：
```bash
# macOS/Linux で say コマンドを使用（英語のみ）
say -v "Samantha" "test audio" -o test.aiff
ffmpeg -i test.aiff test.mp3
```

## 📦 一括生成スクリプト (参考)

`scripts/generate-audio-files.js` を作成して、データファイルから音声ファイルのリストを自動生成できます。

```javascript
// 例: 必要な音声ファイルリストを生成
const fs = require('fs');
const path = require('path');

// データファイルを読み込み
const alphabetData = require('../src/data/alphabet.json');
const tonesData = require('../src/data/tones.json');
const categoriesData = require('../src/data/categories.json');

// 必要な音声URLのリストを生成
const audioUrls = [];

alphabetData.forEach(letter => {
  audioUrls.push(letter.audio_url);
});

tonesData.forEach(tone => {
  audioUrls.push(tone.audio_url);
});

// words も同様に処理...

// 音声ファイルリストを出力
fs.writeFileSync(
  'audio-files-needed.txt',
  audioUrls.join('\n')
);
```

## 🔄 PWA キャッシング

音声ファイルは Service Worker によって自動的にキャッシュされます：
- **戦略**: CacheFirst (30日間)
- **パターン**: `/audio/**/*.mp3`
- **設定場所**: `next.config.mjs` の PWA 設定

## ✅ 音声ファイル配置後の確認

1. ファイルが正しいディレクトリに配置されているか確認
2. ファイル名が命名規則に従っているか確認
3. 開発サーバーを起動: `npm run dev`
4. アルファベット学習ページで音声が再生されるか確認
5. 声調学習ページで音声が再生されるか確認
6. フラッシュカード・クイズで音声が再生されるか確認

## 🐛 トラブルシューティング

### 音声が再生されない
1. ブラウザの開発者コンソールでエラーを確認
2. ファイルパスが正しいか確認 (大文字小文字の区別に注意)
3. ファイル形式が MP3 か確認
4. ブラウザが MP3 をサポートしているか確認

### ファイルサイズが大きい
1. ビットレートを下げる (128kbps → 96kbps)
2. モノラルに変換
3. 不要な無音部分をトリミング
4. Opus フォーマットを検討

## 📊 ファイル統計

- **アルファベット**: 29ファイル
- **声調**: 6ファイル
- **単語**: 約200ファイル (5カテゴリー)
- **合計**: 約235ファイル
- **推定サイズ**: 約10-20MB (圧縮時)

---

**注意**: 実際の音声ファイルはこのリポジトリには含まれていません。上記の方法を参考に、音声ファイルを準備してください。
