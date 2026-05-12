# Mini POS - Hybrid Vue + Android Thermal Printing

Point of Sale app built with **Vue 3 + Vite** and wrapped as an **Android app with Capacitor**.  
This project started as a web/PWA cashier app, then evolved into a hybrid Android build so it can print to **Bluetooth thermal ESC/POS printers** directly from a phone.

## Why This Project Matters

This repo is one of my practical portfolio projects focused on a real cashier workflow:

- manage menu and extra items
- create transactions
- record sales to Firebase
- print receipts from desktop and Android
- support thermal Bluetooth printing without rebuilding the UI as a fully native app

## Main Features

- Cashier screen for creating orders quickly
- Menu management
- Sales recap view
- Firebase Firestore integration
- Desktop print via **QZ Tray**
- Android print via **Bluetooth classic ESC/POS**
- Shared receipt formatter for web and Android
- Landscape Android experience for cashier usage

## Tech Stack

- Vue 3
- Vite
- Vue Router
- Firebase / Firestore
- Vite PWA plugin
- Capacitor Android
- Custom native Android Bluetooth print plugin

## Project Modes

### Web / Desktop

- Runs as a Vite app / PWA
- Supports QZ Tray printing
- Keeps browser print as fallback

### Android

- Uses Capacitor wrapper
- Uses a custom plugin to access paired Bluetooth printers
- Prints ESC/POS text receipts directly from the app

## Key Technical Highlights

- **Platform-aware print service**
  One JS service decides whether to print through QZ Tray or the Android Bluetooth bridge.

- **Shared receipt generation**
  The receipt layout is formatted once, then adapted for browser output and ESC/POS raw text.

- **Custom native Android bridge**
  Instead of relying on a random third-party plugin, this project includes a focused native Bluetooth printer plugin for paired thermal devices.

## Important Files

- `src/views/KasirView.vue`  
  Main cashier flow and printer setup UI

- `src/services/printService.js`  
  Platform-aware printing adapter

- `src/services/receipt.js`  
  Receipt HTML and ESC/POS formatter

- `src/plugins/bluetoothPrinter.js`  
  JS bridge registration for Capacitor

- `android/app/src/main/java/com/dcelup/kasir/BluetoothPrinterPlugin.java`  
  Native Android Bluetooth printer implementation

## Local Development

### Run web app

```bash
npm install
npm run dev
```

### Build web app

```bash
npm run build
```

### Build Android debug APK

```bash
npm run android:apk
```

The build helper will:

- build the Vite app
- sync assets into the Capacitor Android project
- use a compatible local JDK when available
- compile a debug APK

APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Android Notes

- Android Studio UI is not required for the workflow used in this repo
- Android SDK command-line tools are still required
- Recommended JDK range for Android build in this project: **JDK 21-24**
- JDK 25 is too new for this Gradle/Groovy setup

## Thermal Printer Notes

- Target printers: **Bluetooth classic ESC/POS**
- The Android app reads printers that are already **paired** in system Bluetooth settings
- This flow is not intended for BLE-only printers

## Repo Notes

The repository intentionally excludes:

- `node_modules`
- built `dist` output
- Android build artifacts
- local SDK / JDK folders
- downloaded ZIP installers
- local machine config such as `android/local.properties`

## Future Improvements

- Add screenshots / demo GIF
- Add release signing flow
- Add printer diagnostics screen
- Improve Android performance further on lower-end devices
- Add export / reporting enhancements
