# FitTrack

FitTrack is a comprehensive nutrition tracking application built with React Native, Expo, and TypeScript.

## Features

- **Food Logging**: Scan barcodes, take photos (AI analysis), or manually log food.
- **Dashboard**: View daily calorie and macro progress.
- **History**: Review past food logs.
- **AI Assistant**: Chat with a Gemini-powered assistant for nutrition advice.
- **Profile**: Manage your goals and settings.

## Tech Stack

- **Framework**: React Native (Expo SDK 50+)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Database**: Expo SQLite
- **API**: Gemini API, OpenFoodFacts
- **Validation**: Zod

## Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- Expo Go app on your mobile device or Android/iOS simulator.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    -   Get a Gemini API key from Google AI Studio.
    -   Update `src/services/geminiAPI.ts` with your API key.

3.  **Run the App**:
    ```bash
    npx expo start
    ```
    -   Press `a` for Android Emulator.
    -   Press `i` for iOS Simulator.
    -   Scan the QR code with Expo Go on your physical device.

## Project Structure

- `src/components`: Reusable UI components.
- `src/screens`: Application screens.
- `src/navigation`: Navigation configuration.
- `src/services`: API and database services.
- `src/store`: Global state management (Zustand).
- `src/utils`: Helper functions and validators.

## License

MIT
