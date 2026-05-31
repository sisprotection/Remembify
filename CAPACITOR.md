# Packaging RememberFi for the App Store & Play Store

RememberFi is a PWA wrapped with **Capacitor** for native iOS/Android distribution. This wrapper loads the published web app from `https://rememberfi.lovable.app`, so any code change you publish on Lovable is live in the apps immediately (subject to App Store cache and Apple's hot-update policy for HTML/JS).

---

## One-time setup (on your local machine — Mac for iOS)

```bash
# 1. Pull repo
git clone <your-repo-url> rememberfi && cd rememberfi
npm install

# 2. Install Capacitor
npm install --save @capacitor/core @capacitor/ios @capacitor/android
npm install --save-dev @capacitor/cli

# 3. Initialize (only if capacitor.config.ts doesn't exist yet)
npx cap init "RememberFi" "com.rememberfi.app" --web-dir=dist

# 4. Add platforms
npx cap add ios
npx cap add android
```

Then copy `capacitor.config.ts` from this repo (already committed) over the generated one if needed.

---

## Build & sync workflow

```bash
# After any web code change you've published on Lovable, the app already updates
# because it loads the published URL. Only re-sync when you change manifest, icons,
# or native config:

npx cap sync
```

---

## Open in Xcode (iOS)

```bash
npx cap open ios
```

In Xcode:
1. Select the **App** target → Signing & Capabilities → choose your team.
2. Set bundle identifier: `com.rememberfi.app`
3. Set version + build number.
4. Add capabilities you need: **Push Notifications**, **Background Modes → Location updates**.
5. Edit `ios/App/App/Info.plist` and add usage strings:
   - `NSLocationWhenInUseUsageDescription` = "RememberFi uses your location to trigger reminders when you arrive at or leave saved places."
   - `NSLocationAlwaysAndWhenInUseUsageDescription` = "Allow always so location reminders work in the background."
   - `NSUserNotificationsUsageDescription` = "Used to alert you when a reminder fires."
6. Product → Archive → Distribute App → App Store Connect.

---

## Open in Android Studio

```bash
npx cap open android
```

In Android Studio:
1. Edit `android/app/build.gradle` — set `applicationId "com.rememberfi.app"`, `versionCode`, `versionName`.
2. Edit `android/app/src/main/AndroidManifest.xml` — already has internet permission; add:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```
3. Build → Generate Signed Bundle (AAB) → upload to Play Console.

---

## Store listing cheat sheet

| Field | Value |
|---|---|
| App name | RememberFi |
| Subtitle | Location & time reminders |
| Bundle ID | com.rememberfi.app |
| Category | Productivity |
| Age rating | 4+ (iOS) / Everyone (Play) |
| Privacy policy URL | https://rememberfi.lovable.app/privacy |
| Terms URL | https://rememberfi.lovable.app/terms |
| Support email | support@rememberfi.com |
| Account deletion | Settings → Danger Zone → Delete my account |

**Apple privacy questionnaire answers:**
- Data linked to user: email, name, reminders, location (only when app is open), purchase history.
- Data NOT collected: contacts, browsing history, sensitive info.
- Tracking: No.

---

## Important: Apple's IAP rule

Apple may require **In-App Purchase (StoreKit)** instead of Stripe for digital subscriptions sold inside the iOS app. If your first submission is rejected for this, options:
1. Strip the upgrade UI from the iOS build only (hide `/pricing` route based on user agent).
2. Switch to StoreKit (separate phase — adds the `@capacitor-community/in-app-purchases` plugin).
3. Argue your service is also delivered outside iOS (a "Reader" app exception — works for some categories).

Google Play has the same rule but is generally more lenient for productivity apps with web-first models.

---

## Useful Capacitor plugins (add later if needed)

- `@capacitor/push-notifications` — native APNs/FCM push
- `@capacitor/geolocation` — better background geolocation than the browser API
- `@capacitor/local-notifications` — schedule notifications without a server
- `@capacitor/haptics` — phone vibration on reminder fire
