# iTarab Radio (v3.0)

Cross-platform revival of **iTarab Radio** ([App Store `id625963573`](https://apps.apple.com/us/app/itarab-radio/id625963573)) built with **Expo (React Native + TypeScript)** and **`expo-audio`** for iOS and Android—with **\$0 cloud build costs**.

## Highlights

- **Verified Arabic Station Catalog (`catalog/stations.json`)**: 195 live-probed HTTPS Arabic music and news stations across 4 categories (**Tarab & Classics**, **Arabic Music**, **News & Talk**, and **Variety & FM**), including **Sout Al Khaleej**, **Yemeni stations**, **MBC FM**, **Panorama FM**, **Al Khaleejiya**, **Qatar Radio**, **BBC Arabic**, **Monte Carlo Doualiya**, and **Al Jazeera**.
- **Hand-Curated Priority List (`catalog/curated-stations.json`)**: Add, edit, or reorder flagship stations and backup `fallbackUrls` in one JSON file without touching app code.
- **Daily Over-the-Air Sync + Pull-to-Refresh**: Automatically checks for catalog updates every 24 hours (using `ETag` / `If-None-Match` conditional requests), supports pull-to-refresh in the Stations list, and keeps the bundled catalog as an instant offline fallback.
- **Automatic Fallback Failover**: If a station's primary stream fails or times out, the player automatically tries its `fallbackUrls` before showing an error.
- **Modern Native Audio Engine (`expo-audio`)**: Wraps native `AVPlayer` (iOS) and Media3 `ExoPlayer` (Android) with background playback, Lock Screen / Control Center controls (`isLiveStream: true`), and Android MediaSession foreground notifications.

---

## Local Development (\$0, No Expo Cloud Needed)

> **Important:** Background audio and Lock Screen / notification controls require a native development build (they are disabled in Expo Go).

### Prerequisites on macOS
- Node.js 22+
- Xcode (for iOS simulator / device builds and App Store archiving)
- Android Studio + Android SDK (for Android emulator / device builds and Google Play bundles)

### Run Locally on iOS
```bash
cd itarab-radio
npx expo prebuild --platform ios
npx expo run:ios
```

### Run Locally on Android
```bash
cd itarab-radio
npx expo prebuild --platform android
npx expo run:android
```

---

## Updating Your Existing App Store Listing (`id625963573`)

You can ship this Expo rewrite as an update to the existing App Store listing so users keep their app, reviews, and store ranking:

1. **Match the original Bundle ID:**
   - Configured in `app.json` (`expo.ios.bundleIdentifier`) as `com.almojor.iTarabRadio` to match App Store Connect Apple ID `625963573` (with `version` bumped to `3.0.0` above `2.2.0`).
2. **Generate native iOS project & archive locally in Xcode:**
   ```bash
   npx expo prebuild --platform ios --clean
   open ios/iTarabRadio.xcworkspace
   ```
   - Select your Apple Developer Team under **Signing & Capabilities**.
   - Confirm **Background Modes -> Audio, AirPlay, and Picture in Picture** is enabled (configured automatically via `app.json`).
   - Run **Product -> Archive** and upload directly to App Store Connect.
3. **App Store Connect Compliance Checklist:**
   - Complete **App Privacy** nutrition labels (data is stored locally via AsyncStorage; no user tracking or accounts).
   - Verify **PrivacyInfo.xcprivacy** requirements in Xcode if prompted by App Store Connect validation.
   - Upload updated screenshots for current iPhone / iPad display sizes.

### Publishing to Google Play (Android)

- Package name: `com.almojor.itarab` (`versionCode` in `app.json`)
- Signing config plugin: `plugins/withAndroidReleaseSigning.js`
- **Free GitHub Actions Release Build (`$0`, no local Android SDK required):**
  Trigger **Actions → Build Android Release AAB** (`.github/workflows/build-android.yml`) to build and sign `app-release.aab` using encrypted repository secrets, then download the `itarab-radio-android-aab` artifact and upload to Google Play Console.
- **Local Gradle Build (optional, if Android SDK + JDK 17 are installed):**
  ```bash
  npx expo prebuild --platform android --clean
  cd android && ./gradlew bundleRelease
  ```
  The generated `.aab` appears at `android/app/build/outputs/bundle/release/app-release.aab`.

---

## Managing & Auto-Verifying Radio Stations (Zero App Store Releases)

### 1. Daily Remote Updates (\$0/month, Configured)
1. Hosted at `https://github.com/fekrik/itarab-radio`.
2. `expo.extra.catalogUrl` in `app.json` is wired to:
   ```json
   "extra": {
     "catalogUrl": "https://raw.githubusercontent.com/fekrik/itarab-radio/main/catalog/stations.json"
   }
   ```
3. The included GitHub Action (`.github/workflows/verify-stations.yml`) runs daily at 06:00 UTC to verify all curated and discovered streams and automatically commits updates—the mobile app checks once every 24 hours (and on pull-to-refresh) with no new App Store release needed.

### 2. Add or Fix Stations Yourself
Edit `catalog/curated-stations.json` (on GitHub or locally) to add any station, update a stream URL, or attach `fallbackUrls`, then run:
```bash
# Re-verify curated + existing stations and drop dead ones
npm run verify-stations

# Or run full Radio-Browser discovery + live probing (~230 stations)
npm run curate-stations

# Validate catalog JSON schema and search/filter behavior
npm run test:catalog
```
