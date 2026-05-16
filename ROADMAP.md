# BreachOS — Roadmap

Planned features and improvements. Subject to change based on player feedback.

---

## In Progress

Nothing currently in active development.

---

## Medium Term

### Android App (Capacitor)
Wrap the existing PWA into a native Android APK.
- Remove donation button for the app build
- Generate icons and splash screen
- Handle Android back button
- Publish to Google Play ($25 one-time fee)

### Weekly Challenge
A special seeded board that resets every Monday.
- Separate from the daily challenge
- Higher XP reward
- Streak tracked independently

### Push Notifications (PWA)
Remind players about the daily challenge via browser push.
- "Your daily mission is available" at a set time
- Opt-in only, respects user preference
- Uses Web Push API + Vercel endpoint

---

## Long Term

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
Same Capacitor approach as Android.
- Requires Mac + Xcode + Apple Developer account ($99/yr)
- Dependent on Android release success

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
