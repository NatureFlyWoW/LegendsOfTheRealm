# Claude Code Setup Fixes — Design Document

**Date:** 2026-02-16
**Scope:** Claude Code AI tooling layer only (agents, CLAUDE.md, workflows, memory)
**Approach:** Surgical fixes (Approach A + Flaw 5 resolution)

## Problem Summary

Self-audit of the Claude Code setup found 8 flaws:

1. **Stale design info in CLAUDE.md** — Still references Heroic/Mythic difficulty tiers and alt-based parties, both scrapped in Feb 2026 revision
2. **CGC workflow not self-healing** — No health-check; agents silently degrade to grep in fresh sessions
3. **Agent prompts too large** — 128-162 lines each; bulk is reference material that duplicates `project_plans/`
4. **MEMORY.md duplicates CLAUDE.md** — Will desync (already has)
5. **No ownership path map** — Agent directory boundaries are prose, not structured
6. **No shared-type change protocol** — No coordination when `src/shared/` types change
7. **"Verify upstream" is vague** — Says "use find_callers" but that doesn't actually verify correctness
8. **No test step in workflow** — Agents have verification skill but workflow doesn't trigger it

## Fixes

### Fix 1: Update stale CLAUDE.md game design info

**Change:** Update Game Systems list items 4 and 6:
- Item 4: `Content — Zones, dungeons (one difficulty), raids (10/20-char with NPC companions)`
- Item 6: `Companion System — NPC party members, quality tiers (Recruit→Champion), roster per character`

**Add** Key Design Decisions section after Project Overview with Feb 2026 revision notes.

### Fix 2: Add CGC health-check (self-healing workflow)

**Add** Step 0 to CGC-First workflow in CLAUDE.md:

> **0. Verify CGC is indexed** — Run `get_repository_stats` for this repo. If it returns 0 files, run `add_code_to_graph` and wait for completion before proceeding. If CGC errors entirely, fall back to Grep/Glob for the session.

### Fix 3: Slim agent prompts

**Keep** in each agent (behavioral — guides decisions):
- Identity/role statement
- CGC-First workflow steps (reference CLAUDE.md)
- Project context brief (~6 lines)
- Development checklist
- Ownership boundaries
- Integration with other agents
- Testing responsibilities

**Remove** from each agent (reference — available in design docs):
- realm-engine: Detailed breakdowns of game loop, idle/offline, save/load, state machines, loot rolls, Electron, RNG (~50 lines) → `project_plans/01_core_engine_architecture.md`
- realm-combat: Detailed formula breakdowns for damage, healing, threat, stats, attack table, rotations, encounters (~50 lines) → `project_plans/02_character_and_combat.md`
- realm-data: Full data file inventory of 30+ JSON files (~40 lines) → `project_plans/06_economy_and_professions.md` and related docs
- realm-ui: Detailed UI component lists, tooltip specs, store lists (~40 lines) → `project_plans/07_ui_ux_and_art.md`

**Target:** Each agent 60-70 lines (down from 128-162).

### Fix 4: Deduplicate MEMORY.md

**Keep:** User preferences, session status, things that change between sessions.
**Remove:** Project overview, design decisions, file maps — all duplicated in CLAUDE.md.
**Add:** Note that CLAUDE.md is the source of truth for project context.

### Fix 5: Add ownership path map to CLAUDE.md

**Add** structured directory→agent mapping:

```
src/game/engine/         → realm-engine
src/game/state-machines/ → realm-engine
src/game/rng/            → realm-engine
src/game/systems/        → realm-engine
src/game/combat/         → realm-combat
src/game/data/           → realm-data
src/renderer/            → realm-ui
src/main/                → realm-engine
src/shared/              → shared (coordinate across agents)
tests/                   → mirrors src/ ownership
```

### Fix 6: Add shared-type change protocol

**Add** to CLAUDE.md:

When modifying types in `src/shared/`, use CGC `find_callers` and `find_importers` to identify all consuming files. If changes affect another agent's domain, flag in the commit message with `[shared-type-change]` so the orchestrator verifies cross-domain compatibility.

### Fix 7: Fix "verify upstream" wording

**Change** step 4 from "use find_callers to verify nothing upstream broke" to:

> After changes, use `find_callers` to identify affected call sites, then run tests to verify nothing broke.

### Fix 8: Add test verification step

**Add** Step 5 to CGC-First workflow:

> **5. Verify** — Run `vitest run` after implementation. Do not report completion until tests pass.

## Implementation Order

1. CLAUDE.md — all content fixes (Fixes 1, 2, 5, 6, 7, 8)
2. Agent prompts — slim all 4 (Fix 3)
3. MEMORY.md — deduplicate (Fix 4)

## Success Criteria

- CLAUDE.md reflects Feb 2026 design decisions accurately
- CGC workflow is self-healing (agents auto-index if needed)
- Agent prompts are 60-70 lines each (down from 128-162)
- No duplicated content between MEMORY.md and CLAUDE.md
- Ownership boundaries are a structured path map, not just prose
- Shared-type change protocol documented
- Test verification is an explicit workflow step
