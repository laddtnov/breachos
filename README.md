# Cyberpunk Memory Match

A cyberpunk-themed memory card game built with vanilla HTML, CSS, and JavaScript. Match pairs of sci-fi operatives across multiple game modes, earn XP, unlock ranks, collect card skins, and climb the achievement ladder.

**[Play Now](https://breachos.laddtnov.xyz//)**

## Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

- **HTML5** — Semantic markup, data attributes, PWA manifest
- **CSS3** — 3D transforms, keyframe animations, CSS Grid, `backdrop-filter`, conic gradients
- **JavaScript (ES6+)** — Web Audio API, seeded PRNG, localStorage persistence, service worker
- **Zero dependencies** — No frameworks, no bundler, no libraries

## Screenshots

| Mission Briefing | Game Board |
|:---:|:---:|
| ![Mission Briefing](screenshots/01-mission-briefing.png) | ![Game Board](screenshots/02-game-board.png) |

| Gameplay | Mission Complete |
|:---:|:---:|
| ![Gameplay](screenshots/03-gameplay.png) | ![Mission Complete](screenshots/04-mission-complete.png) |

| Mission Failed |
|:---:|
| ![Mission Failed](screenshots/05-mission-failed.png) |

## Game Modes

| Mode | Description |
|------|-------------|
| **Classic** | Standard rules — limited moves, no timer (except Extreme) |
| **Blitz** | Race the clock! Every difficulty has a countdown, no move limits |
| **Survival** | Endless escalating waves with 3 lives. Difficulty cycles Easy > Medium > Hard > Extreme and loops with increasing time pressure |
| **Daily Challenge** | Seeded daily puzzle — same cards for everyone. Difficulty rotates by day of the week. Track your streak |

## Features

### Core Gameplay
- **4 Difficulty Levels** — Easy (3x2), Medium (4x4), Hard (4x6), Extreme (6x6)
- **18 Cyber Operatives** — NETRUNNER, ANDROID, MECH PILOT, GHOST, SAMURAI, MEDIC, SNIPER, VIRUS, CYBORG, DRONE, PHANTOM, REAPER, HACKER, SYNTH, BLADE, ORACLE, WRAITH, GLITCH
- **Combo System** — Chain consecutive matches for bonus XP with escalating visual feedback
- **Move Limit** — Strategic pressure per difficulty (Blitz removes this, adds countdown instead)

### Progression System
- **5 Ranks** — ROOKIE > AGENT > SPECIALIST > GHOST > NETRUNNER ELITE
- **XP Calculation** — Based on difficulty, move efficiency, speed, and combo chains
- **7 Card Skins** — Default, Hologram, Corrupted, Gold Circuit, Elite Neon, Survivor, Chrono
- **7 Collection Cards** — SENTINEL, SPECTER, INFERNO, ZERO, NEXUS, PHOENIX, ORACLE PRIME
- **11 Achievements** — Zero Errors, Speedrunner, Combo Master, Extreme Survivor, Perfectionist, Grinder, Wave Rider, Unkillable, Devoted, Daily Warrior, Blitz Ace

### Reward Unlocks

| Reward | Type | How to Unlock |
|--------|------|---------------|
| Hologram skin | Card Skin | Reach AGENT rank |
| Corrupted skin | Card Skin | Reach SPECIALIST rank |
| Gold Circuit skin | Card Skin | Reach GHOST rank |
| Elite Neon skin | Card Skin | Reach NETRUNNER ELITE rank |
| Survivor skin | Card Skin | Survive to Wave 5 |
| Chrono skin | Card Skin | 7-day Daily streak |
| PHOENIX card | Collection | Survive to Wave 10 |
| ORACLE PRIME card | Collection | 30-day Daily streak |

### Audio & Visuals
- **Procedural Sound Engine** — Web Audio API synthesized sounds (flip, match, error, win, lose, countdown ticks)
- **5 Sound Themes** — Cyber, Retro, Minimal, Vapor, Dark
- **5 Table Themes** — Swappable board aesthetics
- **Win Effects** — Neon particle rain, scanline sweep, glitch animations
- **Lose Effects** — Red glitch overlay, screen shake on countdown
- **Combo Display** — Color-escalating combo counter with pop animation

### Quality of Life
- **Player Dossier** — Full stats dashboard (games played, win rate, best times, best combo)
- **Share Card** — Canvas-generated result image for sharing
- **Cyber Mode / Safe Mode** — Toggle to disable animations for accessibility
- **Respects `prefers-reduced-motion`**
- **Mobile-first** — Hamburger menu on tablet/mobile, responsive grid layouts
- **PWA** — Installable, works offline via service worker
- **Konami Code** — Easter egg

## Project Structure

```
Playing-Cards/
  index.html          # Single-page app
  manifest.json       # PWA manifest
  sw.js               # Service worker (cache-first)
  css/
    base.css          # Reset, variables, body, typography
    hud.css           # Game HUD bar
    cards.css         # Card flip, match, error animations
    skins.css         # 7 card back skins + skin selector modal
    modals.css        # Rules/briefing modal
    overlays.css      # Win/lose overlays
    controls.css      # Desktop controls + mobile hamburger menu
    combo.css         # Combo counter display
    achievements.css  # Achievement popup + modal
    collections.css   # Card collection modal
    dossier.css       # Player stats dossier
    donations.css     # Donation page
    themes.css        # Table theme styles
    konami.css        # Easter egg styles
    sound-themes.css  # Sound theme selector
    survival.css      # Survival mode HUD + overlays
    daily.css         # Daily challenge HUD + overlays
    responsive.css    # Breakpoints (1024/768/480px) + reduced motion
  js/
    data.js           # Characters, difficulties, ranks, constants
    sound.js          # Web Audio API procedural sound engine
    rank.js           # XP, rank calculation, skin unlocks
    game.js           # Core game loop, state, card matching, timer
    collections.js    # Reward cards + collection modal
    achievements.js   # 11 achievements + unlock checks
    survival.js       # Survival mode (waves, lives, scoring)
    daily.js          # Daily challenge (seeded PRNG, streaks)
    dossier.js        # Player stats dossier panel
    share.js          # Canvas share card generator
    themes.js         # Table theme switcher
    sound-themes.js   # Sound theme switcher
    konami.js         # Konami code easter egg
    donations.js      # Donation modal
    ui.js             # UI helpers, skin modal, menu, init
  screenshots/        # README screenshots
```

## How to Play

1. Select a game mode and difficulty from the Mission Briefing screen
2. Click cards to reveal hidden cyber operatives
3. Find matching pairs before running out of moves (or time in Blitz/Daily)
4. Chain consecutive matches for combo bonuses
5. Earn XP to rank up, unlock skins, and collect reward cards

## Run Locally

```bash
git clone https://github.com/laddtnov/cyberpunk-memory-match.git
cd cyberpunk-memory-match
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

## License

MIT
