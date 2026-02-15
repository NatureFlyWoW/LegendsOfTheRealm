# UI/UX Specifications & Art Direction

> **Role:** Presentation layer reference for UI/UX and rendering subagent.
> **Related files:** `00_overview_and_decisions.md` (art style decision, ASCII spec), `01_core_engine_architecture.md` (Canvas API renderer)

---

## ASCII ART TECHNICAL SPECIFICATION

**Display:** CP437 extended ASCII + ANSI color codes (16 foreground + 16 background)
**Tile System:** Each game tile = character + foreground color + background color
**Unicode:** Supplement with box-drawing (U+2500-U+257F) for borders and effects
**Font:** Crisp bitmap font ("Px437 IBM VGA8" or "Terminus") at 16x16 pixel character size
**Effects:** Particle systems using `*.·°¤x+÷±~≈` for magic
**Animation:** Color cycling + character substitution (fire: `@&%$` cycling orange/red/yellow)

**Character Representation Example:**
```
LEVEL 60 WARRIOR (PROTECTION SPEC)
┌─────────────────────────────────┐
│         ┌───┐                   │
│         │ @ │   HP: ████████░░  │
│         └─┬─┘   Rage: ███░░░░░  │
│           │                      │
│          /█\    Str: 425         │
│         / | \   Sta: 380         │
│        /  |  \  Def: 650         │
│       │   │   │                  │
│      ▓▓   █   ▓▓ iLvl: 115       │
│                                  │
│ ≡ [SHIELD WALL] Ready           │
│ ⚔ [DEVASTATE] 2.4s              │
└─────────────────────────────────┘
```

**Zone Representation Example:**
```
╔═══════════════════════════════════════════════════════════╗
║ The Shattered Realm (Zone Level 55-60)                   ║
╠═══════════════════════════════════════════════════════════╣
║  ≈ Void Storms    ▲ Jagged Peaks   ░ Corrupted Forest   ║
║  * Planar Rift    @ You (party)    D Dungeon Entrance   ║
║  ╬ Citadel Ruins  Φ World Boss     ♠ Quest Objective   ║
╚═══════════════════════════════════════════════════════════╝
```

---

## UI PHILOSOPHY

**Principles:**
- **Information-Dense**: Classic MMO style, lots of data visible
- **ASCII-Native**: UI built with box-drawing characters, not separate graphics
- **Tooltip-Heavy**: Hover over anything for detailed info
- **Resizable Panels**: Players can resize/reposition windows
- **Multiple Simultaneous Views**: Character sheet + inventory + combat log + map all visible

---

## SCREEN LAYOUT (1920x1080 target)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Legends of the Shattered Realm]                               [Gold: 1,234g]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──── CHARACTER LIST ────┐  ┌────────── MAIN VIEW ──────────┐  ┌─ COMBAT ─┐  │
│  │                         │  │                               │  │ LOG      │  │
│  │ ☼ Thorgrim (60) [Tank]  │  │     (Zone Map / Char Sheet    │  │          │  │
│  │ ♣ Elara (60) [Healer]   │  │      / Inventory / Companions │  │ Scrolling│  │
│  │ ★ Grimjaw (58) [DPS]    │  │      / etc. via Tab Bar)      │  │ combat   │  │
│  │   Kael (42) [DPS]       │  │                               │  │ events   │  │
│  │ + Create New            │  │                               │  │          │  │
│  │                         │  └───────────────────────────────┘  └──────────┘  │
│  │ [Switch Character]      │                                                   │
│  │ [Companion Quality]     │  ┌──────── QUEST TRACKER ───────┐                │
│  │ [Guild Hall]            │  │ ☐ Kill 10 Fire Elementals    │                │
│  └─────────────────────────┘  │    Progress: 7/10             │                │
│                                │ [Turn In] [Abandon]           │                │
│  ┌──── QUICK ACTIONS ─────┐  └───────────────────────────────┘                │
│  │ [Start Grinding]        │                                                   │
│  │ [Queue Dungeon]         │                                                   │
│  │ [Open Professions]      │                                                   │
│  │ [Auction House]         │                                                   │
│  │ [Talent Tree]           │                                                   │
│  └─────────────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## CHARACTER SHEET (Hotkey: C)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ CHARACTER SHEET — Thorgrim the Undying (Level 60 Warrior - Protection)       ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  ┌─── PAPER DOLL ───┐    ┌──── STATS ────┐    ┌── TALENTS ──┐             ║
║  │  Gear slot icons  │    │ HP: 11,450     │    │ Spec: Prot  │             ║
║  │  with equipped    │    │ Str: 425       │    │ 60/0/0      │             ║
║  │  item display     │    │ Armor: 9,850   │    │ [Respec]    │             ║
║  └───────────────────┘    │ Defense: 402   │    └─────────────┘             ║
║                           │ iLvl: 118 avg  │                                ║
║  ┌── PROFESSIONS ──┐     └────────────────┘                                ║
║  │ Mining: 300/300  │                                                       ║
║  │ BS: 300/300      │     [Equip Manager] [Transmog] [Titles]              ║
║  └──────────────────┘                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Hover Tooltips:**
- Hover stat: Shows formula breakdown ("Armor: 9,850 (4,200 from gear, 5,650 from talents/buffs)")
- Hover gear: Shows item tooltip with compare
- Hover talent: Shows description and requirements

---

## INVENTORY PANEL

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ INVENTORY                                              Weight: 180/250        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  ┌─ BAG 1 (20-slot) ─┐ ┌─ BAG 2 (20) ─┐ ┌─ BAG 3 (18) ─┐ ┌─ BAG 4 (16) ─┐  ║
║  │ Grid of item icons │ │ ...           │ │ ...           │ │ ...           │  ║
║  └───────────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  ║
║  Legend: ⚔=Weapon ◈=Armor ◎=Consumable ⬟=Quest ◉=Material ░=Empty           ║
║  [Sort] [Sell Junk] [Disenchant Blues] [Deposit Reagents]                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Item Tooltip (on hover):**
```
┌─────────────────────────────────────┐
│ Ironbeard's Bulwark                 │
│ ████ EPIC ████                      │
│ Item Level: 75                      │
│ Shield / 2,845 Armor                │
│ +45 Stamina, +38 Defense            │
│ +22 Block, +18 Dodge                │
│ Durability: 92/100                  │
│ Equip: Block restores 500 party HP  │
│ "Forged in the fires of Irondeep"   │
│ [Equip] [Transmog] [Sell: 12g 50s] │
└─────────────────────────────────────┘
```

---

## ZONE MAP

ASCII map with symbols: `▲` Mountains, `@` Party, `♦` Quest, `╬` Lava, `Φ` Dungeon, `F` Flight Master, `≈` River, `░` Forest, `◙` Camp, `☼` Volcanic, `⚔` Elite, `⚑` Inn

Interactive: Click location to auto-path. Hover for details. Quest objectives pulsing.

---

## COMBAT LOG

Right-side scrolling feed with timestamps, damage/healing events, buff/debuff tracking, threat values.

**Filters:** All / Damage / Healing / Buffs / Errors | Self / Party / Enemies
**Export:** Save to `.txt` for analysis

---

## COMPANION QUALITY SCREEN

Shows your current companion quality tiers for each dungeon and raid. Displays progress toward unlocking next tier.

**Companion Progress Example:**
```
╔═══════════════════════════════════════════════════════════════╗
║ NPC COMPANION QUALITY                                         ║
╠═══════════════════════════════════════════════════════════════╣
║  Deadhollow Crypt:     [████████░░] ELITE (10/25 Champion)   ║
║  Irondeep Forge:       [██████████] CHAMPION                 ║
║  Hall of Frost King:   [████░░░░░░] VETERAN (3/10 Elite)     ║
║                                                               ║
║  Molten Sanctum:       [██████░░░░] ELITE (2/15 Champion)    ║
║  Tomb of Ancients:     [██░░░░░░░░] RECRUIT (0/1 Veteran)    ║
║                                                               ║
║  Quality Bonuses:                                             ║
║  • Recruit:   70% performance (default)                       ║
║  • Veteran:   85% performance (clear once)                    ║
║  • Elite:    100% performance (dungeons: 10 clears)           ║
║  • Champion: 115% performance (dungeons: 25 clears)           ║
╚═══════════════════════════════════════════════════════════════╝
```

**Active Character Spec:**
When entering a dungeon/raid, shows your detected role and how companions will be generated:
- Your spec: Protection Warrior (Tank)
- Companions: 1 Healer + 3 DPS (quality: Elite)

---

## TOOLTIP SYSTEM

- Every UI element has hover state
- 0.3s delay before tooltip appears
- Smart positioning (avoids screen edges)
- Rich formatting: colors, icons, tables
- Ability tooltips show damage formula breakdown, your specific numbers, related talents

---

## AUDIO DESIGN

### Philosophy
- **Retro-inspired**: MIDI-style music, 8-bit/16-bit SFX
- **Nostalgic**: Evokes 90s PC games
- **Minimal but Effective**: ASCII visuals + chiptune = cohesive aesthetic
- **Functional**: Audio cues for important events

### Music Tracks (~20-25 total)

**Zone Music (12 tracks):**
| Zone | Style | BPM |
|------|-------|-----|
| Greenhollow Vale | Peaceful, pastoral, flute | 90 |
| Thornwood Forest | Ominous, minor key, strings | 85 |
| Dustwatch Plains | Adventurous, tribal drums | 100 |
| Irondeep Mines | Industrial, deep bass, hammer | 70 |
| Mistral Coast | Seafaring, accordion-like | 95 |
| Blighted Moor | Dark, plague theme, low strings | 75 |
| Emberpeak Mountains | Epic, volcanic, intense | 110 |
| Whispering Wastes | Arabic-inspired, mysterious | 80 |
| Starfall Highlands | Magical, shimmering bells | 105 |
| Shadowfen Depths | Tribal, drums, deep jungle | 90 |
| Frozen Reach | Cold, sparse, icy winds | 65 |
| Shattered Realm | Chaotic, dissonant | 120 |

**Dungeon Music (4):** Standard (100), Undead (85), Fire (115), Ice (75)
**Raid Music (4):** Molten Sanctum (130), Tomb (95), Citadel (125), Void King (140)
**UI/Menu (2):** Main Menu (100), Character Select (80)
**Special (2):** Victory Fanfare (10s), Death Theme (5s)

### Sound Effects

**Combat:** Melee hit (clang/thud by weapon), spell cast (whoosh), critical (metallic ding), block/dodge (deflection), death (groan)
**UI:** Button click, window open/close, item pickup (clink), gold (jingle), quest complete (chime), level up (grand fanfare 3s), achievement (special chime)
**World:** Footsteps (terrain-specific), doors, chests, mining (pickaxe), herbalism (rustle), fishing (splash)
**Alerts:** Low health (heartbeat at <30%), enrage warning, ready check (ding)
**Loot Quality:** Common (clink) → Uncommon → Rare (shimmering) → Epic (deep gong) → Legendary (epic fanfare 5s)

### Audio Settings
Master/Music/SFX/Ambient/UI volumes (0-100%). Mute on minimize. Custom playlist support (drop MP3s in `/music/`).

### Technical
**Library:** Howler.js | **Format:** OGG Vorbis | **Budget:** ~50 MB total | Seamless loops
