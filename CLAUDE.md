# Legends of the Shattered Realm — Claude Code Guide

## Project Overview
An offline, single-player idle/incremental MMORPG inspired by classic 2004-era MMOs (WoW, EverQuest). The player builds a roster of characters, levels them through zones, gears them in dungeons, and fields full raid teams — all through idle/incremental mechanics.

**Key constraints:**
- Fully offline — no server, no online component, local saves only
- No monetization — passion project / free game
- Single developer or small team scope

## Design Reference
- `game-design-plan.md` — Original game design vision and overview
- `game-design-plan-detailed.md` — Comprehensive design document with all systems fully specified

## Architecture Principles
- **Data-driven design**: Game content (zones, items, skills, mobs) defined in data files, not hardcoded
- **Tick-based simulation**: Core combat loop runs on a tick system (1 tick/second)
- **Offline progression**: Calculate idle gains on return using elapsed time + simulation
- **Modular systems**: Character, combat, inventory, crafting, progression as independent modules
- **Save integrity**: Local save system with versioning and corruption protection

## Code Conventions
- Write clear, self-documenting code — comments only where logic is non-obvious
- Use descriptive names that match game design terminology (e.g., `talentTree`, `ilvl`, `gearSlot`)
- Keep game balance numbers in config/data files, not scattered in code
- All randomness must use a seeded RNG for reproducibility and save consistency
- Prefer composition over inheritance for game entities

## Game Systems (Key Modules)
1. **Character System** — Creation, races, classes, 24 talent specs, stats
2. **Combat Engine** — Tick-based auto-battler, ability rotations, damage formulas
3. **Progression** — XP curves, leveling 1-60, gear iLvl system
4. **Content** — Zones, dungeons (Normal/Heroic/Mythic), raids (10/20-man)
5. **Professions** — Gathering, crafting, recipes, cooldowns
6. **Alt Management** — Roster, heirloom system, account-wide bonuses
7. **Economy** — Gold, simulated auction house, vendor pricing
8. **Meta Systems** — Guild hall, achievements, cosmetics, titles
9. **Save/Load** — Local persistence, offline time calculation, save versioning
10. **UI** — Tooltip-heavy, paper doll character sheets, combat logs, MMO-style panels

## Testing Approach
- Unit test combat formulas and stat calculations
- Integration test full combat encounters (known inputs → expected outputs)
- Snapshot test save/load serialization
- Balance testing via simulation (run 1000 fights, check outcome distributions)

## Content Creation Workflow
When adding new game content (zones, dungeons, items, bosses):
1. Define in data files following existing schemas
2. Verify stat budgets match the iLvl/tier expectations from the design doc
3. Test that combat encounters are clearable with appropriately-geared parties
4. Ensure loot tables follow the quality tier distribution rules
