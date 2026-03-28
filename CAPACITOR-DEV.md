# Mission Ctrl — iOS Dev Guide (Capacitor)

## Prerequisites

- macOS with **Xcode** installed (free from App Store)
- A **USB-C dongle** to connect your iPhone
- Your **Apple ID** signed into Xcode (no paid developer account needed)
- Node.js and npm available in terminal

---

## First-Time Setup (already done — just for reference)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/local-notifications
npx cap init "Mission Ctrl" "com.gabriel.missionctrl" --web-dir dist
npx cap add ios
npx cap sync
```

---

## Building and Running on Your iPhone

### Step 1 — Build the web app and sync to Xcode

```bash
npm run cap:build
```

This runs `npm run build` (generates `dist/`) then `npx cap sync` (copies it into the Xcode project and syncs plugins).

### Step 2 — Open in Xcode

```bash
npm run cap:open
```

### Step 3 — Configure signing in Xcode

1. In the left panel, click **App** (the top-level project)
2. Select the **App** target → **Signing & Capabilities** tab
3. Under **Team**, pick your personal team (your Apple ID name)
4. Xcode may show a "bundle identifier" conflict — just append something unique (e.g. `com.gabriel.missionctrl.dev`)

### Step 4 — Deploy to your iPhone

1. Plug in your iPhone via USB
2. Select your iPhone as the target device in the top toolbar
3. Hit the **Play (▶) button**
4. First time: go to **Settings → General → VPN & Device Management** on your iPhone and trust the developer certificate

### After Code Changes

```bash
npm run cap:build   # rebuild + sync
# then hit Play again in Xcode (no re-signing needed)
```

Or use the faster copy-only workflow (skips full sync):

```bash
npm run cap:dev     # build + copy + open Xcode
```

---

## Notification Permission

On first launch, the app will automatically prompt for notification permission when the first timer is started. Tap **Allow**.

---

## Testing Notifications

1. Set a short timer (e.g. Break 1 to 1 minute)
2. Start it, then **lock the phone**
3. After 1 minute, the notification should appear on the lock screen with sound

---

## Free Provisioning Note

With a free Apple ID (no paid $99/year developer account), the installed app **expires every 7 days**. To re-install:

```bash
npm run cap:build
npm run cap:open
# Hit Play in Xcode
```

---

## Render Deployment (web version)

The Capacitor files don't affect the Render static site. The `/ios` folder is in `.gitignore` and never pushed to GitHub. Render continues to deploy from `dist/` as before.

To update the live web app:

```bash
npm run build
git add -A && git commit -m "your message"
git push
```

---

## Notification IDs (internal reference)

| Timer | ID |
|---|---|
| Focus Session | 1000 |
| Break 1 | 1001 |
| Break 2 | 1002 |
| Lunch | 1003 |
