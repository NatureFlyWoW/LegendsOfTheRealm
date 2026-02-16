# Claude Code Setup Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 8 flaws in the Claude Code AI tooling setup — stale info, non-self-healing workflow, bloated agent prompts, duplicated memory, missing ownership map, no shared-type protocol, vague verification, and missing test step.

**Architecture:** All changes are to markdown/config files (CLAUDE.md, 4 agent .md files, MEMORY.md). No source code changes. Each task is one file edit with a verification step.

**Tech Stack:** Markdown files, Claude Code agent config (.claude/agents/), auto-memory (MEMORY.md)

---

### Task 1: Fix stale game design info in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md:1-14` (Project Overview section)
- Modify: `CLAUDE.md:55-66` (Game Systems list)

**Step 1: Add Key Design Decisions to CLAUDE.md**

After the "Key constraints" block (~line 10), add:

```markdown
**Key design decisions (Feb 2026 revision):**
- No difficulty tiers — one difficulty per dungeon/raid, tuned to be hard
- No alt-based parties — NPC companion system (Recruit → Veteran → Elite → Champion)
- Each character is independent — dungeons use 5-char parties, raids use 10/20-char with companions
- Free respecs, unlimited alts, all cosmetics earnable in-game
```

**Step 2: Fix Game Systems list items 4 and 6**

Change item 4 from:
```
4. **Content** — Zones, dungeons (Normal/Heroic/Mythic), raids (10/20-man)
```
To:
```
4. **Content** — Zones, dungeons (one difficulty), raids (10/20-char with NPC companions)
```

Change item 6 from:
```
6. **Alt Management** — Roster, heirloom system, account-wide bonuses
```
To:
```
6. **Companion System** — NPC party members, quality tiers (Recruit→Champion), unlocked through clears
```

**Step 3: Verify**

Read CLAUDE.md and confirm no references to "Heroic", "Mythic", or "Alt Management" remain.

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "fix: update CLAUDE.md with Feb 2026 design decisions"
```

---

### Task 2: Make CGC workflow self-healing + add test/verify steps

**Files:**
- Modify: `CLAUDE.md:22-46` (Code Lookup Workflow section)

**Step 1: Add Step 0 (CGC health-check)**

Insert before the current Step 1 ("Orient"):

```markdown
### 0. Verify CGC is indexed (self-healing)
- Run `get_repository_stats` for this repo before doing any code lookups
- If it returns 0 files or errors, run `add_code_to_graph` on the project root and wait for completion
- If CGC is completely unavailable, fall back to Grep/Glob for the session and note this in your response
```

**Step 2: Fix Step 4 (verify upstream wording)**

Change:
```markdown
- After changes, use `find_callers` to verify nothing upstream broke
```
To:
```markdown
- After changes, use `find_callers` to identify all affected call sites
```

**Step 3: Add Step 5 (test verification)**

Add after Step 4:

```markdown
### 5. Verify (run tests)
- Run `vitest run` after implementation — do not report completion until tests pass
- If tests fail, debug using `superpowers:systematic-debugging` skill
```

**Step 4: Verify**

Read the CGC-First workflow section and confirm it has steps 0-5, with self-healing at step 0 and test verification at step 5.

**Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add self-healing CGC check and test verification to workflow"
```

---

### Task 3: Add ownership path map + shared-type protocol to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (add two new sections after Code Lookup Workflow, before Code Conventions)

**Step 1: Add Agent Ownership Map**

```markdown
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
```

**Step 2: Add Shared Types Protocol**

```markdown
## Shared Types Protocol

When modifying any file in `src/shared/`:
1. Use CGC `find_importers` to identify all files that import the changed module
2. Use `find_callers` on any changed function signatures
3. If changes affect another agent's domain (per ownership map above), include `[shared-type-change]` in the commit message
4. The orchestrator will verify cross-domain compatibility before merging
```

**Step 3: Verify**

Read CLAUDE.md and confirm both sections exist between the CGC workflow and Code Conventions.

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add ownership path map and shared-type change protocol"
```

---

### Task 4: Slim realm-engine.md

**Files:**
- Modify: `.claude/agents/realm-engine.md`

**Step 1: Rewrite to behavioral-only prompt**

Keep: identity, CGC-First workflow, project context brief, development checklist, ownership boundaries, integration, testing responsibilities.

Remove: Detailed breakdowns of game loop (lines 44-50), idle/offline (lines 52-58), save/load (lines 60-66), content state machines (lines 68-72), loot rolls (lines 75-79), Electron main process (lines 82-88), seeded RNG (lines 90-94). These are all in `project_plans/01_core_engine_architecture.md`.

Replace the "Systems You Own" section with a brief summary listing system names and their design doc reference:

```markdown
## Systems You Own

You own 7 core systems. For detailed specs, see `project_plans/01_core_engine_architecture.md`:
- Game loop and tick system (1 tick/second, system update ordering, offline batching)
- Idle/offline progression (time delta, compressed simulation, efficiency penalties)
- Save/load system (SQLite via Kysely, versioned migrations, corruption protection)
- Content state machines (dungeon/raid/quest orchestration, weekly resets)
- Loot roll execution (seeded RNG against loot tables, stat generation)
- Electron main process (app lifecycle, IPC bridge, context isolation)
- Seeded RNG system (deterministic PRNG, per-domain streams, persisted state)
```

**Step 2: Verify**

Count lines in the file. Target: 60-75 lines (down from 128).

**Step 3: Commit**

```bash
git add .claude/agents/realm-engine.md
git commit -m "refactor: slim realm-engine agent prompt, move specs to design docs"
```

---

### Task 5: Slim realm-combat.md

**Files:**
- Modify: `.claude/agents/realm-combat.md`

**Step 1: Rewrite to behavioral-only prompt**

Remove: Detailed formula breakdowns for damage (lines 45-50), healing (lines 52-55), threat (lines 58-62), stat calculations (lines 64-69), attack table (lines 71-77), ability rotation (lines 79-85), encounter resolution (lines 87-92), party composition analysis (lines 94-98). All in `project_plans/02_character_and_combat.md`.

Replace "Systems You Own" with:

```markdown
## Systems You Own

You own 7 combat systems. For detailed formulas, see `project_plans/02_character_and_combat.md`:
- Damage formulas (physical, spell, DoT, AoE, crit — all coefficient-driven)
- Healing formulas (direct, HoT, absorb shields, overhealing tracking)
- Threat system (damage-based, healing split, modifier stacking, target selection)
- Stat calculations (primary stats, secondary ratings with diminishing returns, armor mitigation)
- Attack table resolution (single-roll: Miss→Dodge→Parry→Block→Crit→Hit, must sum to 100%)
- Ability rotation execution (priority queue, resource management, cooldowns, procs, GCD)
- Encounter resolution (tick-by-tick simulation, boss mechanics, victory/wipe/enrage)
```

**Step 2: Verify**

Count lines. Target: 60-75 lines (down from 135).

**Step 3: Commit**

```bash
git add .claude/agents/realm-combat.md
git commit -m "refactor: slim realm-combat agent prompt, move formulas to design docs"
```

---

### Task 6: Slim realm-ui.md

**Files:**
- Modify: `.claude/agents/realm-ui.md`

**Step 1: Rewrite to behavioral-only prompt**

Remove: Detailed ASCII renderer specs (lines 47-55), full React component list (lines 57-71), detailed tooltip spec (lines 73-78), Zustand store list (lines 80-86), application shell details (lines 88-93). All in `project_plans/07_ui_ux_and_art.md`.

Replace "Systems You Own" with:

```markdown
## Systems You Own

You own 5 UI systems. For detailed specs and wireframes, see `project_plans/07_ui_ux_and_art.md`:
- ASCII renderer (Canvas-based CP437 grid at 16x16, bitmap fonts, double-buffered, particle effects)
- React UI components (character sheet, inventory, combat log, talent tree, raid comp builder, quest tracker, crafting, achievements, auction house, settings)
- Tooltip system (hover on any game element: items, characters, abilities, zones — with box-drawing borders)
- Zustand state stores (reactive projections of engine state — never mutate game state directly)
- Application shell (Electron frameless window, Tailwind, resizable dockable MMO-style panels)
```

**Step 2: Verify**

Count lines. Target: 55-70 lines (down from 127).

**Step 3: Commit**

```bash
git add .claude/agents/realm-ui.md
git commit -m "refactor: slim realm-ui agent prompt, move specs to design docs"
```

---

### Task 7: Slim realm-data.md

**Files:**
- Modify: `.claude/agents/realm-data.md`

**Step 1: Rewrite to behavioral-only prompt**

Remove: Full data file inventory — character data (lines 46-50), item data (lines 52-57), content data (lines 59-65), profession data (lines 67-69), economy data (lines 71-74), meta data (lines 76-82). Also remove balance systems detail (lines 98-114) and balance test harness detail (lines 118-125). All detailed in `project_plans/02-06, 08, 10`.

Replace "Data Files You Own" and "Balance Systems" with:

```markdown
## Data Files You Own

You own all JSON data files in `src/game/data/`. For detailed file specs, see the corresponding `project_plans/` docs:
- Character data (classes, talents, abilities, races, stats) → `02_character_and_combat.md`
- Item data (items, loot tables, item sets, gems, enchants) → `06_economy_and_professions.md`
- Content data (zones, mobs, dungeons, raids, quests, world bosses) → `03-05`
- Profession data (professions, recipes, transmutes) → `06_economy_and_professions.md`
- Economy data (vendors, auction house, gold sinks) → `06_economy_and_professions.md`
- Meta data (achievements, titles, mounts, legendaries, chase items) → `08_meta_systems.md`, `10_chase_items.md`

## Balance Systems

Stat budgets, gear progression tiers, XP curves, and gold economy rates are all specified in `game-design-plan-detailed.md`. You own the balance test harness that calls realm-combat's `simulateEncounter()` to verify data produces sane outcomes (see design doc for pass/fail thresholds).
```

**Step 2: Verify**

Count lines. Target: 60-75 lines (down from 161).

**Step 3: Commit**

```bash
git add .claude/agents/realm-data.md
git commit -m "refactor: slim realm-data agent prompt, move file inventory to design docs"
```

---

### Task 8: Deduplicate MEMORY.md

**Files:**
- Modify: `/home/ben/.claude/projects/-mnt-c-Users-Caus-Desktop-LegendsOfTheRealm/memory/MEMORY.md`

**Step 1: Rewrite to non-duplicated content only**

Keep:
- Status section (what happened last, session state)
- User preferences
- Custom subagent summary (brief — names + one-line descriptions only)

Remove (already in CLAUDE.md):
- Project Overview (duplicated)
- Key Design Decisions (now in CLAUDE.md)
- Project Structure / File Map (duplicated)
- Ownership boundaries detail (now in CLAUDE.md ownership map)

Add:
- Note that CLAUDE.md is the source of truth for project context

**Step 2: Verify**

Read MEMORY.md and confirm it's under 40 lines with no content duplicated from CLAUDE.md.

**Step 3: Commit**

MEMORY.md is not in git (it's in the private memory directory), so no commit needed.

---

### Task 9: Final verification and commit

**Step 1: Read all modified files and verify**

- CLAUDE.md: Has design decisions, self-healing workflow (steps 0-5), ownership map, shared-type protocol, no stale refs
- All 4 agents: 60-75 lines each, behavioral content only, reference design docs for details
- MEMORY.md: Lean, no CLAUDE.md duplication

**Step 2: Run tests to make sure nothing is broken**

```bash
npx vitest run
```

Expected: All 68 tests pass (no source code changed, just config/docs).

**Step 3: Verify line counts**

```bash
wc -l .claude/agents/realm-*.md CLAUDE.md
```

Expected: Each agent 60-75 lines, CLAUDE.md ~110-120 lines.
