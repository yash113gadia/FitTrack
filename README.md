<div align="center">
  <img src="https://img.shields.io/badge/React_Native-0.73-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_50-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</div>

# 🏋️ WholeFit — AI Nutrition Tracker

> A comprehensive nutrition tracking mobile app with AI-powered food analysis, barcode scanning, and personalized advice

<div align="center">
  <img src="https://img.shields.io/badge/Platform-iOS_|_Android-success?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📸 **AI Food Recognition** | Take a photo, get instant nutritional analysis |
| 🔍 **Barcode Scanner** | Scan products for instant nutrition data |
| 📊 **Dashboard** | Track daily calories and macros visually |
| 📅 **Food History** | Review past meals and patterns |
| 🤖 **AI Assistant** | Chat with Gemini for personalized nutrition advice |
| 👤 **Profile** | Set goals and manage preferences |

---

## 🛠️ Tech Stack

<table>
<tr>
<td>

### Mobile App
- 📱 **React Native** (Expo SDK 50+)
- 📘 **TypeScript** for type safety
- 🎨 **NativeWind** (Tailwind CSS)
- 🧭 **React Navigation v6**
- 🗃️ **Zustand** state management

</td>
<td>

### Backend & APIs
- 🤖 **Gemini AI** for food analysis
- 🍎 **OpenFoodFacts** API
- 📦 **Expo SQLite** local storage
- ✅ **Zod** validation

</td>
</tr>
</table>

---

## 📁 Project Structure

```
FitTrack/
├── 📂 src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API & database services
│   ├── store/           # Zustand state management
│   └── utils/           # Helpers & validators
├── 📂 assets/           # Images & fonts
├── App.tsx              # Entry point
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (LTS)
- Expo Go app on mobile device

### Installation

```bash
# Install dependencies
npm install

# Configure Gemini API key
# Update src/services/geminiAPI.ts with your key

# Start the app
npx expo start
```

| Platform | Action |
|----------|--------|
| 📱 Android | Press `a` for emulator |
| 🍎 iOS | Press `i` for simulator |
| 📲 Physical Device | Scan QR with Expo Go |

---

## 📝 License

MIT © Yash Gadia
