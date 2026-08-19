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

### Achievement Badges on Profile
Visual badge grid in Dossier showing earned achievements.
- Locked badges shown as silhouettes
- Tooltip with unlock condition

### Timed Mode Variant
Race the clock — single fixed timer regardless of difficulty.
- No per-move time, just survive the countdown
- Separate leaderboard entry

### Haptic Patterns
Distinct haptic patterns per game event (flip, match, combo, win, lose).
- Extends existing `haptics.js`
- Pattern presets selectable in settings

---

## v1.7.0 — Social & Monetization

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

## Long Term

---

## Medium Term

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
Once you reach max rank (NETRUNNER ELITE), reset XP for a prestige badge.
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
- [x] 5 rank progression system
- [x] 10 card skins with unlock conditions
- [x] 16 collection cards
- [x] 16 achievements
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
