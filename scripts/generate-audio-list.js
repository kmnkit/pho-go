#!/usr/bin/env node

/**
 * Generate Audio Files List
 *
 * This script generates a complete list of audio files needed for the Vietnamese learning app.
 * It reads all data files and extracts audio_url fields to create a comprehensive checklist.
 *
 * Usage:
 *   node scripts/generate-audio-list.js
 *
 * Output:
 *   - audio-files-needed.txt: List of all required audio file paths
 *   - audio-files-checklist.md: Markdown checklist for tracking progress
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load data files
function loadDataFiles() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');

  try {
    const alphabetData = require(path.join(dataDir, 'alphabet.json'));
    const tonesData = require(path.join(dataDir, 'tones.json'));

    const wordsCategories = ['greetings', 'numbers', 'daily', 'food', 'business'];
    const wordsData = {};

    wordsCategories.forEach(category => {
      wordsData[category] = require(path.join(dataDir, 'words', `${category}.json`));
    });

    return { alphabetData, tonesData, wordsData };
  } catch (error) {
    log(`Error loading data files: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Extract audio URLs from data
function extractAudioUrls(data) {
  const { alphabetData, tonesData, wordsData } = data;
  const audioFiles = {
    alphabet: [],
    tones: [],
    words: {
      greetings: [],
      numbers: [],
      daily: [],
      food: [],
      business: [],
    },
  };

  // Alphabet audio files
  alphabetData.forEach(letter => {
    if (letter.audio_url) {
      audioFiles.alphabet.push({
        url: letter.audio_url,
        description: `${letter.letter} - ${letter.pronunciation}`,
        letter: letter.letter,
      });
    }
  });

  // Tones audio files
  tonesData.forEach(tone => {
    if (tone.audio_url) {
      audioFiles.tones.push({
        url: tone.audio_url,
        description: `${tone.name} (${tone.vietnamese_name})`,
        id: tone.id,
      });
    }
  });

  // Words audio files
  Object.keys(wordsData).forEach(category => {
    wordsData[category].forEach(word => {
      if (word.audio_url) {
        audioFiles.words[category].push({
          url: word.audio_url,
          description: `${word.vietnamese} - ${word.japanese}`,
          id: word.id,
        });
      }
    });
  });

  return audioFiles;
}

// Generate plain text list
function generateTextList(audioFiles) {
  const lines = [];

  lines.push('# Audio Files Needed for Vietnamese Learning App');
  lines.push('# Generated on: ' + new Date().toISOString());
  lines.push('');

  // Alphabet
  lines.push('# Alphabet (29 files)');
  audioFiles.alphabet.forEach(file => {
    lines.push(file.url);
  });
  lines.push('');

  // Tones
  lines.push('# Tones (6 files)');
  audioFiles.tones.forEach(file => {
    lines.push(file.url);
  });
  lines.push('');

  // Words
  Object.keys(audioFiles.words).forEach(category => {
    lines.push(`# Words - ${category} (${audioFiles.words[category].length} files)`);
    audioFiles.words[category].forEach(file => {
      lines.push(file.url);
    });
    lines.push('');
  });

  return lines.join('\n');
}

// Generate Markdown checklist
function generateMarkdownChecklist(audioFiles) {
  const lines = [];

  lines.push('# Audio Files Checklist');
  lines.push('');
  lines.push('Generated on: ' + new Date().toLocaleString('ja-JP'));
  lines.push('');
  lines.push('## 📊 Summary');
  lines.push('');

  const alphabetCount = audioFiles.alphabet.length;
  const tonesCount = audioFiles.tones.length;
  const wordsCount = Object.values(audioFiles.words).reduce((sum, arr) => sum + arr.length, 0);
  const totalCount = alphabetCount + tonesCount + wordsCount;

  lines.push(`- **Total Files**: ${totalCount}`);
  lines.push(`- **Alphabet**: ${alphabetCount} files`);
  lines.push(`- **Tones**: ${tonesCount} files`);
  lines.push(`- **Words**: ${wordsCount} files`);
  lines.push('');

  // Alphabet section
  lines.push('## 🔤 Alphabet Files (29)');
  lines.push('');
  audioFiles.alphabet.forEach(file => {
    lines.push(`- [ ] \`${file.url}\` - ${file.description}`);
  });
  lines.push('');

  // Tones section
  lines.push('## 🎵 Tones Files (6)');
  lines.push('');
  audioFiles.tones.forEach(file => {
    lines.push(`- [ ] \`${file.url}\` - ${file.description}`);
  });
  lines.push('');

  // Words sections
  lines.push('## 📚 Words Files');
  lines.push('');

  Object.keys(audioFiles.words).forEach(category => {
    const categoryWords = audioFiles.words[category];
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    lines.push(`### ${categoryName} (${categoryWords.length} files)`);
    lines.push('');
    categoryWords.forEach(file => {
      lines.push(`- [ ] \`${file.url}\` - ${file.description}`);
    });
    lines.push('');
  });

  // Instructions
  lines.push('## 📝 Instructions');
  lines.push('');
  lines.push('1. Check off items as you create/acquire each audio file');
  lines.push('2. Place files in the corresponding directory under `public/audio/`');
  lines.push('3. Ensure file names match exactly (case-sensitive)');
  lines.push('4. Recommended format: MP3, 128kbps, mono, 44.1kHz');
  lines.push('5. Test playback in the app after adding files');
  lines.push('');
  lines.push('## 🎙️ Generation Methods');
  lines.push('');
  lines.push('- **TTS Services**: Google Cloud TTS, Azure Cognitive Services, AWS Polly');
  lines.push('- **Recording**: Native speaker recordings (highest quality)');
  lines.push('- **Placeholder**: Temporary silent/beep files for development');
  lines.push('');

  return lines.join('\n');
}

// Check if audio files exist
function checkExistingFiles(audioFiles) {
  const publicDir = path.join(__dirname, '..', 'public');
  const stats = {
    total: 0,
    existing: 0,
    missing: 0,
  };

  const allUrls = [
    ...audioFiles.alphabet.map(f => f.url),
    ...audioFiles.tones.map(f => f.url),
    ...Object.values(audioFiles.words).flatMap(arr => arr.map(f => f.url)),
  ];

  stats.total = allUrls.length;

  allUrls.forEach(url => {
    const filePath = path.join(publicDir, url);
    if (fs.existsSync(filePath)) {
      stats.existing++;
    } else {
      stats.missing++;
    }
  });

  return stats;
}

// Main execution
function main() {
  log('🎵 Audio Files List Generator', 'bright');
  log('================================', 'blue');
  log('');

  // Load data
  log('Loading data files...', 'yellow');
  const data = loadDataFiles();
  log('✓ Data files loaded', 'green');
  log('');

  // Extract audio URLs
  log('Extracting audio URLs...', 'yellow');
  const audioFiles = extractAudioUrls(data);
  log('✓ Audio URLs extracted', 'green');
  log('');

  // Generate outputs
  log('Generating output files...', 'yellow');

  const textList = generateTextList(audioFiles);
  const markdownChecklist = generateMarkdownChecklist(audioFiles);

  const outputDir = path.join(__dirname, '..');
  const textPath = path.join(outputDir, 'audio-files-needed.txt');
  const markdownPath = path.join(outputDir, 'audio-files-checklist.md');

  fs.writeFileSync(textPath, textList, 'utf8');
  fs.writeFileSync(markdownPath, markdownChecklist, 'utf8');

  log('✓ Files generated:', 'green');
  log(`  - ${path.relative(process.cwd(), textPath)}`, 'blue');
  log(`  - ${path.relative(process.cwd(), markdownPath)}`, 'blue');
  log('');

  // Check existing files
  log('Checking existing audio files...', 'yellow');
  const stats = checkExistingFiles(audioFiles);
  log('');
  log('📊 Audio Files Status:', 'bright');
  log(`  Total required: ${stats.total}`, 'blue');
  log(`  Existing: ${stats.existing}`, 'green');
  log(`  Missing: ${stats.missing}`, stats.missing > 0 ? 'red' : 'green');
  log('');

  if (stats.missing > 0) {
    log('⚠️  Audio files are missing. Please generate or acquire them.', 'yellow');
    log('   See public/audio/README.md for instructions.', 'yellow');
  } else {
    log('✅ All audio files are present!', 'green');
  }

  log('');
  log('Done! 🎉', 'green');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { loadDataFiles, extractAudioUrls, generateTextList, generateMarkdownChecklist };
