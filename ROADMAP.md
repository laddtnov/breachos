# BreachOS — Roadmap

Planned features and improvements. Subject to change based on player feedback.

---

## In Progress

Nothing currently in active development.

---

## Short Term

### Share Score Card
After a win, generate a shareable image using the Canvas API.
- Shows difficulty, time, moves, max combo, rank
- One-tap download or share sheet on mobile
- Cyberpunk aesthetic matches the game

---

## Medium Term

### Android App (Capacitor)
Wrap the existing PWA into a native Android APK using Capacitor.
- Remove donation button for the app build
- Generate icons and splash screen
- Handle Android back button
- Publish to Google Play ($25 one-time fee)

### Weekly Challenge
A special seeded board that resets every Monday.
- Separate from the daily challenge
- Higher XP reward
- Streak tracked independently

### Profile Page
Dedicated screen showing all player stats in one place.
- All-time stats, best times per difficulty
- Achievement showcase
- Collection card gallery
- Rank history

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
Same Capacitor approach as Android, requires Mac + Xcode + Apple Developer account ($99/yr).
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
- [x] Haptic feedback — flip/match/error/combo/win/lose with toggle in mobile menu
- [x] Password reset flow with cyberpunk email via Resend
