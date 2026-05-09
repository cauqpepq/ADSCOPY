# AdsPower Clone

An open-source antidetect browser modeled after [AdsPower](https://www.adspower.com), built as an Electron desktop application.

## What it does

- **Per-profile browser isolation** — each profile launches its own Chromium with a dedicated `--user-data-dir`, so cookies, localStorage, IndexedDB, passwords, and cache are fully isolated.
- **Fingerprint spoofing** — every page in a profile has its `navigator`, `screen`, `Intl`, Canvas, WebGL, AudioContext, WebRTC, plugin, and font surfaces overridden via a CDP-injected preload script (see `src/main/fingerprint/preload-template.ts`).
- **Proxy per profile** — HTTP / HTTPS / SOCKS4 / SOCKS5 with optional authentication. Built-in proxy tester verifies the public IP and latency.
- **Cookie import / export** — JSON (Puppeteer / EditThisCookie) and Netscape `cookies.txt`.
- **Extension manager** — load unpacked Chromium extensions per profile.
- **Automation** — JSON-defined scenarios executed via Puppeteer over CDP.
- **Local API** — HTTP server (default `127.0.0.1:50325`) that mimics AdsPower's `local-api.adspower.net` for programmatic control.

## What this clone *doesn't* attempt

This project is **not** a 1:1 reproduction of AdsPower. AdsPower has been built by ~100 engineers over 5+ years and includes:

- A forked Chromium ("SunBrowser") with C++ patches at the engine level — far stronger than JS-level overrides for resisting native fingerprinting.
- Cloud sync, team roles, billing, and a marketplace.
- A visual no-code RPA builder.

This clone uses the **system Chromium** with a JS-injection layer. It works against most JavaScript-based fingerprinting (browserleaks, pixelscan, iphey baseline checks) but is detectable by sites that fingerprint at the network or native level.

## Architecture

```
┌──────────────────────────────────┐
│ Electron Main Process            │
│  ├─ src/main/db        SQLite    │
│  ├─ src/main/browser   Launcher  │ ─── spawns Chrome --user-data-dir
│  │                               │      with --proxy-server flag
│  ├─ src/main/fingerprint         │ ─── Page.addScriptToEvaluateOnNewDocument
│  ├─ src/main/cookies             │
│  ├─ src/main/extensions          │
│  ├─ src/main/automation Puppeteer│
│  └─ src/main/api       Express   │
└──────────────────────────────────┘
                ▲ IPC
                │
┌──────────────────────────────────┐
│ Renderer (React + Tailwind)      │
│  ├─ Sidebar, Topbar              │
│  ├─ Profiles + folders           │
│  ├─ Proxies                      │
│  ├─ Extensions                   │
│  ├─ Automation (JSON RPA)        │
│  └─ Settings                     │
└──────────────────────────────────┘
```

## Getting started

Requirements:

- Node.js 18+ (tested on 22.x)
- pnpm 9+
- Google Chrome or Chromium installed somewhere on the system

```bash
pnpm install
pnpm dev
```

To build a distributable:

```bash
pnpm package          # current platform
pnpm package:linux    # AppImage + deb
pnpm package:win      # NSIS installer
pnpm package:mac      # dmg
```

## Local API quick reference

```
GET  /status                              -> { ok: true }
GET  /api/v1/browser/list                 -> profiles
GET  /api/v1/browser/active?user_id=ID    -> { status: "Active" | "Inactive" }
POST /api/v1/browser/start  { user_id }   -> { ws: "http://127.0.0.1:<port>" }
POST /api/v1/browser/stop   { user_id }
```

Connect Puppeteer to a running profile:

```js
const puppeteer = require('puppeteer-core')
const r = await fetch('http://127.0.0.1:50325/api/v1/browser/start', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ user_id: 'PROFILE_ID' })
})
const { data: { ws } } = await r.json()
const browser = await puppeteer.connect({ browserURL: ws })
```

## License

MIT.
