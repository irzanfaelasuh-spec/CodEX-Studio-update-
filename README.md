# CodEX AI Terminal 1.2.0

CodEX AI Terminal is a dark, terminal-inspired workspace built with React, TypeScript, Vite, GSAP and Capacitor. It keeps the existing terminal visual language while adding a mobile-first console, streaming Gemini responses, file tools, live code preview, device alerts and an Android APK workflow.

## Features

- Animated startup, local account creation/login and logout confirmation.
- Mobile drawer navigation with responsive terminal panels and touch-sized controls.
- Gemini API key stored separately for each local account on the current device.
- Live model catalogue fetched from the Gemini API; only returned model IDs are selectable.
- Server-sent-event response streaming with a real STOP action using `AbortController`.
- Reply-to-response and regenerate-response actions.
- Visible high-level task activity labels with randomized phase timing. This is an interface status display, not hidden model reasoning.
- Voice-to-text input in Indonesian when the current browser exposes the Web Speech recognition API.
- Image, PDF, DOCX, text and source-file uploads; ZIP extraction and readable file collection.
- Generated code files saved into a local project tree; HTML output opens in the Canvas preview.
- Project ZIP packaging, file/snippet export and a dedicated visible save/download action.
- Android file export uses the native share sheet; choose Files or a storage app and save the exported file. Browser builds use the browser download flow.
- Local device notifications when a response finishes while the app process is still allowed to run.
- Notification tap returns to the CodEX console in Android and supported PWA browsers.
- Nineteen built-in plugins, saved chat history, local profile memory and themes.
- Daily and weekly local token meter with Asia/Jakarta reset boundaries.
- PWA support and GitHub Actions workflows for Pages and Android debug APK.

## Install / run

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Run checks and build:

```bash
npm run typecheck
npm run build
```

## Gemini API setup

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in to CodEX and open **Settings**.
3. Paste the key into that account's Gemini API field.
4. Open **Models** and refresh the catalogue to see model IDs available to that key.

The app queries Google's live model catalogue and uses the exact model ID selected. It calls the `streamGenerateContent` endpoint for response streaming. The default is `gemini-2.5-flash`; refresh the catalogue if this model is unavailable to the project/key.

**API key note:** Local Mode stores the key in browser local storage under that local account. A different account on the same browser starts with a blank key. This prevents accidental sharing between local accounts but is not secure secret storage: someone who can access the device/browser developer tools can inspect it. A trusted server-side proxy is required to conceal keys.

## Accounts and local data

There is no Firebase dependency or Firebase setup. Account records, password hashes, API keys, settings, chats, usage counters, plugin states, memory and generated files are stored locally on the current browser/device. They do not sync to another phone or browser profile. Clearing app/browser data can remove local information. Passwords are stored as salted PBKDF2 hashes, not plaintext.

## Uploads and project files

The Console attachment picker accepts supported images, PDF, DOCX, ZIP, text, Markdown, CSV, JSON and source-code files. Upload processing runs locally before file context or supported image content is sent to Gemini. Files are limited to 12 MB each and up to eight attachments per request to protect mobile memory and request size.

When requesting a project, ask for explicit relative file paths and complete code blocks. Use filename fences such as:

```html filename="index.html"
<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><h1>CodEX</h1></body></html>
```

Detected code blocks can be saved to the Files panel. HTML files open automatically in Canvas when Live Canvas is enabled. Download one file from Files, or package the full folder structure using **Download Project ZIP**.

On Android, the export button creates a file in the app's temporary cache and opens the Android share sheet. Choose **Files** (or another storage app), then choose the destination such as **Downloads**. This is intentional: the Android app must hand the file to a storage provider instead of pretending that a WebView blob link has completed a download. In a browser/PWA, the browser's own download mechanism is used.

Canvas runs HTML in a sandboxed iframe. It is a preview surface, not a full Node.js or operating-system shell. Scripts and browser APIs inside the preview may be restricted.

## Voice input

The microphone uses the browser's Web Speech recognition implementation with the `id-ID` language setting. Support differs by browser/device and may require network access or microphone permission. If the API is unavailable, CodEX displays a clear message and normal text input still works.

## Notifications and background limits

Enable alerts in **Device & alerts** and grant Android/browser notification permission. CodEX can notify after an active request finishes while the web view/app process is still running and the operating system allows it to continue. Tapping a supported notification opens the Console.

**Important:** GitHub Pages is a static host. If Android force-stops CodEX or fully terminates its process, the in-progress Gemini request is stopped as well. A reply that must finish after the app is fully closed requires a hosted backend job that continues the request and a push-notification service. This project does not claim to provide that server-side background execution.

## Random task status

The activity monitor rotates high-level task labels on randomized intervals (approximately 0.85–2.6 seconds). It makes the terminal feel active without fabricating internal reasoning. Token allowance reset times remain predictable and are tied to WIB midnight/Monday boundaries.

## Usage meter — important limitation

Each local account receives a displayed allowance of **20,000 tokens per day** and **100,000 tokens per week**. Daily usage resets at 00:00 WIB; weekly usage resets Monday at 00:00 WIB. CodEX pauses new requests in that browser when either local counter reaches its limit.

This is a **client-side meter**, not a secure server-enforced quota. Browser storage or the device clock can be changed or cleared. It also does not override Google AI Studio project quotas or billing. Enforcing non-editable limits requires a trusted backend to authenticate users, store counters and proxy Gemini requests.

## GitHub Pages

1. Upload the project folder contents to the root of the repository (the `.github` directory must be at repository root).
2. Select **GitHub Actions** as the Pages source in repository settings.
3. Push to `main` or manually run **Deploy CodEX AI to GitHub Pages**.
4. Open the deployment URL shown by the successful Actions run.

## Android debug APK

The Android project is generated on the GitHub-hosted runner. The APK workflow installs dependencies, runs TypeScript/build checks, creates/syncs the Capacitor Android platform, builds `app-debug.apk`, verifies it exists and uploads it as the `CodEX-AI-Terminal-v1.2.0-APK` artifact.

1. Push the project to GitHub.
2. Open **Actions → Build CodEX AI Android APK**.
3. Choose **Run workflow** or push to `main`.
4. Wait for the workflow to finish successfully.
5. Open the run summary and download the APK artifact ZIP, then extract `app-debug.apk`.

The APK is a debug build for testing and sideloading, not a Play Store-signed release. The installed Android app requires an internet connection to call Gemini.

## Project layout

```text
CodEX-AI-Terminal/
├── .github/workflows/       Pages and Android APK build workflows
├── public/                  PWA icons and notification click handler
├── src/
│   ├── lib/                 Auth, Gemini, downloads, uploads, ZIP, storage, notifications
│   ├── App.tsx              Terminal panels and application state
│   ├── main.tsx             React entry point
│   └── styles.css           Desktop and mobile terminal styles
├── capacitor.config.ts      Capacitor Android wrapper
├── vite.config.ts           Vite and PWA configuration
├── package.json             Version 1.2.0 and app dependencies
└── README.md
```
