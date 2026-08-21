# BreachOS

A cyberpunk-themed memory card game built with vanilla HTML, CSS, and JavaScript. Match pairs of sci-fi operatives across multiple game modes, earn XP, unlock ranks, collect card skins, and sync your progress across all devices.

**[Play Now →](https://breachos.laddtnov.xyz/)**

<!-- Google Play badge — restore this once the listing is live. Until then the
     link 404s for anyone who clicks it. Kept verbatim so the package id does
     not have to be reconstructed.
<a href="https://play.google.com/store/apps/details?id=xyz.laddtnov.breachos">
  <img alt="Get it on Google Play" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" height="60" />
</a>
-->

---

## Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=minutemailer&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-FF6B35?style=for-the-badge&logo=webaudio&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/laddtnov)

- **Frontend** — Vanilla HTML5/CSS3/JS, zero frameworks. The only build step
  concatenates and minifies the sources; nothing transpiles, and the files in
  `css/` and `js/` are what runs
- **Backend** — Vercel serverless functions (Node.js)
- **Database** — Supabase (Postgres + Auth)
- **Email** — Resend API
- **PWA** — Service worker, offline support, installable

---

## Screenshots

| Mission Briefing | Game Board |
|:---:|:---:|
| ![Mission Briefing](screenshots/01-mission-briefing.png) | ![Game Board](screenshots/02-game-board.png) |

| Gameplay | Mission Complete |
|:---:|:---:|
| ![Gameplay](screenshots/03-gameplay.png) | ![Mission Complete](screenshots/04-mission-complete.png) |

---

## Game Modes

| Mode | Description |
|------|-------------|
| **Classic** | Standard rules — limited moves, no timer (except Extreme) |
| **Blitz** | Race the clock — every difficulty has a countdown, no move limits |
| **Survival** | Endless escalating waves — earn lives back, streak multiplier on score |
| **Daily Challenge** | Seeded daily puzzle — same cards for everyone, tracks streaks |
| **Weekly Challenge** | One seeded Hard board per week, resets Monday — double XP on first clear |
| **Friend Challenge** | Open a shared link to play someone's exact board and try to beat their score |

---

## Features

### Core Gameplay
- **4 Difficulty Levels** — Easy (3×2), Medium (4×4), Hard (4×6), Extreme (6×6)
- **28 Cyber Operatives** to match
- **Combo System** — chain consecutive matches for bonus XP
- **Move + Time Limits** — strategic pressure per mode and difficulty
- **Extreme Combo Time Bonus** — each consecutive match in Extreme adds +10 seconds to the countdown

### Progression
- **10 Ranks** — ROOKIE → AGENT → SPECIALIST → GHOST → NETRUNNER ELITE → PHANTOM → ARCHITECT → OVERSEER → WRAITH → SINGULARITY
- **XP Calculation** — difficulty × move efficiency × speed × combo chains
- **10 Card Skins** — Default, Hologram, Corrupted, Gold Circuit, Elite Neon, Survivor, Chrono, Plasma Burn, Acid Rain, Shadow Protocol
- **16 Collection Cards** — unlocked by rank, survival waves, daily streaks, win milestones, blitz wins and more
- **24 Achievements** — spanning gameplay, speed, combos, survival, daily challenges and hidden secrets

### Unlock Conditions

| Reward | How to Unlock |
|--------|---------------|
| Hologram skin | Reach AGENT rank |
| Corrupted skin | Reach SPECIALIST rank |
| Gold Circuit skin | Reach GHOST rank |
| Elite Neon skin | Reach NETRUNNER ELITE rank |
| Survivor skin | Survive wave 5 |
| Chrono skin | 7-day daily streak |
| Plasma Burn skin | Win 20 games |
| Acid Rain skin | Reach 7× combo |
| Shadow Protocol skin | Play 100 games |
| PHOENIX card | Survive wave 10 |
| ORACLE PRIME card | 30-day daily streak |
| TEMPEST card | Win 20 games |
| ARCHITECT card | 200 total matches |
| OVERCLOCKED card | 7× combo |
| ENTROPY card | Survive wave 15 |
| PHANTOM card | Play 50 games |
| WRAITH card | Survive wave 20 |
| CIPHER card | 14-day daily streak |
| CATALYST card | Win 10 blitz games |
| ECLIPSE card | Win 50 games |

### Audio & Visuals
- **11 Sound Themes** — Cyber, Retro 8-Bit, Synthwave, Glitch, Minimal, Horror, Jazz Runner, Rave Core, Ambient Void, Arcade, Neon Bass
- **13 Table Themes** — Cyber, Blood Circuit, Matrix, Solar Flare, Void, Ice Cold, Toxic Waste, Ember Core, Midnight, Sakura, Storm Surge, High Contrast, Daylight
- **Particle effects**, scanline animations, glitch overlays, rank-up cinematic

### Cross-Device Sync
- **Account system** — register / log in via the SYNC button
- **Auto-sync** — progress pushes to Supabase on every game save
- **Merge strategy** — always takes the highest value across devices
- **Welcome email** — cyberpunk greeting sent on signup via Resend
- **Re-engagement email** — "SIGNAL LOST" email sent after 14 days of inactivity

### Daily Quests
- **3 rotating objectives per day** — win games, hit combos, clear difficulties, perfect wins, survival waves
- **Seeded** — all players share the same quests each day
- **Bonus XP** on completion, resets at midnight

### Streaks
- **Daily streak** — advances on each Daily Challenge clear; streak freeze earned every 7 days covers one missed day
- **Weekly streak** — tracked independently; advances only when the previous week's board was also cleared
- **Login streak** — consecutive days the game is opened, with bonus XP for returning; a streak freeze covers one missed day

### Quality of Life
- **Player Dossier** — full stats dashboard with game history (last 10 games)
- **Share Card** — Canvas-generated result image
- **Cyber / Safe Mode** — toggle animations for accessibility
- **Color Blind Mode** — blue/orange palette replaces cyan/pink; dashed border as shape cue; persists across sessions
- **Card Flip Animations toggle** — turn the 3D flip off for lower-end devices; persists across sessions
- **Haptic presets** — SUBTLE / STANDARD / INTENSE buzz strength, selectable in SETTINGS
- **Achievement badges** — badge grid in the Dossier; tap or focus a badge to read its name and unlock condition, locked entries shown as silhouettes
- **Respects `prefers-reduced-motion`**
- **Mobile-first** — hamburger menu, responsive grid layouts
- **DAYLIGHT theme** — light mode for outdoor / bright-sunlight play on mobile
- **HIGH CONTRAST theme** — white/black/yellow palette for low-vision players (WCAG 1.4.3)
- **PWA** — installable, works offline
- **Konami Code** — hidden easter egg with achievement

---

## Project Structure

```
breachos/
├── index.html              # Single-page app shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (network-first, breachos-v60)
├── vercel.json             # Cron schedule + security headers
├── dist/                   # Built bundles — generated, gitignored
├── tools/                  # build.mjs + assets.json (load order), verify-page.sh
├── css/                    # Modular stylesheets (source)
├── js/                     # Game logic (vanilla ES6+, source)
│   ├── auth.js             # Auth state, sync, panel navigation
│   ├── game.js             # Core game loop
│   ├── rank.js             # XP, ranks, saveStats
│   ├── achievements.js     # 24 achievements + Dossier badge grid
│   ├── collections.js      # 16 collection cards
│   ├── board.js            # Shared board setup for all modes
│   ├── stats-rules.js      # Win rate and history labels (pure)
│   ├── survival-rules.js   # Survival escalation, lives, scoring (pure)
│   ├── survival.js         # Survival mode
│   ├── haptic-patterns.js  # Haptic preset tables (pure)
│   ├── daily.js            # Daily challenge + streaks
│   ├── weekly.js           # Weekly challenge (Monday-seeded board)
│   ├── login-streak.js     # Consecutive-day login streak + bonus XP
│   ├── quests.js           # Daily quests
│   ├── challenge-rules.js  # Friend Challenge codec and ranking (pure)
│   ├── challenge.js        # Friend Challenge links and banner
│   ├── tabs.js             # Shared ARIA tab group
│   └── ...
├── api/
│   ├── auth/
│   │   ├── register.js     # Create account + welcome email
│   │   ├── login.js        # Authenticate + return JWT
│   │   ├── forgot-password.js
│   │   └── reset-password.js
│   ├── sync/
│   │   ├── save.js         # Push playerStats to Supabase
│   │   └── load.js         # Pull + merge from Supabase
│   ├── cron/
│   │   └── re-engage.js    # Daily re-engagement email job
│   └── leaderboard/
│       ├── get.js          # Fetch leaderboard entries
│       └── daily.js        # Daily challenge leaderboard
├── lib/
│   ├── db.js               # Supabase clients (admin + public)
│   ├── ratelimit.js        # In-memory sliding window rate limiter
│   └── emails.js           # Shared HTML email templates
├── partials/               # HTML fragments loaded at runtime
├── test/                   # node:test unit tests (zero dependencies)
└── supabase-*.sql          # Database schema + migrations
```

---

## How to Play

1. Open [breachos.laddtnov.xyz](https://breachos.laddtnov.xyz/)
2. Select a mode and difficulty from the briefing screen
3. Flip cards to find matching pairs
4. Chain matches for combo bonuses
5. Earn XP, rank up, unlock skins and collection cards
6. Hit **SYNC** to register and keep your progress across all devices

---

## Run Locally

```bash
git clone https://github.com/laddtnov/breachos.git
cd breachos
npm install
npm run build
python3 -m http.server 8080
```

Open `http://localhost:8080`. Note: API routes require Vercel dev or environment variables to function.

### Build

```bash
npm run build
```

`index.html` loads two files — `dist/app.min.css` and `dist/app.min.js` — built
from the 25 stylesheets and 28 scripts by [`tools/build.mjs`](tools/build.mjs).
That takes 53 render-blocking requests down to 2, and drops roughly a third of
the bytes before compression.

The scripts are classic scripts sharing one global scope, so they are
concatenated in the order [`tools/assets.json`](tools/assets.json) lists rather
than bundled as modules. esbuild is used purely as a minifier: in script mode it
mangles locals and leaves top-level names intact, which the markup depends on
because it calls functions like `toggleSettingsModal()` from inline `onclick`
attributes.

`dist/` is generated and gitignored — Vercel runs the build on deploy. When
adding a stylesheet or script, add it to `tools/assets.json` and to the service
worker's asset list.

While iterating, `tools/verify-page.sh` rebuilds first, so `_verify.html` always
reflects the current sources.

### Tests

```bash
npm test
```

Runs the `node:test` suite (Node 18+, no dependencies) — 197 tests covering the
date and streak arithmetic, survival escalation and scoring, the rank curve,
Friend Challenge encoding and its rejection of malformed links, the server-side
stats guard and password-reset token check, service worker cache eligibility,
tab keyboard navigation, haptic presets, achievement badges, and win-rate
reporting.

---

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for planned features.

---

## Changelog

### v1.7.1
Security and polish before the Play Store launch. No gameplay changes.

**Security**
- **Fix:** Synced stats were written to the database verbatim, and the leaderboard ranks players on the XP inside that same column — so a single authenticated request could set any XP and any rank. The payload is now rebuilt field by field on the server: unknown keys are dropped rather than filtered, every number is clamped, rank must be one of the ten real ranks, and wins can never exceed games played. XP may rise by at most one offline session's worth per save, and an over-limit save keeps the stored value rather than being clamped to the ceiling
- **Fix:** The password-reset endpoint accepted any valid access token, not only one minted by a recovery link, so an ordinary session token could set a new password — turning a stolen token into permanent account takeover rather than temporary access. It was also the only auth route with no rate limit
- **Changed:** The service worker no longer caches `/api/` responses. They are per-user and authenticated, and were being written into the static asset cache, leaving one player's synced stats on disk for whoever used the device next

**Fixes**
- **Fix:** CUSTOMISE and SETTINGS rendered as default browser buttons. The control bar was styled by listing element ids, and that list still named five buttons deleted in v1.7.0 while never gaining the two added
- **Fix:** The SETTINGS modal showed two different button appearances — three of the six toggles kept id rules that outranked the modal's own class
- **Fix:** The HAPTICS button appeared not to respond. It did toggle, and the setting persisted, but the label never changed because it was written to an element v1.7.0 removed. The underlying cause was duplicated label logic that had drifted out of sync
- **Fix:** The service worker passed every request to the cache, including the `chrome-extension://` requests browser extensions send through the page, which the Cache API rejects outright — producing an unhandled error on each one

**Performance**
- **Changed:** All 28 script tags now carry `defer`, so they no longer block the parser. Measured first contentful paint on production was already 876 ms; the gain is against the simulated slow connection Lighthouse scores against, where 53 sequential blocking requests is expensive. Stylesheets still block deliberately — deferring them would trade a Lighthouse point for a flash of unstyled content

**Internal**
- **Chore:** Test suite grown from 152 to 197 tests; service worker cache bumped to `breachos-v57`

### v1.7.0
**Friend Challenges**
- **New:** Share a link carrying the board seed, difficulty, moves and time. Whoever opens it plays the identical board and is told whether they beat the score. The whole challenge travels in the URL — nothing is stored and there is no backend
- **Changed:** Classic boards are now seeded. They previously used an unseeded shuffle, so a win could not be reproduced from a link and there was nothing to hand over
- **Note:** Challenge boards carry no trap card and no glitch event, even on Hard and Extreme. Those are drawn from a separate random source rather than the shared seed, so leaving them in would give the two players different games
- **Note:** Ranking is moves first, time as the tie-break, and an exact tie leaves the challenger holding the title

**Progression**
- **Changed:** The rank ladder runs from 5 tiers to 10 — PHANTOM, ARCHITECT, OVERSEER, WRAITH and SINGULARITY sit past NETRUNNER ELITE. A win is worth roughly 150 XP and the old ladder finished at 1 000 XP, so maximum rank arrived in about seven games and the XP bar then read MAX permanently. The top is now around 67 wins. The original five thresholds are unchanged, since skins and collection cards are gated on them
- **Changed:** Survival keeps escalating past wave 17. Wave 17 is where two dials ran out at once — the countdown hit its floor and the last modifier switched on — so every later wave was identical. The countdown now eases to a second, gentler gradient instead of stopping, and the life allowance tapers in deep loops, which is what gives a flawless run a natural end. Escalation continues to wave 37
- **Fix:** The wave-clear overlay announced a restored life on any flawless wave, including when lives were already at capacity and none was given

**Navigation**
- **Changed:** SKINS, THEMES and SOUNDS merged into one CUSTOMISE modal with tabs; the six preference toggles moved into SETTINGS; COLLECTION folded into the Dossier. Mobile menu 15 entries to 7, desktop control bar 13 to 7
- **A11y:** The new tab groups implement the full ARIA tabs keyboard pattern — arrows wrap, Home and End jump to the ends, and only the active tab sits in the page tab order. The existing leaderboard tabs had the roles but no keyboard support at all

**Licensing & icons**
- **New:** `LICENSE` file added. The README had advertised MIT since launch with no licence text behind it
- **Fix:** App icons were rendered with Futura, loaded from the macOS system font file. Futura is licensed for use rather than redistribution, and the right to ship raster output derived from it was never established. The monogram is now drawn from geometric primitives with no font loaded at all
- **New:** A separate maskable icon. The 512px icon was declared `maskable any`, and Android crops maskable icons to a shape the launcher picks — under a circular mask the entire border and all the circuit accents were cut away
- **Docs:** README records asset provenance — icons generated from code in this repository, favicon hand-written SVG, card art CSS and Unicode glyphs, and no font bundled or served

**Internal**
- **Chore:** Test suite grown from 98 to 152 tests; service worker cache bumped to `breachos-v56`
- **A11y:** Status regions use `<output>` rather than a `role="status"` attribute

### v1.6.0
**Survival**
- **New:** Survival rework — difficulty used to stop climbing at wave 13, where the fixed `loopCountdowns` array clamped and every later wave reused the same 30s base. The countdown now decays toward a floor and the ghost / trap / glitch modifiers switch on at later loops, so escalation continues past that point. The opening loop stays untimed
- **New:** Lives can be earned back — a flawless wave (no mismatches) restores one life, capped at 5, giving a comeback path where one early mistake used to shadow an entire run
- **New:** Risk/reward scoring — a streak multiplier grows with consecutive clean waves and resets on life loss, so score reflects how well a run was played rather than only how long it lasted. Neutral at zero streak, so existing best scores stay comparable
- **Fix:** The heart HUD rendered a fixed three slots, so a restored fourth or fifth life was invisible while the overlay announced it

**Progression & UI**
- **New:** Haptic presets — SUBTLE / STANDARD / INTENSE, selectable from the mobile menu and persisted. STANDARD reproduces the previous patterns exactly
- **New:** Achievement badge grid in the Dossier — locked badges shown as silhouettes; tap or focus one to read its name and unlock condition
- **Changed:** The standalone Achievements modal is gone. It duplicated the badge grid, and the Dossier is now the single achievements surface. The unlock toast is unchanged
- **Changed:** Mobile menu trimmed from 16 entries to 15, desktop control bar from 14 to 13

**Fixes**
- **Fix:** Win rate could exceed 100% (observed 114%). Clearing a survival wave incremented the win counter without a matching game count; each cleared wave now counts as both, and the displayed rate is clamped for saves already skewed
- **Fix:** Mission history showed `TIMED`, a mode that no longer exists, for games recorded while Timed mode was briefly built. Retired modes now map to their live equivalent, `weekly` is labelled deliberately rather than by accident, and an entry with no mode no longer breaks the whole table
- **Fix:** Switching modes could leave the previous mode's HUD, overlays or body class on screen; a trap armed in a Hard classic game could still be armed on the daily board
- **Fix:** The haptic preset control showed a preset name while disabled on devices with no Vibration API; it now reads N/A
- **A11y:** Achievement badges are focusable buttons rather than spans, so keyboard and screen-reader users can reach them; the achievements modal became a `<dialog>` before removal, and the Dossier detail line is an `aria-live` region

**Internal**
- **Chore:** The four game modes shared no board setup and had drifted apart; `js/board.js` now holds the common reset, chrome clearing and deck build (301 lines to 163)
- **Chore:** One `.hidden` utility replaces 30 per-component copies across 23 stylesheets; seven identical modal toggles replaced by one helper
- **Docs:** README claimed 16 achievements; there are 24
- **Chore:** Test suite grown from 21 to 98 tests; service worker cache bumped to `breachos-v52`

### v1.5.0
- **New:** Weekly Challenge — one seeded Hard board per week, identical for every player, resetting each Monday. First clear of the week pays double XP plus a streak bonus; replays pay base XP. Week streak is tracked independently of the daily streak and advances only when the previous week was also cleared
- **New:** Daily Login Streak — consecutive days the game is opened, with bonus XP for returning players and a HUD counter. Separate from the daily-challenge streak; an earned streak freeze covers one missed day. Bonus is capped so long streaks cannot award unbounded XP
- **New:** Card flip animation toggle — disable the 3D flip from desktop controls or the mobile menu for lower-end devices; persists across sessions
- **A11y:** Card grid now honours `prefers-reduced-motion` — flip transitions and match-glow animations were previously unconditional
- **Fix:** Weekly badge, weekly HUD, win overlay, and login banner rendered while carrying the `hidden` class — this codebase has no global `.hidden` rule, so each component must declare its own
- **Fix:** Login streak banner overlapped the HUD's PAUSE and RESTART controls on mobile; moved to a bottom toast
- **Chore:** `npm test` added — `node:test` suite (zero dependencies) covering week boundaries across months and years, reset countdown, and every streak transition including the freeze path
- **Chore:** Service worker cache bumped to `breachos-v48`

### v1.4.5
- **New:** Delete account flow — Profile → Delete Account permanently removes all data from Supabase Auth and the profiles table immediately; GDPR compliant
- **Fix:** Privacy policy updated to reflect immediate deletion (was "within 30 days")

### v1.4.4
- **Fix:** `privacy.html` added to service worker cache — privacy policy now available offline
- **SEO:** `sitemap.xml` added with root and `/privacy` URLs; referenced in `robots.txt`
- **Chore:** Service worker cache bumped to `breachos-v47`

### v1.4.3
- **Play Store:** `/.well-known/assetlinks.json` added for TWA domain verification (package `xyz.laddtnov.breachos`)
- **Play Store:** Google Play badge added to README
- **Chore:** Service worker cache bumped to `breachos-v45`

### v1.4.2
- **New:** Privacy Policy page (`/privacy`) — covers data collected, third-party services (Supabase, Resend, Vercel), retention, user rights, COPPA, and contact; required for Google Play Store submission
- **PWA:** Maskable icon declared in manifest — enables Android adaptive icon support
- **PWA:** Screenshots added to manifest (4 game scenes) — required for Play Store install sheet
- **PWA:** HTTP → HTTPS redirect via Vercel config; `robots.txt` added; `<meta description>` and canonical URL in index
- **Chore:** Service worker cache bumped to v44

### v1.4.1
- **Fix:** `blitzWins` and `perfectWins` missing from default stats — fresh-install players could get NaN propagating into saves and sync
- **Fix:** Expired auth token mid-session now reverts the SYNC button instead of silently losing stat updates
- **Fix:** Network failure on sync load no longer produces an unhandled promise rejection in the console
- **Security:** HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers added to all responses
- **Security:** Rate limiting on auth endpoints — login (10/15 min), register (5/hour), forgot-password (3/hour) per IP
- **Security:** Username character allowlist on registration prevents HTML injection in transactional emails
- **Security:** Leaderboard routes now use the anon (publishable) key instead of the service role key

### v1.4.0
- **New:** Daily Quests — 3 rotating objectives per day (win games, hit combos, clear difficulties, perfect wins, survival waves); bonus XP on completion, resets at midnight, seeded so all players share the same quests
- **New:** Extreme Combo Time Bonus — each consecutive match in Extreme difficulty adds +10 seconds to the countdown timer
- **New:** Color Blind Mode — replaces cyan/pink card palette with blue/orange; orange group uses a dashed border as an additional shape cue; persists across sessions
- **New:** Game History — last 10 games shown in Dossier (mode, difficulty, time, moves, combo, XP)

### v1.3.0
- **New:** SUPPORT button in desktop controls and mobile menu — opens Buy Me a Coffee in a new tab

### v1.2.1
- **Fix:** Desktop control buttons lost neon styling after donation UI removal (trailing comma in CSS selector)

### v1.2.0
- **New:** Buy Me a Coffee support link in README
- **Removed:** In-game donation UI (DONATE button, modal, all related CSS/JS)
- **Chore:** CI — Claude Code security review workflow
- **Chore:** Dependency bumps (brace-expansion, resend)

### v1.1.0
- **New:** DAYLIGHT theme — light mode for outdoor mobile readability
- **Fix:** Game board was empty on first load (cards required a manual click to appear)
- **Fix:** Service worker switched to network-first to prevent stale asset caching after deploys
- **Fix:** Service worker cache renamed from `cybermatch` to `breachos`
- **Fix:** `.cyber-table` horizontal overflow on mobile (added `box-sizing: border-box`)
- **Fix:** Default table border glow appeared pink instead of cyan
- **Fix:** BLOOD CIRCUIT theme glow intensity toned down
- **Fix:** Win/Lose overlay text invisible in DAYLIGHT and HIGH CONTRAST themes
- **Fix:** SVG favicon added for browser tabs and PWA

### v1.0.0
- Initial public launch

---

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Vladyslav Novytskyi.

### Asset provenance

Every visual asset in this repository is original work, generated from code in
this repository:

- **App icons** (`icons/icon-192.png`, `icons/icon-512.png`, and
  `icons/icon-512-maskable.png`) are produced by
  [`generate_icons.py`](generate_icons.py), which draws the background, grid,
  glow, border, circuit accents and the B monogram from geometric primitives.
  No font file is loaded, so no type foundry's licence applies to the output.
  The maskable variant is the same artwork inset to 69%, the largest scale at
  which the frame clears Android's 80% safe zone under a circular mask.
- **Favicon** (`icons/favicon.svg`) is hand-written SVG rectangles.
- **Card faces, skins and themes** are CSS gradients, borders and Unicode
  glyphs — see `css/`. No bitmap artwork is bundled.
- **Fonts**: none are bundled or served. The stylesheets name
  `'Courier New', monospace` and the browser resolves it locally, which is a
  reference rather than redistribution. There are no `@font-face` rules and no
  webfont requests.

Regenerate the icons with:

```bash
python3 generate_icons.py
```
