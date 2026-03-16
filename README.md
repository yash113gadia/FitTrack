# Whole Fit

AI-powered nutrition tracking app for iOS and Android. Snap a photo of your food, scan a barcode, or log meals manually — Whole Fit handles the rest.

## Features

- **AI Food Recognition** — Point your camera at any meal and get instant calorie/macro estimates via Google Gemini Vision
- **Barcode Scanner** — Look up packaged foods through OpenFoodFacts
- **Daily Dashboard** — Animated progress rings for calories, protein, carbs, and fats
- **Meal History & Analytics** — Charts and trends over time (Gifted Charts)
- **AI Nutrition Chatbot** — Ask questions, get meal suggestions, track goals conversationally
- **AI Body Scan** — Visual body composition estimates from photos
- **Muscle League** — Gamification system with streaks, XP, and leaderboards
- **Community Feed** — Share meals and progress with other users
- **Personal Records** — Track PRs across nutrition and fitness milestones
- **Reminders** — Push notifications for meals and water intake
- **Fully Offline** — All data stored locally in SQLite; works without internet
- **Dark Mode** — Follows system preference or manual toggle
- **Premium Tier** — Extended AI message limits and advanced features

## Tech Stack

| Layer | Tools |
|-------|-------|
| Framework | React Native 0.81, Expo SDK 54, TypeScript |
| Styling | NativeWind (Tailwind for RN), Reanimated |
| Navigation | React Navigation v6 |
| State | Zustand + Immer |
| Database | Expo SQLite |
| AI | Google Gemini (`@google/generative-ai`) |
| Food Data | OpenFoodFacts API |
| Charts | Gifted Charts |
| Testing | Jest (unit), Detox (E2E) |

## Getting Started

**Prerequisites:** Node.js 18+, an Expo account, and a [Gemini API key](https://ai.google.dev/).

```bash
# Clone and install
git clone <repo-url> && cd FitTrack
npm install

# Add your Gemini key in app.json → expo.extra.geminiApiKey
# or update src/services/geminiAPI.ts directly

# Start dev server
npx expo start

# Run on device/simulator
npx expo run:ios       # iOS simulator
npx expo run:android   # Android emulator
```

For development builds with native modules (camera, notifications, SQLite):

```bash
npm run dev   # starts with expo-dev-client
```

## Project Structure

```
src/
  components/    UI components (progress rings, food cards, etc.)
  screens/       All app screens
  navigation/    Tab and stack navigators
  services/      Gemini API, OpenFoodFacts, SQLite queries
  store/         Zustand stores (meals, user, settings)
  hooks/         Custom React hooks
  analytics/     Tracking and chart logic
  constants/     App-wide constants and config
  types/         TypeScript type definitions
  utils/         Helpers and validators
  data/          Static/seed data
e2e/             Detox end-to-end tests
assets/          Icons, splash screen, fonts
```

## License

MIT
