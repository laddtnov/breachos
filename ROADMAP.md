# BreachOS — Roadmap

Planned features and improvements. Subject to change based on player feedback.

---

## In Progress

Nothing currently in active development.

---

## v1.5.0 — Core Depth (Short Term)

Shipped — see Completed.

---

## v1.6.0 — Progression

Shipped — see Completed. Timed Mode Variant was dropped; see below.

### Timed Mode Variant — dropped
Built and then reverted. A single fixed clock for every difficulty turned out to
sit too close to Blitz: both are "clear the board before a countdown", differing
only in whether the clock scales with difficulty. Two near-identical modes in the
briefing screen cost more in player confusion than the variety was worth.

If revisited, it needs a mechanic that distinguishes it from Blitz rather than a
different countdown value — e.g. time added per match, or a clock shared across
consecutive boards. The separate leaderboard the original entry called for was
never built, and would need a Supabase schema change plus API and UI work.

---

## v1.7.0 — Social & Monetization

### Navigation Consolidation
The mobile menu carries **16 items**, three of which fall below the fold on a
375x812 phone; the desktop control bar is **14 buttons** in a single row, behind
10 separate modal partials. Settings toggles and destinations share one flat
list, so a set-once preference like COLOR BLIND competes for space with
RANKINGS.

Target: **16 entries down to 6** — PLAY · PROFILE · CUSTOMISE · RANKINGS ·
QUESTS · SETTINGS · SYNC — which fits one screen on any phone without scrolling.

**1. Drop the standalone Achievements modal** — SHIPPED in v1.6.0
- The Dossier badge grid added in v1.6.0 already renders all 24 achievements, and the Dossier also shows a `4/24` stat. Measured: both surfaces return 24 items
- Pure deletion — no new component needed: removes `partials/achievement-modal.html`, `renderAchievementModal()`, its toggle and its CSS
- Keep `showAchievementPopup()`; the unlock toast is separate and still wanted
- ~-90 lines, -1 nav entry

**2. Merge SKINS / THEMES / SOUNDS into one CUSTOMISE modal**
- Three near-identical "pick a cosmetic variant" modals
- Needs the in-modal tab pattern; build it here and reuse for item 4
- ~-50 lines net, -2 nav entries

**3. Move the six toggles into a SETTINGS modal**
- STATUS, COLOR BLIND, CARD FLIP, SOUND, HAPTICS, BUZZ
- Roughly line-neutral — markup moves rather than disappears. This is the
  biggest readability win and the smallest code win; worth doing for the mobile
  menu, not for the diff
- -5 nav entries

**4. Fold COLLECTION into the Dossier as a tab**
- Both are "my progression"; the Dossier is already the progression surface
- ~-1 partial, -1 nav entry

Sequencing matters: item 1 is pure deletion and independent. Items 2–4 all
depend on the same tab component, so they are one piece of work once it exists.

Honest accounting: only item 1 is a clear code win. The rest trade roughly even
on lines and are justified by the mobile experience, not the line count.

### Friend Challenges
Generate a shareable link with a fixed board seed.
- "Beat my score on THIS board"
- Extends existing `share.js`
- Zero backend cost

### "Support the Dev" IAP
One-time €2.99 in-app purchase via Google Play Billing.
- No paywalled features — purely optional tip
- Unlocks a cosmetic "Supporter" badge in Dossier

### Cosmetic Skin Packs
Additional card back and board theme bundles.
- Purchasable via Play Billing
- Free tier always has full gameplay access

---

## Medium Term

### Player Guide Page
A player-facing guide at `/guide` — how to play, mode explanations, and the full
unlock table for skins, collection cards and achievements.

Considered a GitHub wiki for this and rejected it: wiki content lives in a separate
`.wiki.git` repo, so it never passes through a PR and skips Build Check, SonarCloud
and CodeQL. It also would not reach players, who do not browse the repo.

- Most of the content already exists in `README.md` (Unlock Conditions table, How to Play, Game Modes) but sits where only developers see it
- Ships through the normal PR and deploy pipeline; Play Store users get it via the TWA with no new AAB
- Indexable for long-tail search — "breachos how to unlock chrono skin", "breachos survival tips"
- Follow `privacy.html` for page structure and `sw.js` registration; add to `sitemap.xml`
- Single source of truth: generate the unlock table from the same data the game uses, rather than hand-copying it, so it cannot drift from `RANKS` / `REWARD_SKIN_RULES`
- Pairs naturally with v1.6.0's Achievement Badges — both surface unlock conditions

### Push Notifications (PWA)
Remind players about the daily challenge via browser push.
- "Your daily mission is available" at a set time
- Opt-in only, respects user preference
- Uses Web Push API + Vercel endpoint

### Offline Leaderboard Cache
Cache the last known leaderboard in localStorage.
- Shows stale data with timestamp when offline
- Tiny fix, big improvement for mobile players

### Community Stats Banner
Live counter on the main screen — total games played and total XP earned across all players.
- Makes the game feel alive even when the leaderboard is sparse
- Single Supabase aggregate query

---

## Long Term

### Season System
Monthly seasons with a unique exclusive skin or collection card as the reward.
- Resets the global leaderboard each season
- "Season ends in X days" counter — strong retention mechanic
- Season number tracked in player profile

### Tournament Mode
48-hour limited event with a special seeded board and separate leaderboard.
- Exclusive reward for top 3 finishers
- Drives announcements and social sharing
- Triggered manually via admin or scheduled cron

### Challenge Link
Generate a shareable URL with a specific board seed.
- "Beat my score on THIS board"
- Pure social mechanic, zero backend cost

### Prestige System
Once you reach max rank (SINGULARITY, 10 000 XP), reset XP for a prestige badge.
- Prestige badge shown in dossier
- Exclusive prestige collection card unlocked
- Rank display shows prestige tier

### Friend Codes
Invite a friend using a unique code.
- Both players receive an exclusive bonus collection card
- No social login required — purely code-based

### iOS App
PWA wrapped via PWABuilder (Microsoft tool) — generates Xcode project from `manifest.json`, similar to Bubblewrap for Android.
- Requires Mac + Xcode (already have Mac ✅) + Apple Developer account ($99/yr annual fee)
- Use PWABuilder to generate WKWebView wrapper — no Swift code required
- `assetlinks.json` equivalent: Apple App Site Association (`/.well-known/apple-app-site-association`)
- Dependent on Android Play Store traction first

---

## Completed ✓

- [x] 4 game modes (Classic, Blitz, Survival, Daily)
- [x] 4 difficulty levels
- [x] 10 rank progression system
- [x] 10 card skins with unlock conditions
- [x] 16 collection cards
- [x] 24 achievements
- [x] 11 sound themes
- [x] 11 table themes
- [x] Combo system with XP bonuses
- [x] Player dossier with full stats
- [x] Konami code easter egg
- [x] PWA — installable and offline
- [x] Mobile-first responsive layout
- [x] Cross-device sync (Supabase auth)
- [x] Welcome email on registration (Resend)
- [x] Re-engagement email after 14 days inactive
- [x] Post-donation thank-you email
- [x] Vercel cron job for daily re-engagement
- [x] Zero Sonar issues
- [x] Weekly Challenge — seeded hard board resetting every Monday, double XP on first clear, independent streak
- [x] Daily Login Streak — consecutive-day bonus XP, HUD counter, streak freeze covers one missed day
- [x] Card flip animation toggle — disable in settings, plus prefers-reduced-motion support
- [x] Game History — last 10 games in Dossier (mode, difficulty, time, moves, combo, XP)
- [x] Daily Quests — 3 rotating objectives per day, bonus XP, resets midnight
- [x] Extreme combo time bonus — each combo in Extreme adds +10s to the countdown
- [x] Color Blind Mode — blue/orange palette + dashed border shape cue, persists across sessions
- [x] Leaderboard — top 10 by XP, gold/silver/bronze medals, self-highlight
- [x] Haptic feedback — flip/match/error/combo/win/lose with toggle
- [x] Haptics toggle persists across sessions
- [x] Password reset flow with cyberpunk email via Resend
- [x] Share score card — Canvas 900x500, Web Share API + download fallback
- [x] Sound preference persists across sessions
- [x] Achievement notifications — pulsing popup with haptic + counter
- [x] Daily leaderboard — GLOBAL/TODAY tabs, fastest time wins, resets daily
- [x] Profile page — rank, XP bar, stats, best times, achievements/collection count
- [x] Streak freeze — earned every 7 days, auto-burns on missed day, HUD indicator
- [x] Android TWA — signed AAB published to Google Play (`xyz.laddtnov.breachos`)
- [x] Privacy policy page (`/privacy`) — GDPR + COPPA compliant
- [x] `assetlinks.json` — TWA domain verification
- [x] Security hardening — HSTS, CSP, rate limiting, service role key isolation
- [x] Survival rework — escalation continues past wave 13 via countdown decay plus ghost/trap/glitch modifiers
- [x] Survival lives earned back — flawless wave restores one life, capped at 5
- [x] Survival risk/reward scoring — streak multiplier grows on clean waves, resets on life loss
- [x] Achievement badges — Dossier badge grid, locked entries as silhouettes with unlock tooltips
- [x] Haptic presets — SUBTLE / STANDARD / INTENSE, selectable and persisted
- [x] Achievements consolidated into the Dossier — standalone modal removed, badges tappable with an unlock-condition detail line
- [x] Win rate could exceed 100% from survival waves — fixed at the source and clamped for existing saves
- [x] Shared board setup across all four modes, one .hidden utility, one modal toggle helper
