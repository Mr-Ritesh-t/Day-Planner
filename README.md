# Couple's Study Sanctuary / Day-Planner

A cross-platform productivity and academic planning application built for couples and study partners. Designed to help users manage their academic life, track progress, collaborate, and manage their time effectively.

## 📱 Tech Stack
- **Frontend Framework:** React 19 with Vite
- **Native Wrapper:** Capacitor v8 (transforms the web app into a native Android app)
- **Backend & Database:** Firebase v12 (Hosting, Cloud Functions, Firestore/Auth)
- **Linting:** ESLint v9

## ✨ Key Features

### ⏱️ Time Management & Focus
- **Pomodoro Timer:** Built-in timer for the Pomodoro study technique.
- **Focus Tracker:** Tracks deep focus sessions.
- **Exam Countdown:** Visual countdowns for upcoming important dates.
- **Native Alarms:** System-level native Android alarms and local notifications using Capacitor.

### 📚 Academic Tracking
- **Coursework Management:** Tools to track assignments and syllabi.
- **Timetable:** Manage daily school or college schedules.
- **Goal Setting:** Weekly goals and retrospective reports.

### 🤝 Collaboration (Couples Features)
- **Shared Whiteboard:** Real-time collaborative space for both partners.
- **Study Leaderboard:** Gamified tracking between users.
- **Profile Switcher:** Easily switch between couple's profiles or a shared view.

### 🧘 Wellness & AI
- **Mood & Energy Log:** Track daily well-being.
- **AI Study Tips:** Integrated AI-generated tips to optimize studying.

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Android Studio (for native Android builds)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the web development server:
   ```bash
   npm run dev
   ```

### Building for Android
1. Build the web assets:
   ```bash
   npm run build
   ```
2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```
