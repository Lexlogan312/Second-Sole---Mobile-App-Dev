# Second Sole

A cross-platform shoe marketplace and running community app built with React + Vite and [Capacitor](https://capacitorjs.com/). Runs on the **web**, **iOS** (via Xcode Simulator), and **Android** (via Android Studio Emulator).

---

## Features

- **Authentication** — Multi-account login with biometric auth support
- **Home** — Personalized dashboard with curated picks and community highlights
- **Shoe Finder** — Quiz-style tool that filters the shop to your perfect match
- **Shop** — Browse the full inventory with filtering, search, and detailed product pages
- **Cart** — Add items and manage your order
- **Explore** — Local running trails and community group run events with RSVP
- **Profile** — Account settings, order history, and logout

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Node.js](https://nodejs.org/) (v18+) | JavaScript runtime |
| [Xcode](https://developer.apple.com/xcode/) (macOS only) | iOS simulator |
| [Android Studio](https://developer.android.com/studio) | Android emulator |
| [Capacitor CLI](https://capacitorjs.com/docs/cli) | Native project sync (`npx cap`) |

---

## Installation

```bash
npm install
```

---

## Running on the Web

The fastest way to get started — no native tooling needed.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Hot-reload is enabled.

---

## Running on iOS (Xcode Simulator)

> **macOS only.** Requires Xcode with at least one simulator installed.

1. **Build the web assets:**
   ```bash
   npm run build
   ```

2. **Sync to the native iOS project:**
   ```bash
   npx cap sync ios
   ```

3. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

4. In Xcode, select a simulator (e.g. *iPhone 16*) from the device picker and press **Run (▶)**.

> **Tip:** After any code change, re-run `npm run build && npx cap sync ios` to push updates to the native project.

---

## Running on Android (Android Studio Emulator)

> Requires Android Studio with at least one AVD (Android Virtual Device) configured.

1. **Build the web assets:**
   ```bash
   npm run build
   ```

2. **Sync to the native Android project:**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

4. In Android Studio, select an emulator from the device picker and press **Run (▶)**.

> **Tip:** After any code change, re-run `npm run build && npx cap sync android` to push updates to the native project.

---

## Project Structure

```
├── views/          # Screen-level components (Home, Shop, Auth, etc.)
├── components/     # Shared UI components (Layout, nav bar, etc.)
├── services/       # Local storage and data services
├── constants.ts    # Full shoe inventory data
├── theme.ts        # Centralized color theme
├── types.ts        # TypeScript type definitions
├── ios/            # Native iOS project (Xcode)
├── android/        # Native Android project (Android Studio)
└── capacitor.config.ts  # Capacitor configuration
```

---

## Building for Production

```bash
npm run build
```

Output is written to `dist/`. This folder is what Capacitor copies into the native projects on `cap sync`.
