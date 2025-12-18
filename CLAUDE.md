# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Việt Pocket is a Next.js 14 web application for Japanese business professionals learning Vietnamese. It features gamification elements, progress tracking, and multiple learning modes (flashcards, quizzes, alphabet/tone learning).

## Essential Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Create production build
npm run lint         # Run ESLint for code quality
npm run type-check   # TypeScript type checking
```

### Testing
```bash
npm run test:e2e:ui  # Run E2E tests with UI (recommended for debugging)
npm run test:e2e     # Run E2E tests headless
```

Always run lint and type-check before completing any task to ensure code quality.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom color scheme (primary: red, secondary: yellow, accent: blue)
- **State**: Zustand with localStorage persistence
- **Audio**: Howler.js for pronunciation playback
- **Testing**: Playwright for E2E tests

### Directory Structure
```
src/
├── app/          # App Router pages
├── components/   # Reusable React components  
├── data/         # Static JSON data (words, categories)
├── lib/          # Utilities and custom hooks
├── stores/       # Zustand state management
└── types/        # TypeScript type definitions
```

### Key Routes
- `/` - Home page
- `/flashcards/[category]` - Category-specific flashcard learning
- `/quiz/[type]` - Quiz modes (ja-to-vi, vi-to-ja, listening)
- `/learn/alphabet` - Vietnamese alphabet with audio
- `/learn/tones` - Tone learning and quiz
- `/progress` - User statistics and progress tracking

### State Management (Zustand)
The main store is `userProgressStore` (src/stores/userProgressStore.ts) which tracks:
- Learned words by category
- XP and levels (100 XP = 1 level)
- Study streaks
- Session history

### Data Structure
- 5 categories: greetings, numbers, daily, food, business
- ~200 total words with Japanese/Vietnamese translations
- 29 Vietnamese alphabet letters
- 6 Vietnamese tones

## Development Guidelines

### Code Conventions
- Use existing component patterns in src/components/
- Follow the established Tailwind class ordering
- Maintain TypeScript strict mode compliance
- Use path alias `@/` for imports from src/

### Testing Approach
- E2E tests cover main user flows
- Test files in e2e/ directory
- Run `npm run test:e2e:ui` for debugging test failures

### Performance Considerations
- Images use next/image with optimization
- Static assets have cache headers configured
- Build removes console logs in production
- Uses SWC for fast compilation

### Accessibility
- All interactive elements have ARIA labels
- Skip links for keyboard navigation
- Focus indicators on all interactive elements
- Color contrast meets WCAG standards

## Common Tasks

### Adding New Words
1. Edit the appropriate category file in src/data/categories/
2. Follow the existing Word type structure
3. Ensure Japanese and Vietnamese translations are provided

### Creating New Quiz Types
1. Add new route in src/app/quiz/
2. Use existing quiz components as reference
3. Update navigation in quiz selection page
4. Add E2E tests for the new quiz flow

### Modifying Gamification
- XP values are defined in component logic
- Level calculation: Math.floor(xp / 100)
- Streak logic in userProgressStore

## Deployment
The app deploys automatically to Vercel on push to main branch. E2E tests run in CI before deployment.