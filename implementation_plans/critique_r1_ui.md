# UI Expert Critique — Round 1

## Reviewer: UI Domain Expert (realm-ui)
## Date: 2026-02-15

---

## 1. SELF-CRITIQUE OF THE UI PLAN (draft_v1_ui.md)

### 1.1 Missing Panels and Screens

**Character Creation Screen -- COMPLETELY ABSENT.** The UI plan lists `CharacterList.tsx` with a "Create New" button but never defines a `CharacterCreation.tsx` component. Character creation in an 8-class, 6-race MMORPG is not a button click -- it is a multi-step screen with race selection, class selection, name entry, appearance preview (even in ASCII, the `@` character representation and color), and a confirmation step. The design doc (`00_overview_and_decisions.md`, line 101) explicitly describes "Visual Power Progression: Level 1: `@` in grey" -- the creation screen must establish this. This is the player's first meaningful interaction and it has no plan.

**Main Menu / Title Screen -- ABSENT.** Where does the player land on first launch? The plan jumps straight to `AppShell.tsx` with panels. There is no title screen, no "New Game / Continue / Load Game" flow. The design doc mentions "Main Menu" music (line 236 of `07_ui_ux_and_art.md`). Who renders the main menu?

**Save/Load Management Screen -- UNDERSPECIFIED.** Listed as a bullet inside `SettingsPanel.tsx` (line 104: "save management (load/save/delete slots)"). Save management is not a settings sub-panel -- it is a critical flow. The design doc supports unlimited save slots (line 98 of `01_core_engine_architecture.md`). The UI needs: save slot browser with metadata (character count, playtime, last played), new save creation, save slot deletion with confirmation dialog, import/export save files. Buried in Settings is wrong.

**Transmog Panel -- MISSING.** The design doc (`08_meta_systems.md`, line 44-45) describes a full transmog collection system: "Every gear appearance collectible. Set bonuses for full transmog sets." The character sheet mentions "[Transmog]" button (line 106, `07_ui_ux_and_art.md`) but no `TransmogPanel.tsx` exists in the module breakdown. This is a significant endgame feature with no UI representation.

**Mount Collection Panel -- MISSING.** Mounts are referenced as achievement rewards and boss drops throughout the design docs. The character sheet mockup shows "[Titles]" but no mount management UI. Players need a panel to select their active mount (affects travel time), view collected mounts, and see acquisition sources.

**Equipment Manager -- MISSING.** The character sheet mockup (`07_ui_ux_and_art.md`, line 106) shows "[Equip Manager]" button. No corresponding component exists. An equipment manager lets players save/swap gear sets (one for tanking, one for DPS). With 15 gear slots and frequent respecs, this is not optional.

**NPC Guild Chat -- MISSING.** Section 1.2.4 of `00_overview_and_decisions.md` (line 126) specifies "Simulated guild members (your alts + NPCs) have personalities and comment on your progress." This is a social simulation panel that does not appear anywhere in any plan.

### 1.2 Canvas Rendering Concerns

**Font loading on different platforms is acknowledged but inadequately mitigated.** The plan says "Platform-specific image loading behavior in Electron makes this a risk point" (line 779) but provides no concrete fallback strategy. What happens if the bitmap font PNG fails to load? The plan mentions "missing font fallback" in Phase 8 error states, but by that point the entire renderer is built on the assumption it works. The fallback should be defined in Phase 0: use Canvas `fillText` with a system monospace font as a degraded-mode renderer.

**The pre-tinted glyph cache math is wrong.** Line 613 states: "The cache is bounded by 256 chars * 32 colors = 8,192 entries, each 16x16 RGBA = 1 KB, total ~8 MB." Each 16x16 RGBA pixel buffer is `16 * 16 * 4 = 1,024 bytes = 1 KB`. 8,192 entries * 1 KB = 8 MB. That is correct IF every combination is used. But the plan proposes 32 colors (not just 16), and does not account for background color affecting the tinting. The cache entry should be `(glyph, fg, bg)` which is `256 * 32 * 32 = 262,144 entries = 256 MB`. That blows the 300 MB memory budget on cache alone. The plan needs to cache only `(glyph, fg)` pairs and clear the background separately, or use a more conservative cache eviction strategy (LRU with a 4096-entry cap).

**Double-buffer swap is mentioned (line 240, step 6) but not justified.** The plan says "if using offscreen buffer approach" which is a conditional that should be resolved in the plan, not at implementation time. For dirty-cell rendering, double buffering adds complexity without benefit because we are only redrawing dirty cells, not the full frame. The plan should commit to direct rendering on the visible canvas with dirty-cell optimization, or commit to a full offscreen-to-visible blit. Waffling here will waste implementation time.

**Particle restoration is problematic.** Line 239 says "Remove expired particles, restore previous cell content." This requires saving the "underlying" cell content before a particle overwrites it. If multiple particles overlap the same cell across frames, the restoration stack gets complicated. The plan does not describe this data structure. A simpler approach: maintain a separate "base layer" grid (the map) and a "particle layer" grid, compositing them each frame. The plan lacks this layering concept.

### 1.3 First-Time User Experience

**No tutorial or onboarding flow.** A player launching the game for the first time sees... what? A blank panel layout? The design doc mentions three play patterns (Check-In, Session, Deep Dive) but no plan for teaching the player any of them. At minimum, a first-time flow should: (1) show character creation, (2) highlight the zone map, (3) explain the activity system (how to start grinding), (4) explain idle progression. Without this, the player sees an overwhelming MMO UI with no characters and no context.

**No contextual help system.** 600+ achievements, 24 talent specs, 12 professions, 6 dungeons, 4 raid tiers. Where does a player learn what any of this is? The tooltip system is excellent for hover details, but there is no "What should I do next?" guidance. A simple "Suggested Next Step" panel or breadcrumb system would prevent new-player paralysis.

### 1.4 State Update Frequency Inconsistency

The plan says state updates are "throttled to ~10/second" (line 326) but also says they are "batched per engine tick (1/second)" (line 635). These are contradictory. The engine ticks at 1 Hz. If the UI receives state updates at 10 Hz, where are the extra 9 updates coming from? The answer is probably that the engine sends one delta per tick (1 Hz) and the UI interpolates, but the plan does not make this clear. During combat, the plan mentions increasing IPC frequency to 4 Hz for combat log entries (referenced from the engine appendix). The UI plan needs to clearly specify: 1 Hz base state updates, with a separate 4 Hz combat log event stream during active encounters.

---

## 2. CRITIQUE OF THE ENGINE PLAN (draft_v1_engine.md)

### 2.1 State Delta Format -- Underspecified for UI Consumption

The `GameStateDelta` interface (line 649-658) uses `Map<number, Partial<CharacterState>>` for character updates. **Maps do not serialize over Electron IPC.** Electron's IPC uses `structuredClone` which handles Maps, but the plan elsewhere mentions "serialized JSON crossing IPC" (line 944). These are contradictory. If using `structuredClone`, Maps work. If using JSON serialization (which is the common pattern for Electron IPC with `contextBridge`), Maps become `{}` and are lost. The plan must commit to one approach and the UI must know which.

**The delta does not include enough context for optimistic UI updates.** When the player clicks "Equip Item", the UI must visually update immediately (move the item to the paper doll) while waiting for engine confirmation. The engine plan has no concept of optimistic updates or rollback. If the equip fails (e.g., class restriction), the UI has already shown the wrong state. The engine needs to either: (a) respond synchronously to equip commands (Promise-based IPC), or (b) provide a validation API the UI can call before dispatching the action. The IPC API (line 489) does use `Promise<EquipResult>` for `equipItem`, which addresses this, but the delta-based state update flow (line 509-513) is separate and does not account for this. The two systems (request/response and push deltas) need a clear reconciliation strategy.

**Missing state the UI needs:**

1. **Character creation validation** -- The engine plan has `character.create(params)` (line 489) but no `character.validateName(name)` API. The UI needs to check name availability (unique names per save) before showing a success state.

2. **Activity time estimates** -- When a character is grinding, the UI wants to show "Next level in approximately 2h 14m." The engine state does not include XP rate or time-to-level estimates. The UI should not have to recalculate this from raw XP/level/zone data.

3. **Dungeon/raid eligibility checks** -- Before entering content, the UI needs to know: "Can this character enter Irondeep Forge?" (level requirement met? lockout clear? gear check?) The engine has `dungeon.start()` but no `dungeon.canStart()` query API.

4. **Inventory full state** -- The UI needs to know when bags are full to display a warning. The engine delta does not include a `bagSpaceRemaining` field. The UI would have to count all items in inventory to determine this, which is duplicated logic.

### 2.2 IPC Ergonomics for React

The `onStateUpdate(callback)` pattern (line 511) returns an unsubscribe function. This maps cleanly to `useEffect` cleanup, which is good. But the engine exposes three separate subscription channels (`onStateUpdate`, `onWelcomeBack`, `onAchievement`). In practice, the UI will also need:

- `onCombatLogEntry` -- for streaming combat events
- `onNotification` -- for toast-style notifications (level up, rare drop, quest complete)
- `onError` -- for engine-side errors that the UI must display

The plan bundles notifications into the delta (`notifications?: GameNotification[]` on line 657), but notifications should be a separate push channel because they need special UI treatment (toast popups, sound triggers). Mixing them into the general state delta means the UI has to check every delta for notifications, which is wasteful and makes the notification display logic harder to isolate.

### 2.3 WelcomeBackSummary Contains Map

The `WelcomeBackSummary` (line 695) uses `restedXPAccumulated: Map<number, number>`. Same serialization issue as above. Additionally, the `expiredLockouts` and `cooldownsReady` fields are `string[]` with human-readable messages like "Molten Sanctum weekly lockout expired." The UI should NOT receive pre-formatted strings -- it should receive structured data (`{ type: 'lockout_expired', contentId: 'molten_sanctum', contentType: 'raid' }`) and format them itself. Pre-formatted strings cannot be localized, cannot be styled differently by the UI, and cannot be used for navigation (clicking "Molten Sanctum" to jump to that content).

---

## 3. CRITIQUE OF THE COMBAT PLAN (draft_v1_combat.md)

### 3.1 Combat Log Format -- Can the UI Actually Render It?

The combat plan outputs `CombatEvent[]` in `EncounterResult.events` (line 435) and `CombatLogEntry[]` in the engine's `EncounterResult.combatLog` (line 615 of engine plan). **Neither plan defines the shape of a CombatEvent or CombatLogEntry.** This is the most critical cross-domain gap.

The UI combat log needs per-event:
- Timestamp (tick number)
- Source entity (name, id, isPlayer)
- Target entity (name, id, isPlayer)
- Event type (damage, heal, buff_apply, buff_expire, dodge, parry, miss, block, crit, death, phase_change, ability_cast, interrupt, dispel)
- Ability name
- Amount (damage done, healing done, absorbed amount)
- Was it a crit?
- Was it resisted/partial?
- Overkill/overheal amount
- Resulting HP of target

Without a defined schema for combat log entries, the UI cannot build the combat log panel. The combat plan should define this interface explicitly. The closest we get is `EntityPerformance` (lines 441-452 of combat plan) which is an aggregate, not per-event data.

### 3.2 DPS/HPS/TPS Display Format

The `EntityPerformance` interface (line 441) provides `dps`, `hps`, and `tps` as raw numbers. These are post-encounter summary values. The UI also needs **real-time rolling DPS/HPS during encounters** -- not just final averages. For a live encounter HUD, the UI needs either:

1. Per-tick damage/healing values so it can compute rolling 5-second and fight-total DPS/HPS itself, or
2. The combat system to emit rolling averages in its tick results.

Neither is specified. The UI plan (Phase 4, line 75) promises "party health/mana bars" and by implication DPS meters, but the combat plan provides no mechanism for streaming per-tick performance data during an active encounter.

### 3.3 Party Analysis Output Shape

The `PartyValidation` interface (line 514 of combat plan) is defined and usable. However, `estimateCharacterDPS()` (line 527) returns a single `number`. The UI needs more context:

- What is the DPS breakdown by ability? (For a character sheet "Estimated DPS" tooltip that shows which abilities contribute what)
- What is the theoretical max DPS? (To show a "performance rating" percentage)
- What are the stat weights? (To show "your best upgrade path" hints)

A single DPS number is useful for the raid composition builder but insufficient for the character sheet's theorycraft display. The design doc (`08_meta_systems.md`, line 47-48) specifically calls out "Combat Log Analysis (Theorycrafting): Detailed DPS/healing/threat breakdowns. Optimization puzzles." This requires much richer output from the party analysis module.

### 3.4 Boss Mechanic Descriptions for UI

Boss encounter data includes `strategyText` (defined in data plan, dungeon schema line 883) which is a freeform string. The UI's DungeonPanel needs to display boss mechanics in a structured way -- not just a paragraph of text. For each boss mechanic, the UI wants: mechanic name, mechanic icon, short description, whether it is interruptible/dispellable, and recommended response. The combat plan defines `BossAbility` objects but the data flows through the engine, and it is unclear whether the UI receives raw `BossAbility[]` data or just the `strategyText` summary. The UI should receive both.

---

## 4. CRITIQUE OF THE DATA PLAN (draft_v1_data.md)

### 4.1 Item Definitions for Rich Tooltips

The `ItemDefinition` schema (lines 510-584) is thorough. It includes `sources: ItemSource[]` which provides "where does this drop" information for tooltips -- this is excellent. However, several tooltip-relevant fields are missing:

**Required item level vs character level display.** The schema has `requiredLevel` but no `requiredClass`, `requiredSpec`, or `requiredReputation`. The design doc implies class restrictions exist (tier sets are class-specific), and the UI tooltip needs to show "Classes: Warrior, Cleric" in red if the viewing character cannot equip it. The `ItemSetDefinition` (line 603) has `className?: ClassName` but individual items do not have class restrictions. If an item is a Warrior tier piece, how does the UI know to gray out the Equip button for a Mage?

**Obtained-from display completeness.** `ItemSource` (lines 586-592) has `dropRate?: number` which is excellent for tooltips. But the `context?: string` field is a human-readable string ("Bjornskar the Frost King"). Like the engine's lockout messages, this should be structured: `{ bossName: string, dungeonName: string, bossId: BossId }` so the UI can render it as a clickable link to the dungeon panel.

**Item comparison metadata.** The UI tooltip shows stat comparison (green/red deltas vs equipped). To do this correctly, the UI needs to know which stats on the item are "primary" (shown in the main tooltip body) vs "secondary" (shown below), and whether stats are percentages or flat values. The schema has `Partial<Record<StatName | SecondaryStat, number>>` which conflates primary and secondary stats into one bag. The UI has no way to distinguish "Stamina" (primary, shown first) from "Crit Rating" (secondary, shown below) without hardcoding the display order, which violates the data-driven principle.

### 4.2 Talent Tree Layout Data

The `TalentNode` schema (line 461-476) defines `tier: number` and `position: number` which are effectively row and column in the tree. This is sufficient for UI rendering. However:

**The `position` field semantics are ambiguous.** Is it 0-indexed or 1-indexed? How many columns per tier? The schema does not specify the grid dimensions of a talent tree. The UI needs to know: "This tree is 4 columns wide and 6 rows tall" to allocate layout space. The `TalentTree` (line 488-503) has no `gridWidth` or `gridHeight` field.

**Prerequisite line routing is unspecified.** The talent tree UI needs to draw lines connecting prerequisite nodes. The data provides `prerequisites: TalentNodeId[]` (line 465) which defines the DAG, but not the visual routing of lines. If a prerequisite is in tier 1 column 1 and the dependent node is in tier 3 column 3, the line must route through intermediate space. The UI will need to implement its own line-routing algorithm. This is fine, but it should be acknowledged as UI complexity.

**Icon data for talent nodes is missing.** The `TalentNode` schema has no `icon` field. The `AbilityDefinition` (line 405-406) has `icon: { char: string; fg: number; bg: number }` but talent nodes are not the same as abilities -- many talent nodes are passive effects that modify stats, not abilities. The UI needs a visual indicator for each node (even if it is just a default circle/square with a color).

### 4.3 Zone Map Data for ASCII Rendering

The `ZoneDefinition` schema (line 680) has `asciiMapData?: string` which is optional. If present, this is the raw ASCII tilemap for the zone. But the format is not specified. Is it a multi-line string where each character maps to a cell? What delimiter separates rows? What is the grid size? Is there a legend mapping characters to terrain types? The UI plan (Phase 2, line 51) mentions "ASCII tilemap rendered on Canvas" but the data that feeds this is an optional freeform string. This is a major gap -- the zone map is one of the most visually prominent UI features and its data format is an afterthought.

### 4.4 Heirloom Data -- MISSING

The design doc (`01_core_engine_architecture.md`, line 218) references "heirloom_unlocks TEXT -- JSON array of unlocked heirlooms" in the `account_data` table. Heirlooms are account-wide items that provide XP bonuses to leveling alts. The data plan has no `heirlooms.json` schema and no `HeirloomDefinition` type. The XP system references heirlooms as an XP multiplier (`02_character_and_combat.md` via combat plan line 375: "Stacking multipliers: Rested(200%) * Human(105%) * Heirlooms(150%) * GuildHall(115%)"). The data for what heirlooms exist, their stat scaling, and their XP bonus values is undefined.

---

## 5. CROSS-CUTTING CONCERNS

### 5.1 Character Creation Screen -- Ownership Gap

The engine plan has `character.create(params: CharacterCreateParams)` (line 489). The data plan has `races.json` and `classes.json`. The UI plan has no `CharacterCreation.tsx`. Who defines `CharacterCreateParams`? The engine says it lives in `src/shared/types.ts` but no plan defines its shape. The UI needs: race selector (6 options with lore text and racial bonuses), class selector (8 options filtered by available races, with spec preview), name input with validation, and a preview showing the character's starting stats. This is a full panel worth of work that none of the plans account for. The UI plan Phase 1 mentions "Character list sidebar" and "Create New" button, but the creation flow itself has no deliverable.

### 5.2 Loading Screen Between Zones -- Ownership Gap

When a character moves from Greenhollow Vale to Thornwood Forest, what happens visually? The UI plan has `LoadingScreen.tsx` (line 174) listed as a deliverable in Phase 7 (Polish). But zone transitions happen as soon as the character advances in the quest chain, which is Phase 2 of the engine. For months of development, zone transitions will have no visual feedback. `LoadingScreen.tsx` should be a Phase 0 or Phase 1 deliverable -- it is a fundamental UX element, not polish.

### 5.3 Audio System -- Split Ownership

The UI plan claims ownership of audio (lines 212-218): `AudioManager.ts`, `MusicPlayer.ts`, `SFXPlayer.ts`. But audio triggers are driven by engine events (level up, boss kill, rare drop, quest complete). The engine plan has no concept of audio event emission. The `EventBus.ts` (line 211 of engine plan) fires events like `CHARACTER_LEVELED` and `ITEM_ACQUIRED`, but these events are in the main process. The audio system runs in the renderer process. The IPC bridge must relay these events, but the engine plan's IPC specification does not include audio event channels. The `GameStateDelta.notifications` field (line 657) is the closest mechanism, but notifications are not the same as audio triggers -- a "BOSS_KILLED" notification triggers both a toast AND a sound effect, and the sound must play immediately (not wait for the next 1Hz state update).

The design doc (`07_ui_ux_and_art.md`, lines 241-248) specifies terrain-specific footsteps, mining sounds, and fishing splashes -- these are per-tick world sounds. How does the UI know the character is currently mining? Through the activity state in the engine delta. But the activity state updates at 1 Hz, and mining sounds should loop continuously. The audio system needs to maintain its own state machine for ambient/activity sounds, derived from engine state but running independently.

### 5.4 Keybinding System -- Ownership Unclear

The UI plan defines hotkeys (Phase 8, line 127) and `useKeyboardShortcuts.ts` (line 207). The `settingsStore.ts` (line 197) mentions keybindings. But no plan defines:

- Default keybinding map (which key = which action)
- Keybinding conflict detection (two actions bound to the same key)
- Keybinding serialization format for persistence
- Keybinding reset to defaults

The UI plan's Phase 6 mentions "keybindings editor" in the Settings panel, but the underlying data model for keybindings is not defined anywhere. This is purely a UI concern, but it needs an explicit schema.

### 5.5 Data Loading in Renderer -- Process Boundary Problem

The UI plan (line 453) says static data files "are loaded once at app startup into an in-memory read-only cache on the renderer process." But data files live in `src/game/data/` which is the main process. The data plan's `loadGameData()` (line 1390) runs in the main process because it validates against Zod schemas and integrates with the engine. How does the renderer get this data?

Options: (1) Duplicate the data loading in the renderer. (2) Ship data files as renderer-accessible assets and load them independently. (3) Send the full `GameData` object over IPC at startup. Option 1 doubles validation code. Option 2 requires keeping two copies of data in memory. Option 3 could be large (estimated 2-5 MB of JSON).

None of the plans resolve this explicitly. The engine plan treats data as a main-process concern. The UI plan assumes it has direct access. The data plan does not discuss process boundaries. This will cause a real implementation deadlock.

---

## 6. UX GAPS -- Player-Facing Features Missing From ALL Plans

### 6.1 Settings Persistence

The UI plan mentions `settingsStore.ts` and localStorage for panel layout, but no plan defines a cross-session settings persistence format. Settings include: audio volumes (5 sliders), display options (font choice, extended palette toggle), keybindings (20+ mappings), panel layout (5 panel dimensions), and UI preferences (tooltip delay, combat log filter defaults). Where are these stored? localStorage (renderer process only, cleared on Electron cache clear)? A `settings.json` file? A SQLite table? The engine plan persists window position (Phase 1, deliverable 11; Phase 7, deliverable 5) but that is window-manager state, not game settings. No plan defines a durable settings file.

### 6.2 Undo for Talent Point Spending

The UI plan has "click to spend/unspend points" (line 61) and `SPEND_TALENT` / `REFUND_TALENT` actions (lines 388-389). But the design doc says "Free Respecs" (`00_overview_and_decisions.md`, line 202). The interaction model is unclear: can the player undo individual talent points? Or only full respec (refund all)? If only full respec, then `REFUND_TALENT` (single node) should not exist. If individual undo is supported, the engine needs to validate that removing a point does not break prerequisites for dependent nodes. Neither the engine plan nor the UI plan addresses this validation logic.

### 6.3 Confirmation Dialogs for Destructive Actions

No plan defines confirmation dialogs for:
- Deleting a character
- Deleting a save file
- Selling a rare/epic/legendary item
- Disenchanting an epic item
- Abandoning a quest with progress
- Resetting talent points (even if free, it is a meaningful action)
- Starting a raid (committing to a weekly lockout)

These are essential UX safety nets. The UI plan should define a `ConfirmDialog.tsx` component as a Phase 1 deliverable, not an afterthought.

### 6.4 Window Position Memory

The engine plan mentions window state persistence twice (Phase 1 deliverable 11, Phase 7 deliverable 5). The UI plan does not reference this at all. This is a trivial feature but it is unclear who owns it -- is the window position stored by the engine in SQLite or by the UI in localStorage? For an Electron app, this is typically handled by `electron-window-state` or a similar utility in the main process. Both plans claim it; neither details the implementation.

### 6.5 Error Feedback to the Player

What happens when:
- The player tries to equip an item they cannot use? (Wrong class, wrong level)
- The player tries to enter a dungeon while on lockout?
- The player tries to craft without sufficient materials?
- The player tries to buy an AH item with insufficient gold?
- A save file fails to load?

The engine plan returns typed error results (e.g., `EquipResult` from `equipItem`), but the UI plan has no error toast/banner system. No `ErrorToast.tsx` or `ErrorBanner.tsx` component exists. Errors will silently fail with no player feedback.

### 6.6 Notification/Toast System

Related to the above: the game generates many events that deserve transient notifications (toast popups): level up, achievement earned, rare item dropped, quest completed, dungeon lockout expired, companion quality upgraded. The UI plan describes `WelcomeBack.tsx` as a modal and `AchievementPanel.tsx` as a persistent panel, but there is no `Toast.tsx` or `NotificationFeed.tsx` for transient notifications. The design doc (`07_ui_ux_and_art.md`, line 245) specifies "Level up (grand fanfare 3s)" audio -- this implies a corresponding visual notification that does not exist in any plan.

### 6.7 Combat Speed Controls

The UI plan has no concept of combat speed controls. During active play, the player watches encounters tick at 1 tick/second. For dungeon runs with multiple trash packs and bosses, this could take 10-20 minutes of real time with no player interaction (it is an auto-battler). The player should be able to: (a) speed up combat (2x, 4x, 8x), (b) skip to the end of a trash pack, or (c) auto-resolve trivial encounters. None of these controls appear in any plan. The engine plan's tick loop runs at 1 Hz with no concept of fast-forward. This is a critical UX feature for an idle game.

### 6.8 Minimap or Zone Progress Indicator

The zone map is a full-panel view that occupies the entire main area. But when the player is on the character sheet or talent tree tab, they lose all sense of where their character is and what they are doing. A small minimap or status bar showing "Grinding in Thornwood Forest -- Level 37 -- 45% to 38" would maintain spatial awareness across all tabs. No plan includes this.

### 6.9 Bulk Operations

With 20+ characters at endgame, the player needs bulk operations:
- "Start all characters grinding" / "Park all characters at inn (rested XP)"
- "Collect all daily quest rewards"
- "Sell all grey items across all characters"

The IPC API is per-character (`setActivity(charId, activity)`). No batch operation API exists. Managing 20 characters one at a time through the `CharacterList` sidebar will be tedious. This is an idle game -- bulk management is not a luxury, it is a core feature.

---

## Summary of Severity

| Issue | Severity | Affected Plans |
|-------|----------|---------------|
| Character creation screen missing | CRITICAL | UI, Engine |
| Combat log entry schema undefined | CRITICAL | Combat, Engine, UI |
| Data loading process boundary unresolved | HIGH | Data, Engine, UI |
| Audio event bridging unspecified | HIGH | Engine, UI |
| Map data format undefined | HIGH | Data, UI |
| Combat speed controls missing | HIGH | Engine, UI |
| Confirmation dialogs absent | HIGH | UI |
| Notification toast system missing | HIGH | UI |
| Transmog/Mount/Equip Manager panels missing | MEDIUM | UI, Data |
| State delta Map serialization issue | MEDIUM | Engine, UI |
| Pre-formatted strings in WelcomeBackSummary | MEDIUM | Engine, UI |
| Talent node icon data missing | MEDIUM | Data, UI |
| Heirloom data undefined | MEDIUM | Data |
| Settings persistence format undefined | MEDIUM | UI, Engine |
| Keybinding data model undefined | MEDIUM | UI |
| Bulk character operations missing | MEDIUM | Engine, UI |
| First-time onboarding absent | MEDIUM | UI |
| Real-time DPS streaming unspecified | LOW-MEDIUM | Combat, UI |
| Canvas double-buffer indecision | LOW | UI |
| Cache sizing error for extended palette | LOW | UI |
