/**
 * Type definitions for data validation and JSON imports
 */

import type { 
  Word, 
  Category, 
  Alphabet, 
  Tone, 
  CategoryId, 
  DifficultyLevel,
  ToneId 
} from './index';

// ============================================================================
// JSON Data Types (what we actually get from importing JSON files)
// ============================================================================

/**
 * Raw category data from JSON (before type validation)
 */
export interface RawCategoryData {
  readonly id: string;
  readonly name: string;
  readonly name_vietnamese: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
  readonly wordCount: number;
  readonly difficulty: string;
  readonly order: number;
}

/**
 * Raw word data from JSON (before type validation)
 */
export interface RawWordData {
  readonly id: string;
  readonly vietnamese: string;
  readonly japanese: string;
  readonly pronunciation: string;
  readonly audio_url: string;
  readonly category: string;
  readonly difficulty: string;
  readonly example_sentence?: {
    readonly vietnamese: string;
    readonly japanese: string;
  };
}

/**
 * Raw alphabet data from JSON (before type validation)
 */
export interface RawAlphabetData {
  readonly letter: string;
  readonly pronunciation: string;
  readonly audio_url: string;
  readonly examples: readonly string[];
}

/**
 * Raw tone data from JSON (before type validation)
 */
export interface RawToneData {
  readonly id: string;
  readonly name: string;
  readonly vietnamese_name: string;
  readonly symbol: string;
  readonly description: string;
  readonly audio_url: string;
  readonly pattern: string;
  readonly examples: readonly {
    readonly word: string;
    readonly meaning: string;
  }[];
}

// ============================================================================
// Validation Results
// ============================================================================

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: readonly string[] };

/**
 * Validation error details
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value: unknown;
}

// ============================================================================
// Type Guards and Validators
// ============================================================================

/**
 * Type guard to check if a string is a valid CategoryId
 */
export const isValidCategoryId = (value: unknown): value is CategoryId => {
  return typeof value === 'string' && 
    ['greetings', 'numbers', 'daily', 'food', 'business'].includes(value);
};

/**
 * Type guard to check if a string is a valid DifficultyLevel
 */
export const isValidDifficultyLevel = (value: unknown): value is DifficultyLevel => {
  return typeof value === 'string' && 
    ['beginner', 'intermediate', 'advanced'].includes(value);
};

/**
 * Type guard to check if a string is a valid ToneId
 */
export const isValidToneId = (value: unknown): value is ToneId => {
  return typeof value === 'string' && 
    ['ngang', 'huyền', 'sắc', 'hỏi', 'ngã', 'nặng'].includes(value);
};

/**
 * Validate and transform raw category data
 */
export const validateCategory = (raw: unknown): ValidationResult<Category> => {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { success: false, errors: ['Category data must be an object'] };
  }

  const data = raw as RawCategoryData;

  if (!data.id || typeof data.id !== 'string') {
    errors.push('Category ID must be a non-empty string');
  } else if (!isValidCategoryId(data.id)) {
    errors.push(`Invalid category ID: ${data.id}`);
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Category name must be a non-empty string');
  }

  if (!data.name_vietnamese || typeof data.name_vietnamese !== 'string') {
    errors.push('Category Vietnamese name must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('Category description must be a non-empty string');
  }

  if (!data.icon || typeof data.icon !== 'string') {
    errors.push('Category icon must be a non-empty string');
  }

  if (!data.color || typeof data.color !== 'string') {
    errors.push('Category color must be a non-empty string');
  }

  if (typeof data.wordCount !== 'number' || data.wordCount < 0) {
    errors.push('Category word count must be a non-negative number');
  }

  if (!isValidDifficultyLevel(data.difficulty)) {
    errors.push(`Invalid difficulty level: ${data.difficulty}`);
  }

  if (typeof data.order !== 'number') {
    errors.push('Category order must be a number');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: data.id as CategoryId,
      name: data.name,
      name_vietnamese: data.name_vietnamese,
      description: data.description,
      icon: data.icon,
      color: data.color,
      wordCount: data.wordCount,
      difficulty: data.difficulty as DifficultyLevel,
      order: data.order,
    },
  };
};

/**
 * Validate and transform raw word data
 */
export const validateWord = (raw: unknown): ValidationResult<Word> => {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { success: false, errors: ['Word data must be an object'] };
  }

  const data = raw as RawWordData;

  if (!data.id || typeof data.id !== 'string') {
    errors.push('Word ID must be a non-empty string');
  }

  if (!data.vietnamese || typeof data.vietnamese !== 'string') {
    errors.push('Vietnamese text must be a non-empty string');
  }

  if (!data.japanese || typeof data.japanese !== 'string') {
    errors.push('Japanese text must be a non-empty string');
  }

  if (!data.pronunciation || typeof data.pronunciation !== 'string') {
    errors.push('Pronunciation must be a non-empty string');
  }

  if (!data.audio_url || typeof data.audio_url !== 'string') {
    errors.push('Audio URL must be a non-empty string');
  }

  if (!isValidCategoryId(data.category)) {
    errors.push(`Invalid category: ${data.category}`);
  }

  if (!isValidDifficultyLevel(data.difficulty)) {
    errors.push(`Invalid difficulty level: ${data.difficulty}`);
  }

  // Validate example sentence if present
  if (data.example_sentence) {
    if (!data.example_sentence.vietnamese || typeof data.example_sentence.vietnamese !== 'string') {
      errors.push('Example sentence Vietnamese must be a non-empty string');
    }
    if (!data.example_sentence.japanese || typeof data.example_sentence.japanese !== 'string') {
      errors.push('Example sentence Japanese must be a non-empty string');
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: data.id,
      vietnamese: data.vietnamese,
      japanese: data.japanese,
      pronunciation: data.pronunciation,
      audio_url: data.audio_url,
      category: data.category as CategoryId,
      difficulty: data.difficulty as DifficultyLevel,
      example_sentence: data.example_sentence,
    },
  };
};

/**
 * Validate and transform raw alphabet data
 */
export const validateAlphabet = (raw: unknown): ValidationResult<Alphabet> => {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { success: false, errors: ['Alphabet data must be an object'] };
  }

  const data = raw as RawAlphabetData;

  if (!data.letter || typeof data.letter !== 'string') {
    errors.push('Letter must be a non-empty string');
  }

  if (!data.pronunciation || typeof data.pronunciation !== 'string') {
    errors.push('Pronunciation must be a non-empty string');
  }

  if (!data.audio_url || typeof data.audio_url !== 'string') {
    errors.push('Audio URL must be a non-empty string');
  }

  if (!Array.isArray(data.examples)) {
    errors.push('Examples must be an array');
  } else if (data.examples.some(example => typeof example !== 'string')) {
    errors.push('All examples must be strings');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      letter: data.letter,
      pronunciation: data.pronunciation,
      audio_url: data.audio_url,
      examples: data.examples,
    },
  };
};

/**
 * Validate and transform raw tone data
 */
export const validateTone = (raw: unknown): ValidationResult<Tone> => {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { success: false, errors: ['Tone data must be an object'] };
  }

  const data = raw as RawToneData;

  if (!isValidToneId(data.id)) {
    errors.push(`Invalid tone ID: ${data.id}`);
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Tone name must be a non-empty string');
  }

  if (!data.vietnamese_name || typeof data.vietnamese_name !== 'string') {
    errors.push('Vietnamese name must be a non-empty string');
  }

  if (!data.symbol || typeof data.symbol !== 'string') {
    errors.push('Symbol must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description must be a non-empty string');
  }

  if (!data.audio_url || typeof data.audio_url !== 'string') {
    errors.push('Audio URL must be a non-empty string');
  }

  if (!data.pattern || typeof data.pattern !== 'string') {
    errors.push('Pattern must be a non-empty string');
  }

  if (!Array.isArray(data.examples)) {
    errors.push('Examples must be an array');
  } else {
    data.examples.forEach((example, index) => {
      if (!example || typeof example !== 'object') {
        errors.push(`Example ${index} must be an object`);
      } else if (!example.word || typeof example.word !== 'string') {
        errors.push(`Example ${index} word must be a non-empty string`);
      } else if (!example.meaning || typeof example.meaning !== 'string') {
        errors.push(`Example ${index} meaning must be a non-empty string`);
      }
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      id: data.id as ToneId,
      name: data.name,
      vietnamese_name: data.vietnamese_name,
      symbol: data.symbol,
      description: data.description,
      audio_url: data.audio_url,
      pattern: data.pattern,
      examples: data.examples,
    },
  };
};

// ============================================================================
// Utility Functions for Bulk Validation
// ============================================================================

/**
 * Validate an array of raw data items
 */
export const validateDataArray = <T>(
  rawArray: unknown,
  validator: (item: unknown) => ValidationResult<T>,
  itemName: string
): ValidationResult<readonly T[]> => {
  if (!Array.isArray(rawArray)) {
    return { 
      success: false, 
      errors: [`${itemName} data must be an array`] 
    };
  }

  const results: T[] = [];
  const errors: string[] = [];

  rawArray.forEach((item, index) => {
    const result = validator(item);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push(`${itemName} ${index}: ${result.errors.join(', ')}`);
    }
  });

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: results };
};

