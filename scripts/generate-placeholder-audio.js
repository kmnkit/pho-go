#!/usr/bin/env node

/**
 * Generate Placeholder Audio Files
 *
 * This script generates silent placeholder MP3 files for development and testing.
 * These files allow developers to test audio functionality without actual recordings.
 *
 * Usage:
 *   node scripts/generate-placeholder-audio.js [options]
 *
 * Options:
 *   --all          Generate all placeholder files (235 files)
 *   --alphabet     Generate alphabet files only (29 files)
 *   --tones        Generate tones files only (6 files)
 *   --words        Generate words files only (~200 files)
 *   --category=X   Generate files for specific category (greetings, numbers, daily, food, business)
 *
 * Note: This script creates tiny silent MP3 files (~1KB each) as placeholders.
 *       Replace with actual audio files for production.
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
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Minimal silent MP3 file (base64 encoded)
// This is a tiny valid MP3 file with silence (~0.025 seconds)
const SILENT_MP3_BASE64 =
  '//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAEsADA' +
  'wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD' +
  'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM' +
  'DAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' +
  'MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD' +
  'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM' +
  'DAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' +
  'MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD' +
  'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' +
  'MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD' +
  'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM' +
  'DAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' +
  'MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD' +
  'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' +
  'MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  '//sQxAAAAAANIAAAAAAlEAAAAAAAABLgAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

// Load data files to get audio URLs
function loadAudioUrls() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');

  try {
    const alphabetData = require(path.join(dataDir, 'alphabet.json'));
    const tonesData = require(path.join(dataDir, 'tones.json'));

    const wordsCategories = ['greetings', 'numbers', 'daily', 'food', 'business'];
    const wordsData = {};

    wordsCategories.forEach(category => {
      wordsData[category] = require(path.join(dataDir, 'words', `${category}.json`));
    });

    const urls = {
      alphabet: alphabetData.map(item => item.audio_url).filter(Boolean),
      tones: tonesData.map(item => item.audio_url).filter(Boolean),
      words: {},
    };

    wordsCategories.forEach(category => {
      urls.words[category] = wordsData[category].map(item => item.audio_url).filter(Boolean);
    });

    return urls;
  } catch (error) {
    log(`Error loading data files: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Create placeholder MP3 file
function createPlaceholderFile(filePath) {
  const dir = path.dirname(filePath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write silent MP3 file
  const buffer = Buffer.from(SILENT_MP3_BASE64, 'base64');
  fs.writeFileSync(filePath, buffer);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    alphabet: false,
    tones: false,
    words: false,
    category: null,
  };

  if (args.length === 0) {
    options.all = true; // Default: generate all
  } else {
    args.forEach(arg => {
      if (arg === '--all') options.all = true;
      else if (arg === '--alphabet') options.alphabet = true;
      else if (arg === '--tones') options.tones = true;
      else if (arg === '--words') options.words = true;
      else if (arg.startsWith('--category=')) {
        options.category = arg.split('=')[1];
      } else {
        log(`Unknown option: ${arg}`, 'red');
        log('Usage: node scripts/generate-placeholder-audio.js [--all|--alphabet|--tones|--words|--category=X]', 'yellow');
        process.exit(1);
      }
    });
  }

  // If --all is set, enable everything
  if (options.all) {
    options.alphabet = true;
    options.tones = true;
    options.words = true;
  }

  return options;
}

// Generate placeholder files based on options
function generatePlaceholders(urls, options) {
  const publicDir = path.join(__dirname, '..', 'public');
  let totalGenerated = 0;
  let totalSkipped = 0;

  // Generate alphabet files
  if (options.alphabet) {
    log('Generating alphabet placeholder files...', 'yellow');
    urls.alphabet.forEach(url => {
      const filePath = path.join(publicDir, url);
      if (fs.existsSync(filePath)) {
        totalSkipped++;
      } else {
        createPlaceholderFile(filePath);
        totalGenerated++;
      }
    });
    log(`✓ Alphabet: ${totalGenerated} created, ${totalSkipped} skipped`, 'green');
    totalSkipped = 0;
    totalGenerated = 0;
  }

  // Generate tones files
  if (options.tones) {
    log('Generating tones placeholder files...', 'yellow');
    urls.tones.forEach(url => {
      const filePath = path.join(publicDir, url);
      if (fs.existsSync(filePath)) {
        totalSkipped++;
      } else {
        createPlaceholderFile(filePath);
        totalGenerated++;
      }
    });
    log(`✓ Tones: ${totalGenerated} created, ${totalSkipped} skipped`, 'green');
    totalSkipped = 0;
    totalGenerated = 0;
  }

  // Generate words files
  if (options.words || options.category) {
    const categories = options.category
      ? [options.category]
      : Object.keys(urls.words);

    categories.forEach(category => {
      if (!urls.words[category]) {
        log(`Category '${category}' not found. Available: ${Object.keys(urls.words).join(', ')}`, 'red');
        return;
      }

      log(`Generating ${category} placeholder files...`, 'yellow');
      urls.words[category].forEach(url => {
        const filePath = path.join(publicDir, url);
        if (fs.existsSync(filePath)) {
          totalSkipped++;
        } else {
          createPlaceholderFile(filePath);
          totalGenerated++;
        }
      });
      log(`✓ ${category}: ${totalGenerated} created, ${totalSkipped} skipped`, 'green');
      totalSkipped = 0;
      totalGenerated = 0;
    });
  }
}

// Main execution
function main() {
  log('🔇 Placeholder Audio Generator', 'bright');
  log('================================', 'blue');
  log('');

  const options = parseArgs();

  log('Options:', 'cyan');
  log(`  Alphabet: ${options.alphabet}`, 'blue');
  log(`  Tones: ${options.tones}`, 'blue');
  log(`  Words: ${options.words}`, 'blue');
  if (options.category) {
    log(`  Category: ${options.category}`, 'blue');
  }
  log('');

  // Load audio URLs
  log('Loading audio URLs from data files...', 'yellow');
  const urls = loadAudioUrls();
  log('✓ Audio URLs loaded', 'green');
  log('');

  // Generate placeholders
  generatePlaceholders(urls, options);

  log('');
  log('✅ Placeholder generation complete!', 'green');
  log('');
  log('⚠️  Note: These are silent placeholder files for development only.', 'yellow');
  log('   Replace with actual audio files for production.', 'yellow');
  log('   See public/audio/README.md for instructions.', 'yellow');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createPlaceholderFile, loadAudioUrls };
