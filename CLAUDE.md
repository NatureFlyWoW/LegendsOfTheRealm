# Legends of the Shattered Realm — Claude Code Guide

## Project Overview
An offline, single-player idle/incremental MMORPG inspired by classic 2004-era MMOs (WoW, EverQuest). The player builds a roster of characters, levels them through zones, gears them in dungeons, and fields full raid teams — all through idle/incremental mechanics.

**Key constraints:**
- Fully offline — no server, no online component, local saves only
- No monetization — passion project / free game
- Single developer or small team scope

**Key design decisions (Feb 2026 revision):**
- No difficulty tiers — one difficulty per dungeon/raid, tuned to be hard
- No alt-based parties — NPC companion system (Recruit → Veteran → Elite → Champion)
- Each character is independent — dungeons use 5-char parties, raids use 10/20-char with companions
- Free respecs, unlimited alts, all cosmetics earnable in-game

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

### 0. Verify CGC is indexed (self-healing)
- Run `get_repository_stats` for this repo before doing any code lookups
- If it returns 0 files or errors, run `add_code_to_graph` on the project root and wait for completion
- If CGC is completely unavailable, fall back to Grep/Glob for the session and note this in your response

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
- After changes, use `find_callers` to identify all affected call sites

### 5. Verify (run tests)
- Run `vitest run` after implementation — do not report completion until tests pass
- If tests fail, debug using `superpowers:systematic-debugging` skill

### When to skip CGC
- Trivial edits where you already know the exact file and line
- Creating brand-new files with no existing dependencies
- Non-code tasks (docs, config, data-only JSON)

## Agent Ownership Map

| Directory | Owner | Notes |
|-----------|-------|-------|
| `src/game/engine/` | realm-engine | Game loop, tick system |
| `src/game/state-machines/` | realm-engine | Dungeon/raid/quest flow |
| `src/game/rng/` | realm-engine | Seeded RNG system |
| `src/game/systems/` | realm-engine | Cross-cutting game systems |
| `src/game/combat/` | realm-combat | Pure combat formulas |
| `src/game/data/` | realm-data | JSON content files |
| `src/renderer/` | realm-ui | React components, Zustand stores, ASCII renderer |
| `src/main/` | realm-engine | Electron main process |
| `src/shared/` | **shared** | Coordinate across agents |
| `tests/` | Mirrors `src/` ownership | Each agent owns tests for their domain |

## Custom Agent Rules

When creating or modifying agent definitions in `.claude/agents/`:
- **ALWAYS include an explicit `tools:` field** — e.g., `tools: Read, Write, Edit, Bash, Glob, Grep`. Without this, agents inherit all parent session tools including MCP duplicates, causing a fatal "Tool names must be unique" API error.
- **Do NOT use `mcpServers`, `memory`, or `skills`** in agent frontmatter — these can cause tool duplication or other conflicts.
- Agent frontmatter should only contain: `name`, `description`, `tools`, and `model`.
- **Agent definitions are cached at session start** — any edits to `.claude/agents/*.md` only take effect after restarting the session.
- **NEVER fall back to `general-purpose` agents** when custom realm-* agents exist. If realm agents are broken in the current session, use `voltagent-domains:game-developer` or `voltagent-lang:typescript-pro` as capable domain stand-ins until the fix is applied.

## Shared Types Protocol

When modifying any file in `src/shared/`:
1. Use CGC `find_importers` to identify all files that import the changed module
2. Use `find_callers` on any changed function signatures
3. If changes affect another agent's domain (per ownership map above), include `[shared-type-change]` in the commit message
4. The orchestrator will verify cross-domain compatibility before merging

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
4. **Content** — Zones, dungeons (one difficulty), raids (10/20-char with NPC companions)
5. **Professions** — Gathering, crafting, recipes, cooldowns
6. **Companion System** — NPC party members, quality tiers (Recruit→Champion), unlocked through clears
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
