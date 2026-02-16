# UI Implementation Plan -- Draft v1

# Legends of the Shattered Realm -- UI Layer Implementation Plan

## Preamble: Scope of This Document

This plan covers the entire visual layer of the game: the Canvas-based ASCII renderer, every React component and panel, the Zustand state management layer, the tooltip system, the audio integration, and the Electron application shell. The game uses a **dual rendering system** -- Canvas for the game world view, HTML/Tailwind for the application frame -- and every decision below reflects that split. The engine (`src/game/`) is the single source of truth. The UI never mutates game state; it subscribes, projects, and dispatches actions.

---

## 1. Implementation Phases

### Phase 0: Foundation (Estimated: 2-3 weeks) -- Complexity: L

**Milestone:** A blank Electron window renders a single Canvas element showing a grid of CP437 characters with 16-color ANSI, a working Zustand store, and Tailwind shell chrome. The bitmap font loads and renders cleanly on all three platforms.

**Rationale:** Every subsequent phase depends on two things existing and working: the ASCII renderer pipeline and the Zustand-to-engine subscription bridge. Building these first removes all ambiguity about feasibility. Canvas bitmap font rendering on Electron is the single highest technical risk in the project -- it must be proven before committing to the rest of the plan.

**Deliverables:**
- Electron main process with frameless window, context isolation, typed IPC bridge
- Bitmap font loader for Px437 IBM VGA8 and Terminus (16x16 cells, loaded from `/src/assets/fonts/`)
- Core `AsciiRenderer` class: Canvas context management, character grid allocation, foreground/background color per cell, double-buffer swap
- CP437 character set mapping (256 codepoints) and Unicode box-drawing supplement (U+2500-U+257F)
- 16-color ANSI palette definition (both normal and bright variants = 16 foreground + 16 background)
- `useEngineSubscription` hook -- generic Zustand bridge that subscribes to engine state via IPC
- Tailwind configuration with the game's dark MMO theme (dark background, panel borders, text styles)
- Basic `AppShell` component: title bar with window controls, menu bar placeholder, content area

### Phase 1: Core Panels and Character View (Estimated: 3-4 weeks) -- Complexity: XL

**Milestone:** Player can see the character list sidebar, select a character, view a fully rendered character sheet with paper doll and stats, open the inventory panel, and see item tooltips on hover with quality-colored names.

**Rationale:** The character sheet and inventory are the two most information-dense panels in the game. They exercise every part of the rendering pipeline: ASCII art for the paper doll, box-drawing for borders, quality color coding, complex tooltips, and deep stat computation display. If these panels work, everything else is simpler.

**Deliverables:**
- Character list sidebar component (left panel from the layout spec)
- Character sheet panel: paper doll (15 gear slot positions rendered in ASCII), stat block (all 8 primary + secondary stats), talent summary, profession levels
- Inventory panel: 4 bag grids (16-24 slots each), drag-and-drop equip, item icons as colored ASCII characters, sort/sell/disenchant buttons
- Item tooltip component: quality-colored header (Grey/Green/Blue/Purple/Orange), iLvl, stats, equip effects, flavor text, box-drawing border, stat comparison vs equipped
- Stat tooltip: formula breakdown (e.g., "Armor: 9,850 = 4,200 gear + 5,650 talents/buffs")
- Panel layout system: resizable panels via drag handles, panel state persistence to localStorage

### Phase 2: Combat Log and Zone View (Estimated: 2-3 weeks) -- Complexity: L

**Milestone:** Combat log scrolls with timestamped, color-coded damage/healing/threat events. Zone map renders in the main view with ASCII symbols, clickable locations, and quest objective markers.

**Rationale:** The combat log validates that the UI can display streaming data from the engine at tick-rate speed (1/second, but potentially many events per tick). The zone map validates viewport scrolling in the ASCII renderer.

**Deliverables:**
- Combat log panel: virtualized scrolling list, timestamp column, event type coloring (white=hit, red=damage taken, green=heal, yellow=crit, grey=miss/dodge/parry), filters (All/Damage/Healing/Buffs), scope (Self/Party/Enemies), export to `.txt`
- Zone map renderer: ASCII tilemap rendered on Canvas, symbol legend (see `07_ui_ux_and_art.md` symbols), viewport scrolling and panning, character position marker `@`, quest objective pulsing animation (color cycle on `*` markers), dungeon entrance markers, click-to-path interaction
- Zone tooltip: level range, theme description, available quests/dungeons count
- Quick actions sidebar (bottom-left panel from layout): Start Grinding, Queue Dungeon, Open Professions, Auction House, Talent Tree buttons

### Phase 3: Talent Tree and Quest Tracker (Estimated: 2-3 weeks) -- Complexity: L

**Milestone:** Full talent tree visualization for all 24 specs. Working quest tracker with progress bars and objective states.

**Rationale:** The talent tree is the most complex visual element that is NOT rendered on Canvas -- it is a React component using HTML/CSS. This exercises the HTML side of the dual rendering system. The quest tracker validates the engine subscription pattern for streaming objective progress.

**Deliverables:**
- Talent tree panel: 6-tier tree layout, node icons (filled/unfilled/locked), point allocation display (e.g., "60/0/0"), click to spend/unspend points, prerequisite lines between nodes, three-tree tab switcher per class, respec button
- Ability tooltip: name, resource cost (mana/rage/energy), cooldown, cast time, damage/healing formula with YOUR character's actual numbers filled in, related talent interactions, rank
- Quest tracker panel (bottom-right from layout): active quests list, per-quest objectives with progress bars, turn-in and abandon buttons, quest text expansion on click
- Quest tooltip: full quest text, objectives, rewards (XP, gold, items with quality colors)

### Phase 4: Dungeon/Raid Interface and Companion System (Estimated: 2-3 weeks) -- Complexity: M

**Milestone:** Player can enter a dungeon, see their party composition (self + companions), watch encounter progress, see boss health bars, and view the companion quality progression screen.

**Rationale:** Dungeons and raids are the core endgame loop. The UI must present encounter state clearly: boss HP, phase indicators, party health bars, and the companion quality system that shows progression.

**Deliverables:**
- Dungeon/raid entry panel: content selection, party composition preview (your spec detected role + companion roles), gear check indicator (average iLvl vs requirement)
- Encounter HUD: boss name and HP bar, phase indicator, enrage timer, add count, party health/mana bars (5 for dungeon, 10/20 for raids), active buffs/debuffs icons
- Companion quality screen: per-dungeon/raid progress bars (Recruit -> Veteran -> Elite -> Champion), clear count tracking, quality bonus display
- Loot window: post-encounter loot display with item tooltips, assign/disenchant/vendor buttons
- Raid composition builder: visual slot grid (2T/3H/5D for 10-man, 4T/6H/10D for 20-man), buff coverage checklist, role validation warnings

### Phase 5: Professions, Auction House, and Economy (Estimated: 2-3 weeks) -- Complexity: M

**Milestone:** Player can browse recipes, queue crafts, view gathering node requirements, browse the simulated auction house, and manage gold transactions.

**Rationale:** Professions and the economy are the primary gold-generation systems. The crafting UI must handle recipe filtering, material checking, and queue management. The AH must simulate a living economy.

**Deliverables:**
- Profession panel: skill level display (e.g., "Mining: 247/300"), recipe list with filter/search, material requirements with have/need counts, craft button with queue, specialization display
- Crafting queue: items in progress, time estimates, cancel button
- Gathering panel: node types available by zone and skill level, idle-gather assignment
- Auction house browser: search by name/type/quality/level, price display (bid/buyout), buy/sell interface, listing fee preview, price history (simple chart)
- Gold display in top bar: formatted with g/s/c denominations (e.g., "1,234g 56s 78c")

### Phase 6: Meta Systems -- Guild Hall, Achievements, Welcome Back (Estimated: 2-3 weeks) -- Complexity: M

**Milestone:** Guild hall upgrade interface, achievement panel with 8 categories and progress tracking, and the "Welcome Back" offline progress summary screen all functional.

**Rationale:** These systems drive long-term engagement. The achievement panel is read-heavy (600+ entries). The Welcome Back screen is the first thing the player sees after idle time and sets the emotional tone.

**Deliverables:**
- Guild hall panel: current level, upgrade tree visualization, next upgrade cost and effect, timer display, material deposit
- Achievement panel: 8 category tabs, achievement list with icons/descriptions/rewards/progress bars, meta-achievement tracking, feat of strength section, title selector
- Title selector: dropdown in character sheet, active title display under character name
- Welcome Back screen: modal overlay, offline duration, per-character activity summaries (kills, XP gained, gold earned, items found, quests progressed, profession skill-ups), item quality highlights, "Continue" button
- Settings panel: audio volumes (Master/Music/SFX/Ambient/UI), display options, keybindings editor, save management (load/save/delete slots)

### Phase 7: Particle Effects, Animation, and Polish (Estimated: 2-3 weeks) -- Complexity: M

**Milestone:** Visual effects for combat, level-ups, legendary drops. Color cycling fire animation. Polished transitions and loading screens.

**Rationale:** Polish phase. The ASCII aesthetic depends on subtle animation to feel alive -- color cycling, particle trails, screen shakes. This is also where audio integration happens (Howler.js).

**Deliverables:**
- Particle effects system: character-based particles (`*.+~` etc.) with velocity, lifetime, color cycling
- Fire effect: `@&%$` characters cycling orange/red/yellow on Canvas
- Magic effect: `*.^~` characters with blue/purple/white cycling
- Level-up effect: flash of gold, ascending `*` particles
- Legendary drop effect: orange glow pulse, fanfare trigger
- Visual power progression: character `@` color changes by gear tier (grey -> green -> blue -> purple -> orange), aura `*` around raid-geared characters
- Loading screens: ASCII art logo, progress bar with flavor text
- Audio integration: Howler.js wrapper, zone music crossfade, SFX triggers on combat events, loot quality sounds, volume controls binding

### Phase 8: Accessibility, Responsive Layout, and Edge Cases (Estimated: 1-2 weeks) -- Complexity: S

**Milestone:** Keyboard navigation for all panels. Window resize reflowing panel layout. Screen reader announcements for key events.

**Deliverables:**
- Keyboard navigation: Tab/Shift-Tab through panels, arrow keys within grids, Enter to activate, Escape to close, hotkey support (C=character, I=inventory, M=map, L=combat log)
- Window resize handling: Canvas re-dimensions to fill allocated space, panel minimum sizes enforced, overflow scrolling for cramped panels
- Screen reader: ARIA labels on interactive elements, live region for combat log, role announcements for panel changes
- Error states: save corruption warning dialog, missing font fallback, database connection failure recovery

---

## 2. Module Breakdown

All paths below are relative to `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/`.

### `src/renderer/ascii/` -- ASCII Rendering Engine

| File | Responsibility |
|------|---------------|
| `Renderer.ts` | Core Canvas rendering loop. Manages the 2D context, double buffer, viewport, dirty cell tracking, and the `render()` call at 60 FPS via `requestAnimationFrame`. |
| `CharacterGrid.ts` | Data structure for the character grid. Each cell: `{ char: number, fg: ANSIColor, bg: ANSIColor, dirty: boolean }`. Provides `setCell()`, `fill()`, `drawBox()`, `drawText()` methods. |
| `FontLoader.ts` | Loads bitmap font images (Px437/Terminus), extracts individual character glyphs into an `ImageBitmap[]` array indexed by CP437 codepoint. Handles font variants. |
| `Palette.ts` | Defines the 16-color ANSI palette (8 normal + 8 bright). Maps `ANSIColor` enum to `[r, g, b]` tuples. Provides foreground tinting of font glyphs via Canvas compositing. |
| `Tileset.ts` | Mapping layer between game concepts and visual representation. `getCharForMob(mobType)` -> CP437 char + color. `getCharForTerrain(terrainType)` -> char + fg + bg. `getCharForItem(quality)` -> char + quality color. |
| `Effects.ts` | Particle effect system. Manages a pool of particles `{ x, y, char, fg, lifetime, velocity }`. Supports color cycling, gravity, wind. Used for fire, magic, combat hit indicators. |
| `BoxDrawing.ts` | Utility for drawing box-drawing character borders. `drawBorder(grid, x, y, w, h, style)` using Unicode U+2500-U+257F. Supports single, double, and mixed line styles. |
| `Viewport.ts` | Camera/viewport for scrollable ASCII maps. Tracks offset, provides world-to-screen coordinate conversion, handles smooth scrolling. |

### `src/renderer/components/` -- React Components

| File | Responsibility |
|------|---------------|
| `AppShell.tsx` | Root layout. Electron frameless window frame, title bar with min/max/close buttons, menu bar, and the flexible panel layout container. |
| `PanelLayout.tsx` | Resizable panel grid manager. Tracks panel positions, sizes, and docking. Renders drag handles between panels. Persists layout to localStorage. |
| `CharacterList.tsx` | Left sidebar. List of all characters with level, class icon (ASCII char), spec, current activity indicator. "Create New" and "Switch Character" buttons. |
| `CharacterSheet.tsx` | Main panel. Paper doll (15 gear slots positioned around `@` character), stat block, talent summary, profession summary, titles, mounts. Hotkey: C. |
| `PaperDoll.tsx` | Sub-component of CharacterSheet. Renders gear slots in the classic equipment layout (head, shoulders, chest, etc.) with equipped item glyphs and quality colors. |
| `InventoryPanel.tsx` | Bag grid display. 4 bags with slot grids. Item icons as colored characters. Drag-and-drop to equip. Sort, Sell Junk, Disenchant, Deposit Reagents buttons. Hotkey: I. |
| `CombatLog.tsx` | Right sidebar. Virtualized list of combat events. Filters, scope selectors, export button. Auto-scroll with pause on user scroll-up. |
| `ZoneMap.tsx` | Main view tab. Wraps an `<canvas>` element and the `Renderer` + `Viewport` for the zone tilemap. Overlays quest markers, dungeon entrances, NPC locations. |
| `TalentTree.tsx` | Main view tab. Three-tree tabbed view. Node graph with tier layout, connecting lines, point allocation controls. Displays spec name and point distribution. |
| `QuestTracker.tsx` | Bottom-right panel. Active quest list with collapsible objectives, progress bars, turn-in/abandon buttons. |
| `DungeonPanel.tsx` | Dungeon/raid entry and encounter HUD. Party composition preview, boss health bar, phase indicator, enrage timer. |
| `CompanionProgress.tsx` | Companion quality screen. Per-content progress bars with tier labels and clear counts. |
| `RaidCompBuilder.tsx` | Raid composition interface. Role slot grid, buff coverage analysis, gear check warnings. |
| `ProfessionPanel.tsx` | Profession skill display, recipe browser with search/filter, crafting queue. |
| `AuctionHouse.tsx` | Simulated AH browser. Search, filter, price display, buy/sell interface. |
| `GuildHall.tsx` | Guild hall upgrade tree, current bonuses, next upgrade preview, timer. |
| `AchievementPanel.tsx` | 8-category tabbed view, achievement list with progress, title selector integration. |
| `WelcomeBack.tsx` | Modal overlay for offline progress summary. Per-character gain breakdown, highlighted rare drops. |
| `SettingsPanel.tsx` | Audio volumes, display settings, keybindings, save file management. |
| `LoadingScreen.tsx` | ASCII art logo, loading progress bar, random flavor text. |

### `src/renderer/components/tooltips/` -- Tooltip System

| File | Responsibility |
|------|---------------|
| `TooltipProvider.tsx` | Context provider managing tooltip state, position, and 300ms delay logic. Wraps the entire app. |
| `TooltipPortal.tsx` | Portal-rendered tooltip container. Handles smart positioning (avoids screen edges), z-index management. |
| `ItemTooltip.tsx` | Rich item tooltip: quality-colored name, iLvl, stats, equip effects, durability, flavor text, action buttons. Stat comparison vs currently equipped item (green/red delta arrows). |
| `AbilityTooltip.tsx` | Ability details: name, cost, cooldown, cast time, damage formula with character-specific values, related talent effects. |
| `StatTooltip.tsx` | Stat formula breakdown: "Strength: 425 = 170 base + 180 gear + 50 enchants + 25 buffs". |
| `CharacterTooltip.tsx` | Character hover card: name, level, class/spec, iLvl, current activity. |
| `ZoneTooltip.tsx` | Zone hover: level range, theme, quest count, dungeon availability. |

### `src/renderer/stores/` -- Zustand Stores

| File | Responsibility |
|------|---------------|
| `characterStore.ts` | Reactive projection of all character data from the engine. Current roster, selected character, stats, gear, talents, professions. |
| `inventoryStore.ts` | Per-character item data. Bag contents, equipped items, bank storage. |
| `combatStore.ts` | Current encounter state. Boss HP, party HP/mana, combat log entries, DPS/HPS meters. |
| `questStore.ts` | Active quests per character, objective progress, available turn-ins. |
| `uiStore.ts` | Pure UI state. Active panel tabs, selected character index, open modals, panel layout dimensions, tooltip state. |
| `settingsStore.ts` | Persisted user preferences. Audio volumes, display settings, keybindings, panel layout. |
| `accountStore.ts` | Account-wide data. Gold, guild hall level, achievement progress, mount/title/transmog unlocks. |
| `companionStore.ts` | Companion quality tiers per character per content. Clear counts, current quality level. |

### `src/renderer/hooks/` -- Custom Hooks

| File | Responsibility |
|------|---------------|
| `useEngineSubscription.ts` | Generic hook that subscribes to engine state updates via IPC. Handles serialization, batching, and unmount cleanup. |
| `useTooltip.ts` | Hook providing `onMouseEnter`/`onMouseLeave` handlers with 300ms delay, tooltip content generation, and position tracking. |
| `useKeyboardShortcuts.ts` | Global keyboard shortcut handler. Maps hotkeys to panel toggles and actions. |
| `useCanvasRenderer.ts` | Hook that initializes the ASCII renderer on a `<canvas>` ref, manages resize observers, and returns rendering context. |
| `usePanelResize.ts` | Hook for panel drag-handle resize interactions. |

### `src/renderer/audio/` -- Audio System

| File | Responsibility |
|------|---------------|
| `AudioManager.ts` | Howler.js wrapper. Manages music tracks (zone/dungeon/raid/menu), crossfading, SFX triggers. Respects volume settings from `settingsStore`. |
| `MusicPlayer.ts` | Zone music state machine. Handles transitions between zones, dungeon entry/exit, raid music. Seamless loop support. |
| `SFXPlayer.ts` | Sound effect trigger map. Maps game events to SFX files. Queues simultaneous effects. |

---

## 3. ASCII Renderer Architecture

### Canvas Pipeline

The rendering pipeline runs at 60 FPS on the renderer process Canvas. Here is the exact sequence per frame:

```
1. requestAnimationFrame callback fires
2. Check dirty flag on CharacterGrid
3. If no dirty cells, skip frame (idle optimization)
4. For each dirty cell (x, y):
   a. Clear the cell rectangle (16x16 pixels) with bg color
   b. Look up character glyph from FontLoader glyph atlas
   c. Tint glyph with fg color using Canvas compositing:
      - drawImage glyph to offscreen canvas
      - globalCompositeOperation = 'source-in'
      - fillRect with fg color
      - drawImage tinted result to main canvas at (x*16, y*16)
5. Process particle effects:
   a. Update particle positions (velocity, lifetime)
   b. Render active particles to grid (set cells, mark dirty)
   c. Remove expired particles, restore previous cell content
6. Swap double buffer (if using offscreen buffer approach)
7. Clear dirty flags
```

### Font System

Two supported fonts, loaded at initialization from `/src/assets/fonts/`:

- **Px437 IBM VGA8** -- the classic DOS VGA font, 8x16 native resolution, scaled to 16x16. This is the primary font.
- **Terminus** -- alternative bitmap font, natively available in multiple sizes. 16x16 variant preferred.

Font loading approach:
1. Load font image (PNG sprite sheet: 16 columns x 16 rows = 256 glyphs)
2. Slice into individual `ImageBitmap` objects, one per CP437 codepoint
3. Store in `FontLoader.glyphs: ImageBitmap[256]`
4. For Unicode box-drawing characters (U+2500-U+257F): map to corresponding CP437 codepoints (CP437 has box-drawing at 0xB3-0xDA and 0xC0-0xDF) or render procedurally using Canvas line drawing for any missing glyphs

### Color System

The ANSI 16-color palette, defined in `Palette.ts`:

```
Index 0:  Black        #000000    Index 8:  Bright Black (Dark Grey)   #555555
Index 1:  Red          #AA0000    Index 9:  Bright Red                 #FF5555
Index 2:  Green        #00AA00    Index 10: Bright Green               #55FF55
Index 3:  Yellow       #AA5500    Index 11: Bright Yellow              #FFFF55
Index 4:  Blue         #0000AA    Index 12: Bright Blue                #5555FF
Index 5:  Magenta      #AA00AA    Index 13: Bright Magenta             #FF55FF
Index 6:  Cyan         #00AAAA    Index 14: Bright Cyan                #55FFFF
Index 7:  White        #AAAAAA    Index 15: Bright White               #FFFFFF
```

Item quality colors are mapped to ANSI palette entries:
- Common: Index 7 (White / Grey text)
- Uncommon: Index 2 (Green)
- Rare: Index 4 / 12 (Blue / Bright Blue)
- Epic: Index 5 / 13 (Magenta / Bright Magenta, standing in for purple)
- Legendary: Index 3 / 11 (Yellow / Bright Yellow, standing in for orange -- may need a custom extended color)

**Note on quality orange:** The 16-color ANSI palette does not include a true orange. Options: (a) use Bright Yellow (#FFFF55) which reads close to gold/orange on dark backgrounds, (b) extend the palette to 32 colors with custom entries including true orange (#FF8800) for legendary items. I recommend option (b) -- extending to a custom 32-color palette where indices 16-31 are game-specific colors including true orange, making the legendary color unmistakable. This is defensible because we are rendering to Canvas, not a real terminal -- we are not constrained to exactly 16 colors.

### Character Sets

**CP437 (256 codepoints):** Full IBM PC character set. Includes:
- ASCII printable (0x20-0x7E)
- Box-drawing (0xB3-0xDA): single and double line segments, corners, T-junctions, crossings
- Block elements (0xB0-0xB2, 0xDB-0xDF): shading, full blocks
- Special characters: smiley faces, card suits, musical notes, arrows

**Unicode supplement (U+2500-U+257F):** Box Drawing block. Provides all single/double/heavy line combinations. Mapped to CP437 equivalents where they exist, rendered procedurally for the rest.

**Game-specific character mapping (in `Tileset.ts`):**

| Symbol | Meaning | Foreground |
|--------|---------|-----------|
| `@` | Player character | Quality color of best gear |
| `*` | Quest objective | Bright Yellow (pulsing) |
| `D` or `o` | Dungeon entrance | Bright White |
| `F` | Flight master | Bright Cyan |
| `!` | Quest giver | Bright Yellow |
| `?` | Quest turn-in | Bright Yellow |
| `$` | Vendor | Bright Green |
| `&` | Boss mob | Bright Red |
| `r`, `s`, `w` etc. | Common mobs (rat, spider, wolf) | Red/varies |
| `^` or `*` | Mountains / terrain | White / Grey |
| `~` | Water | Bright Blue |
| `#` | Wall | Grey |
| `.` | Floor / ground | Dark Grey |
| `T` or `*` | Tree / vegetation | Green |

---

## 4. State Management

### Architecture

The state management follows a strict unidirectional flow:

```
Engine (main process)
    |
    |  IPC: serialized state snapshots (throttled to ~10/second)
    v
useEngineSubscription hook (renderer process)
    |
    |  Zustand set() calls
    v
Zustand stores (renderer process, reactive projections)
    |
    |  React hook selectors (useStore with selectors for minimal re-renders)
    v
React components (render)
    |
    |  User interaction (click, hover, keypress)
    v
Action dispatch via IPC to engine
    |
    |  Engine processes action, updates authoritative state
    v
Engine emits state update -> cycle repeats
```

### Engine Subscription Protocol

The `useEngineSubscription` hook establishes the IPC bridge:

```typescript
// Conceptual API (not implementation, just contract)
interface EngineStateUpdate {
  type: 'full' | 'delta';
  timestamp: number;
  data: {
    characters?: CharacterState[];
    combat?: CombatState;
    quests?: QuestState[];
    account?: AccountState;
    // ... other domains
  };
}

// IPC channels
'engine:state-update'     // Engine -> Renderer: state snapshots
'engine:dispatch-action'  // Renderer -> Engine: user actions
```

**Throttling:** The engine sends state updates at most 10 times per second (every 100ms). The UI interpolates between updates for smooth 60 FPS rendering where needed (e.g., HP bar animations). Combat log events are buffered and flushed with each state update.

**Delta updates:** After the initial full state sync on app load, subsequent updates are delta-only (only changed fields). The Zustand stores merge deltas into their current state using `immer`-style patches or shallow merge.

### Store Design Principles

1. **Stores never call engine APIs directly.** They provide `dispatch(action)` methods that send typed actions over IPC.
2. **Selectors are narrow.** Components select only the data they need: `useCharacterStore(s => s.selectedCharacter.stats.strength)` rather than `useCharacterStore(s => s)`.
3. **Derived data is computed in stores or selectors, not components.** Example: effective DPS computed from stats + gear + talents in a store selector, not in the CharacterSheet component.
4. **UI-only state (which panel is open, tooltip position) lives in `uiStore`, not in engine state.** This prevents unnecessary IPC traffic for purely visual concerns.
5. **No store reads engine state on demand.** All engine state flows push-only through subscriptions. This prevents race conditions between renderer and main process.

### Action Types (Renderer -> Engine)

```typescript
type UIAction =
  | { type: 'SELECT_CHARACTER'; characterId: number }
  | { type: 'EQUIP_ITEM'; characterId: number; itemId: number; slot: GearSlot }
  | { type: 'UNEQUIP_ITEM'; characterId: number; slot: GearSlot }
  | { type: 'SPEND_TALENT'; characterId: number; tree: string; nodeId: string }
  | { type: 'REFUND_TALENT'; characterId: number; tree: string; nodeId: string }
  | { type: 'RESPEC_TALENTS'; characterId: number }
  | { type: 'START_ACTIVITY'; characterId: number; activity: ActivityType; params: ActivityParams }
  | { type: 'STOP_ACTIVITY'; characterId: number }
  | { type: 'ENTER_DUNGEON'; characterId: number; dungeonId: string }
  | { type: 'ENTER_RAID'; characterId: number; raidId: string; rosterIds?: number[] }
  | { type: 'ACCEPT_QUEST'; characterId: number; questId: number }
  | { type: 'TURN_IN_QUEST'; characterId: number; questId: number }
  | { type: 'ABANDON_QUEST'; characterId: number; questId: number }
  | { type: 'CRAFT_ITEM'; characterId: number; recipeId: string; quantity: number }
  | { type: 'BUY_AH_ITEM'; listingId: number }
  | { type: 'SELL_AH_ITEM'; itemId: number; price: number }
  | { type: 'UPGRADE_GUILD_HALL'; upgradeId: string }
  | { type: 'SAVE_GAME'; slot?: number }
  | { type: 'LOAD_GAME'; slot: number }
  | { type: 'CREATE_CHARACTER'; name: string; race: string; class_: string }
  | { type: 'SELL_ITEM'; characterId: number; itemId: number }
  | { type: 'SORT_INVENTORY'; characterId: number }
  // ... additional actions as needed
```

---

## 5. Cross-Domain Interfaces

### What the UI Consumes from Engine (`realm-engine`)

| Data | IPC Channel | Update Frequency | Usage |
|------|-------------|-----------------|-------|
| Character roster (all chars, stats, gear, talents, professions) | `engine:state-update` | On change, max 10/s | CharacterList, CharacterSheet, PaperDoll |
| Current activity per character | `engine:state-update` | On change | CharacterList activity indicator, Quick Actions |
| Combat state (encounter in progress) | `engine:state-update` | Every tick during combat | CombatLog, DungeonPanel boss HP |
| Combat log entries | `engine:state-update` (batched) | Every 100ms during combat | CombatLog panel |
| Quest progress | `engine:state-update` | On change | QuestTracker |
| Account data (gold, guild hall, achievements) | `engine:state-update` | On change | GoldDisplay, GuildHall, AchievementPanel |
| Offline progress summary | `engine:welcome-back` | Once on load | WelcomeBack modal |
| Save metadata (for save/load browser) | `engine:save-metadata` | On request | SettingsPanel save browser |
| Companion quality per content | `engine:state-update` | On change | CompanionProgress |
| Raid lockout timers | `engine:state-update` | On change | DungeonPanel, calendar |
| AH listings | `engine:state-update` | On change | AuctionHouse |

### What the UI Consumes from Combat (`realm-combat`, via engine)

| Data | How Accessed | Usage |
|------|-------------|-------|
| DPS/HPS/TPS estimates per character | Computed by combat, exposed via engine state | CharacterSheet, RaidCompBuilder |
| Party composition analysis (buff coverage, role validation) | Computed by combat, exposed via engine state | RaidCompBuilder warnings |
| Encounter clear probability | Computed by combat, exposed via engine state | DungeonPanel gear check |

### What the UI Consumes from Data (`realm-data`)

| Data File | Usage |
|----------|-------|
| `classes.json` | CharacterSheet class icons, creation screen |
| `talents.json` | TalentTree node layout, descriptions, prerequisites |
| `abilities.json` | AbilityTooltip damage formulas, costs, cooldowns |
| `items.json` | ItemTooltip stat display, flavor text, quality tier |
| `zones.json` | ZoneMap terrain and symbol data, ZoneTooltip |
| `dungeons.json` | DungeonPanel boss info, mechanics summary |
| `raids.json` | RaidCompBuilder content requirements |
| `recipes.json` | ProfessionPanel recipe list, material requirements |
| `achievements.json` | AchievementPanel categories, descriptions, rewards |
| `mounts.json`, `titles.json` | Collection displays in CharacterSheet |
| `loot_tables.json` | NOT directly used by UI -- engine resolves loot |

**Data Loading Strategy:** Static data files (classes, talents, abilities, items, zones, etc.) are loaded once at app startup into an in-memory read-only cache on the renderer process. They do not change during gameplay. This data is bundled with the app and loaded via `import` or a data loader module at `src/renderer/data/DataLoader.ts`. The UI never modifies these files.

### What the UI Sends to Engine

All user actions are dispatched as typed `UIAction` objects over the `engine:dispatch-action` IPC channel. The UI sends; it never directly mutates engine state. See the action types enumerated in section 4 above.

---

## 6. Panel System

### Layout Architecture

The panel system follows the MMO client paradigm: a fixed outer shell with resizable, dockable inner panels.

**Default layout (1920x1080):**

```
+-------------------------------------------------------------------------+
| Title Bar (32px)    [Legends of the Shattered Realm]    [_][x][X]       |
+-------------------------------------------------------------------------+
| Menu Bar (28px)     [File] [Character] [View] [Help]     [Gold: 1,234g] |
+--------+--------------------------------------------+-------------------+
|        |                                            |                   |
| Char   |            Main View Area                  |   Combat Log      |
| List   |  (tabbed: Zone Map / Char Sheet /          |   (scrolling)     |
| (220px)|   Inventory / Talents / Professions /      |   (280px)         |
|        |   AH / Guild Hall / Achievements)          |                   |
|        |                                            |                   |
|        +--------------------------------------------+                   |
|        |            Quest Tracker                   |                   |
|        |            (160px height)                  |                   |
+--------+--------------------------------------------+-------------------+
| Quick Actions (64px height, full width)                                 |
+-------------------------------------------------------------------------+
```

### Panel Properties

| Panel | Default Size | Min Size | Resizable Edges | Closeable | Hotkey |
|-------|-------------|----------|-----------------|-----------|--------|
| Character List | 220px wide | 180px | Right edge | No (core) | -- |
| Main View | Fills remaining | 400x300 | Left, right, bottom | No (core) | -- |
| Combat Log | 280px wide | 200px | Left edge | Yes | L |
| Quest Tracker | 160px tall | 100px | Top edge | Yes | Q |
| Quick Actions | 64px tall | 48px | Top edge | No (core) | -- |

### Tab System in Main View

The main view area uses a tab bar at the top to switch between content panels. Only one is visible at a time (unlike WoW where windows overlay).

| Tab | Component | Hotkey | When Available |
|-----|-----------|--------|---------------|
| Zone Map | `ZoneMap.tsx` | M | Always (default) |
| Character | `CharacterSheet.tsx` | C | Always |
| Inventory | `InventoryPanel.tsx` | I | Always |
| Talents | `TalentTree.tsx` | T | Level 10+ |
| Professions | `ProfessionPanel.tsx` | P | Has profession |
| Auction House | `AuctionHouse.tsx` | A | Level 10+ |
| Guild Hall | `GuildHall.tsx` | G | Unlocked |
| Achievements | `AchievementPanel.tsx` | Y | Always |
| Dungeon/Raid | `DungeonPanel.tsx` | D | In or queuing content |
| Companions | `CompanionProgress.tsx` | -- | Always |
| Settings | `SettingsPanel.tsx` | Esc | Always |

### Implementation Approach

The `PanelLayout.tsx` component uses CSS Grid for the outer layout and tracks split positions as percentages in `uiStore`. Drag handles between panels fire `onMouseMove` handlers that update grid-template column/row sizes. Panel dimensions are persisted to localStorage so the player's layout preferences survive between sessions.

**No floating windows in v1.0.** All panels are docked in the grid layout. This dramatically simplifies implementation and avoids z-index/overlap complexity. Floating/detachable panels can be added post-launch if demanded.

---

## 7. Tooltip System

### Architecture

The tooltip system is a global React context provider (`TooltipProvider`) that any component can tap into via the `useTooltip` hook.

**Flow:**
1. Component wraps a hoverable element with `onMouseEnter`/`onMouseLeave` from `useTooltip({ type: 'item', data: itemData })`.
2. On `mouseEnter`, a 300ms timer starts.
3. If the mouse is still over the element after 300ms, the tooltip state is set in `uiStore`: `{ visible: true, type, data, position: { x, y } }`.
4. `TooltipPortal` renders a React portal at `document.body` with absolute positioning.
5. Smart positioning algorithm: tooltip placed to the right of the cursor by default. If that would overflow the viewport right edge, flip to left. If it would overflow the bottom, shift upward. Minimum 8px margin from all edges.
6. On `mouseLeave`, tooltip is hidden immediately (no fade delay -- instant responsiveness).

### Tooltip Content Types

**Item Tooltip (`ItemTooltip.tsx`):**
```
+-------------------------------------+
| Ironbeard's Bulwark          (EPIC) |   <- Name in purple
| Item Level: 75                      |
| Shield                              |
| 2,845 Armor                        |
| +45 Stamina                        |   <- Stats in white
| +38 Defense Rating                  |
| +22 Block Rating                    |
| +18 Dodge Rating                    |
| Durability: 92/100                  |   <- Yellow if < 20%
| Equip: Block restores 500 HP       |   <- Green text
| "Forged in the fires of Irondeep"   |   <- Yellow italic flavor
|                                     |
| [Currently Equipped]         or     |   <- Comparison section
| [+12 Stamina] [+8 Defense]         |   <- Green for upgrades
| [-5 Strength]                       |   <- Red for downgrades
| [Equip] [Transmog] [Sell: 12g 50s] |
+-------------------------------------+
```

The comparison section is populated by comparing the hovered item against the currently equipped item in the same slot for the selected character. This requires reading from both `inventoryStore` (hovered item) and `characterStore` (equipped item), computing stat deltas, and rendering them with green (+) or red (-) coloring.

**Ability Tooltip (`AbilityTooltip.tsx`):**
```
+-------------------------------------+
| Shield Slam                         |   <- Yellow name
| 20 Rage                 10s CD      |
| Melee Range             Instant     |
|                                     |
| Slams the target with your shield,  |
| causing 936-1,104 damage and        |   <- YOUR numbers filled in
| dispelling 1 magic effect.          |
|                                     |
| Damage: (AP / 14) * 1.9 + 250      |   <- Formula shown
| Your AP: 1,850 -> 501 bonus        |   <- Character-specific calc
|                                     |
| Talent: Sword and Board reduces     |   <- Related talent info
| cooldown by 3s (currently active)   |
+-------------------------------------+
```

**Stat Tooltip (`StatTooltip.tsx`):**
```
+-------------------------------------+
| Strength: 425                       |
| Base (level 60):           170      |
| From gear:                 +180     |
| From enchants:             +50      |
| From buffs:                +25      |
|                                     |
| Effects:                            |
| +180 Attack Power                   |
| +9 Block Value                      |
+-------------------------------------+
```

### Box-Drawing Borders on Tooltips

Tooltips use HTML/CSS borders styled to visually mimic box-drawing characters, not actual Canvas rendering. The border uses a monospace font rendering of box-drawing characters in a fixed-size outer div, or a CSS border with a custom style that evokes the ASCII look. The rationale: tooltips overlay HTML content, not the Canvas. Mixing Canvas and HTML for tooltip rendering would create z-index and positioning nightmares. CSS `border-image` or a thin solid border with monospace font content achieves the aesthetic.

---

## 8. Risk Assessment

### Risk 1: Canvas Bitmap Font Performance (HIGH)

**Risk:** Rendering 120x67 cells (1920x1080 / 16x16) at 60 FPS using Canvas `drawImage` with per-cell foreground color tinting may be too slow, especially during particle effects when many cells change per frame.

**Mitigation:**
- **Dirty cell tracking:** Only re-render cells that changed since last frame. Most frames will have <5% of cells dirty during combat, <1% during idle.
- **Pre-tinted glyph cache:** For each (glyph, fg_color) pair seen, cache the tinted result as an `ImageBitmap`. This avoids the compositing step for repeated characters. The cache is bounded by `256 chars * 32 colors = 8,192 entries`, each 16x16 RGBA = 1 KB, total ~8 MB. Easily fits in memory.
- **OffscreenCanvas:** Use `OffscreenCanvas` in a Web Worker for glyph tinting, keeping the main thread free for React rendering.
- **WebGL fallback:** If Canvas 2D proves too slow, the grid rendering can be ported to WebGL using a texture atlas approach. This is a last resort -- Canvas 2D should be sufficient given dirty cell optimization.

### Risk 2: React + Canvas Integration (MEDIUM)

**Risk:** React components and Canvas rendering live in different paradigms. Canvas is imperative; React is declarative. Mixing them risks either React re-rendering the Canvas unnecessarily or Canvas updates not triggering React re-renders when needed.

**Mitigation:**
- The Canvas element is wrapped in a single `<canvas>` React component (`ZoneMap.tsx` or a dedicated `AsciiCanvas.tsx`). The `useCanvasRenderer` hook manages the imperative Canvas lifecycle.
- React never reads from or writes to the Canvas directly. The `CharacterGrid` data structure is the bridge: React components can update grid cells (via game state changes), and the renderer reads the grid to paint.
- The Canvas `requestAnimationFrame` loop runs independently of React's render cycle. They are decoupled. React handles panel chrome; Canvas handles the game view.
- `React.memo` on the canvas wrapper component with empty deps prevents React from touching the canvas element after initial mount.

### Risk 3: IPC Bandwidth for State Updates (MEDIUM)

**Risk:** Serializing full game state (20 characters with inventories) over Electron IPC at 10 Hz could cause input lag or frame drops.

**Mitigation:**
- **Delta updates only** after initial sync. Only changed fields are sent. Most ticks change very little (maybe a combat log entry and an HP value).
- **Structured clone** (Electron 27+ uses `structuredClone` for IPC) is faster than JSON serialization for typed objects.
- **Selective subscription:** Each store subscribes to only its domain. `combatStore` only receives combat state changes, not character or quest data.
- **Batching:** State updates are batched per engine tick (1/second), not per individual mutation. Even during combat with 20 events per tick, the IPC payload is <10 KB.

### Risk 4: Tooltip Positioning and Screen Edge (LOW)

**Risk:** Tooltips with rich content (item tooltips can be 300px tall) may overflow the viewport, especially at smaller window sizes.

**Mitigation:**
- Smart positioning algorithm (see section 7) flips tooltip side and shifts vertically to stay within viewport.
- Maximum tooltip height capped at 80% of viewport height with internal scrolling if needed.
- Tested at 1280x720 minimum resolution.

### Risk 5: Panel Layout Responsiveness (LOW)

**Risk:** The fixed grid layout may not work well at resolutions below 1920x1080.

**Mitigation:**
- Minimum window size enforced in Electron: 1280x720.
- At smaller sizes, combat log and quest tracker panels collapse to icons in a toolbar, expandable on click.
- Panel minimum sizes enforced in the resize handler.
- The main view always gets priority space allocation.

### Risk 6: Memory Usage from Data Cache (LOW)

**Risk:** Loading all JSON data files (items, zones, talents, abilities, achievements -- potentially thousands of entries) into renderer process memory could push toward the 300 MB budget.

**Mitigation:**
- JSON data files are read-only and compact. Estimate: items (2,000 entries * 500 bytes = 1 MB), talents (24 trees * 25 nodes * 200 bytes = 120 KB), zones (12 * 2 KB = 24 KB), achievements (600 * 300 bytes = 180 KB). Total: ~2 MB. Well within budget.
- Large data (full quest text, lore entries) can be loaded on demand if needed, but even lazy loading is unlikely to be necessary given the scale.

---

## 9. Testing Strategy

### Component Testing (Vitest + React Testing Library)

Every React component gets unit tests covering:
- **Rendering:** Does it render without errors given valid props/store state?
- **Data display:** Do the correct values appear in the DOM (character name, stat values, item names)?
- **Interactions:** Do clicks, hovers, and key presses trigger the correct store actions or IPC dispatches?
- **Edge cases:** Empty inventories, max-level characters, zero stats, corrupted data graceful handling.

Priority components for testing:
1. `ItemTooltip` -- stat comparison logic is complex
2. `TalentTree` -- prerequisite validation, point spending/refunding
3. `CombatLog` -- virtualized list behavior, filter logic
4. `InventoryPanel` -- drag-and-drop, sorting, bag overflow
5. `WelcomeBack` -- handles variable numbers of characters and activities

### ASCII Renderer Unit Tests

| Test Area | What is Verified |
|-----------|-----------------|
| `FontLoader` | Loads font image, extracts 256 glyphs, each is 16x16 |
| `CharacterGrid` | `setCell` marks dirty, `fill` works, `drawBox` produces correct border chars |
| `Palette` | All 16 (or 32) colors map to correct RGB values |
| `Tileset` | Game concept -> char+color mapping is complete and correct |
| `Effects` | Particle lifecycle: spawn, update, expire, cleanup |
| `BoxDrawing` | Single/double borders produce correct CP437 characters at corners and edges |
| `Viewport` | Pan/scroll updates offset, world-to-screen conversion correct |
| `Renderer` | Dirty cell optimization: unchanged grid produces zero draw calls |

### Zustand Store Tests

| Test | What is Verified |
|------|-----------------|
| Initial state | Stores have correct default values |
| Subscription | `useEngineSubscription` correctly updates store on IPC message |
| Delta merge | Partial state updates correctly merge without clobbering other fields |
| Selector isolation | Narrow selector only triggers re-render when selected value changes |
| Action dispatch | Store dispatch methods send correctly typed actions over IPC |
| Derived data | Computed selectors (effective DPS, stat totals) produce correct results from known inputs |

### Visual Regression Testing

For key panels, capture DOM snapshots and compare against baselines:
- Character sheet at level 1 (fresh character)
- Character sheet at level 60 (full raid gear)
- Inventory with mixed quality items
- Talent tree with partial point allocation
- Item tooltip for each quality tier

Use Vitest snapshot testing for DOM structure. For Canvas-based rendering, capture `canvas.toDataURL()` output and compare pixel data (with tolerance for anti-aliasing differences).

### Storybook

Set up Storybook for isolated component development. Priority stories:
- `ItemTooltip` with each quality tier (Common through Legendary)
- `TalentTree` for each of the 8 classes
- `CombatLog` with simulated combat event stream
- `WelcomeBack` with various offline durations and activity combinations
- `AchievementPanel` with partial progress across categories

Storybook allows the UI to be developed and tested independently of the engine, using mock data. This unblocks UI development when the engine is not yet ready.

### Performance Benchmarks

| Metric | Target | How Measured |
|--------|--------|-------------|
| ASCII renderer FPS | 60 FPS stable | `requestAnimationFrame` timestamp delta, logged over 1000 frames |
| Frame time with 100% dirty cells | <16ms | Force all cells dirty, measure render time |
| Frame time with 1% dirty cells | <2ms | Typical idle frame |
| Particle system with 100 particles | <4ms per frame | Stress test particles |
| React re-render on state update | <5ms | React Profiler, measure commit time |
| IPC state update processing | <3ms | Timestamp before/after store update |
| Tooltip appear latency | 300ms +/- 10ms | Timer accuracy test |
| Panel resize responsiveness | <16ms per drag event | Measure grid recalc time |

---

## 10. Estimated Complexity Per Phase

| Phase | Name | Estimated Duration | Complexity | Key Challenge |
|-------|------|--------------------|------------|---------------|
| 0 | Foundation | 2-3 weeks | L | Bitmap font rendering on Canvas, IPC bridge |
| 1 | Core Panels | 3-4 weeks | XL | Paper doll, item tooltips with stat comparison, panel layout |
| 2 | Combat Log & Zone | 2-3 weeks | L | Virtualized scrolling list, Canvas viewport scrolling |
| 3 | Talents & Quests | 2-3 weeks | L | Talent tree graph layout, prerequisite validation |
| 4 | Dungeons & Companions | 2-3 weeks | M | Encounter HUD, real-time boss HP, companion progression |
| 5 | Professions & AH | 2-3 weeks | M | Recipe filtering, AH search/price display |
| 6 | Meta Systems | 2-3 weeks | M | 600+ achievement entries, guild hall upgrade tree |
| 7 | Effects & Polish | 2-3 weeks | M | Particle system, audio integration, animation |
| 8 | Accessibility & Edge Cases | 1-2 weeks | S | Keyboard nav, resize handling, error recovery |

**Total estimated duration: 17-24 weeks** (4-6 months for a single developer focused on UI).

**Parallelization opportunities:**
- Phases 0-1 must be sequential (1 depends on 0).
- Phases 2, 3, 4, 5, 6 can be partially parallelized if multiple developers are available, as they are independent panel implementations on top of the Phase 0-1 foundation.
- Phases 7 and 8 are polish and should come last.

**Dependencies on other agents:**
- Phase 0 requires realm-engine to have the IPC bridge and basic state emission working. Can be stubbed with mock data if engine is not ready.
- Phase 1 requires realm-data to have `classes.json`, `items.json`, and `talents.json` schemas defined. Can use hardcoded fixture data as placeholder.
- Phase 4 requires realm-engine dungeon state machine and realm-combat encounter resolution to be functional for live testing. Can be developed against mock encounter data.
- All phases can proceed against mock/fixture data if other agents are behind schedule. Storybook enables fully decoupled UI development.

---

### Critical Files for Implementation

- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/renderer/ascii/Renderer.ts` - The Canvas-based ASCII rendering pipeline. This is the single most important file in the UI layer. If it cannot render a character grid at 60 FPS with foreground-tinted bitmap font glyphs, nothing else matters.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/renderer/stores/characterStore.ts` - The primary Zustand store bridging engine state to the UI. Establishes the subscription pattern that all other stores follow. Gets the IPC protocol right.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/renderer/components/tooltips/ItemTooltip.tsx` - The item tooltip is the most complex tooltip type (quality colors, stat comparison, equip effects, flavor text). It validates the entire tooltip architecture and data consumption pipeline.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/renderer/components/PanelLayout.tsx` - The resizable panel grid that contains all other components. Defines the spatial organization of the entire game UI.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/renderer/ascii/FontLoader.ts` - Bitmap font loading and glyph extraction. If this fails, the ASCII renderer cannot render characters. Platform-specific image loading behavior in Electron makes this a risk point that must be validated early.