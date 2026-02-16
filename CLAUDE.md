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

## Code Lookup Workflow (CGC-First)
All agents and the main session use CodeGraphContext (CGC) as the primary code navigation tool. **Always orient with CGC before reading files.**

### 1. Orient (CGC queries — fast, cheap)
- `find_code("SymbolName")` — locate functions, interfaces, classes, variables
- `analyze_code_relationships` — `find_callers`, `find_callees`, `module_deps`, `who_modifies` to trace dependencies
- `find_most_complex_functions` — identify hotspots when optimizing or refactoring
- `execute_cypher_query` — custom queries for anything the above don't cover

### 2. Target (Read only what CGC identified)
- Read specific files and line ranges surfaced by CGC — not entire directories
- If CGC returns no results for a symbol, fall back to Grep/Glob, then Read

### 3. Look up external APIs (context7)
- Use context7 to look up library/framework docs when needed (Electron, Kysely, Zustand, React, Vitest, Canvas API, Tailwind, etc.)
- CGC indexes *our* code; context7 covers *external* APIs and language references

### 4. Implement (Edit with full context)
- You now know the call graph, dependencies, and related interfaces — edit confidently
- After changes, use `find_callers` to verify nothing upstream broke

### When to skip CGC
- Trivial edits where you already know the exact file and line
- Creating brand-new files with no existing dependencies
- Non-code tasks (docs, config, data-only JSON)

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
