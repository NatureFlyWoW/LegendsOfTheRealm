# Legends of the Shattered Realm — Project Plans Index

## Overview

This directory contains the complete game design document split into focused files for independent subagent work. Each file is self-contained with cross-references to related files where dependencies exist.

**Source Document:** `game-design-plan-detailed.md` (5,951 lines, ~47,000 words)
**Game:** Legends of the Shattered Realm — An Offline Idle/Incremental MMORPG
**Tech Stack:** Electron + TypeScript + React + SQLite + Vite
**Art Style:** High-fidelity ASCII/ANSI (Caves of Qud inspired)

---

## File Index

### Shared Reference (read first)

| File | Description | Key Contents |
|------|-------------|-------------|
| `00_overview_and_decisions.md` | Design vision, resolved open questions, core philosophy | Executive summary, art style decision, 90s fantasy feel, engagement philosophy, tech stack choice, offline/no-monetization impact |

### Core Systems (engine/architecture)

| File | Description | Key Contents |
|------|-------------|-------------|
| `01_core_engine_architecture.md` | Technical architecture and engine systems | Tech stack details, project structure, save system (SQLite schema), idle time calculation, offline progress simulation code, simulated party system |

### Gameplay Systems

| File | Description | Key Contents |
|------|-------------|-------------|
| `02_character_and_combat.md` | Character creation and combat engine | 6 races, 8 classes, 24 talent trees (all specs), combat formulas (damage/healing/threat), hit tables, XP curves, leveling system |
| `06_economy_and_professions.md` | Economic and crafting systems | Loot tables, item budgets, drop rates, gold sources/sinks, 6 gathering+crafting professions, 3 secondary professions, profession synergies |

### Content (zones, dungeons, raids)

| File | Description | Key Contents |
|------|-------------|-------------|
| `03_zones_and_quests.md` | World content and quest design | 12 zones (levels 1-60), quest chains per zone, XP totals, breadcrumb quests, zone themes |
| `04_dungeons.md` | 5-player instanced content | 6 dungeons, all boss mechanics/abilities/strategies/loot, simulated party system, companion quality tiers |
| `05_raids.md` | Endgame raid content | 4 raid tiers (10 and 20-character), all boss encounters, phase breakdowns, loot tables, tier tokens, single difficulty philosophy |

### Presentation Layer

| File | Description | Key Contents |
|------|-------------|-------------|
| `07_ui_ux_and_art.md` | Visual design and audio | ASCII art style spec, UI layout mockups, character sheet, inventory, zone map, combat log, companion quality screen, tooltip system, audio design (music + SFX) |

### Meta & Endgame

| File | Description | Key Contents |
|------|-------------|-------------|
| `08_meta_systems.md` | Engagement loops and collection systems | Active engagement design, daily/weekly systems, 600+ achievements, 5 legendary questlines (full quest chains), guild hall upgrades |
| `10_chase_items.md` | Rare and exotic collectibles | Ultra-rare world drops, rare spawn bosses, dungeon/raid ultra-rares, fishing treasures, hidden items, cosmetic chase items, crafting materials, reputation rewards |

### Roadmap

| File | Description | Key Contents |
|------|-------------|-------------|
| `09_post_launch_roadmap.md` | Future content plan | 7 phases across 2+ years: polish, content expansion, Monk class, PvP arena, level cap increase, prestige system, community features |

---

## Dependency Map

```
00_overview_and_decisions.md  <-- ALL files reference this for core design pillars
        |
        v
01_core_engine_architecture.md  <-- Foundation: save system, tick loop, idle calc, simulated party
        |
        +---> 02_character_and_combat.md  (combat runs on tick system)
        |         |
        |         +---> 04_dungeons.md  (uses combat formulas, simulated party system)
        |         +---> 05_raids.md  (uses combat formulas, simulated party system)
        |         +---> 06_economy_and_professions.md  (loot tied to combat)
        |
        +---> 07_ui_ux_and_art.md  (renders via Canvas API from engine)
        |
        +---> 03_zones_and_quests.md  (quest progress tracked in save system)

08_meta_systems.md  <-- references dungeons, raids, professions, zones
10_chase_items.md  <-- references all content (zones, dungeons, raids, professions)
09_post_launch_roadmap.md  <-- references all existing systems
```

## Subagent Assignment Recommendations

| Agent Role | Primary Files | Reference Files |
|-----------|---------------|-----------------|
| **Engine/Architecture** | `01_core_engine_architecture.md` | `00_overview` |
| **Combat System** | `02_character_and_combat.md` | `00_overview`, `01_core_engine` |
| **World/Quest Content** | `03_zones_and_quests.md` | `00_overview` |
| **Dungeon Content** | `04_dungeons.md` | `00_overview`, `02_character_combat` |
| **Raid Content** | `05_raids.md` | `00_overview`, `02_character_combat` |
| **Economy/Crafting** | `06_economy_and_professions.md` | `00_overview`, `02_character_combat` |
| **UI/UX Developer** | `07_ui_ux_and_art.md` | `00_overview`, `01_core_engine` |
| **Meta Systems** | `08_meta_systems.md` | `00_overview`, all content files |
| **Chase Items Designer** | `10_chase_items.md` | All content files |
| **Roadmap/Planning** | `09_post_launch_roadmap.md` | All files |

---

## Major Design Changes (Revision History)

### February 2026 Revision

**1. Removed Difficulty Tiers:**
- Scrapped Heroic/Mythic modes from dungeons and raids
- Removed Mythic+ system entirely (keystones, affixes, scaling, leaderboards)
- Single difficulty per dungeon/raid — designed to be challenging and rewarding
- Old-school philosophy: clearing content IS the achievement, not a stepping stone

**2. Implemented Simulated Party System:**
- Removed alt-based party mechanics
- Each character is fully independent
- NPC companions auto-generated based on your spec (tank/healer/DPS detection)
- Companion quality progression (Recruit → Veteran → Elite → Champion)
- Unlocked through repeated dungeon/raid clears
- Mimics "guild progression" feel as companions improve

**3. Added Chase Items System:**
- New comprehensive file `10_chase_items.md`
- 9 categories of rare/exotic items to collect
- Ultra-rare world drops, rare spawns, hidden items, cosmetic collections
- Fishing/profession ultra-rares, reputation rewards, legendary materials
- Provides long-term goals beyond raid progression
- Pure prestige/collection endgame (no power gates)
