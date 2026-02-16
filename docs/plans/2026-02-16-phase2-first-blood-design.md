# Phase 2: "First Blood" — Level 1-5 Idle Loop

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Create a character, enter Greenhollow Vale, idle-fight mobs, gain XP, level to 5, equip loot drops, complete a kill-quest chain. Close the app, reopen, see offline gains.

**Approach:** Hybrid — Data Sprint (2A) then Vertical Slice (2B).

**Prerequisites:** Phase 0 (shared foundation) + Phase 1 (domain foundations) complete. 532 tests, clean build, tagged v0.1.0-phase1.

---

## Scope

**In scope:**
- 6 new Zod schemas (ability, item, zone, mob, quest, loot-table) + minimal content JSON
- XP curve data (levels 1-60)
- Combat orchestration: AbilitySystem, EncounterRunner, CombatFactory
- Engine wiring: EventBus, GameManager, CharacterService, InventoryService, ActivityManager, ProgressionService, LootService, QuestTracker, OfflineCalculator
- UI: CharacterCreate, CharacterSheet (with equipment slots), CombatLog, ZoneView, gameStore
- 1 zone (Greenhollow Vale, levels 1-5), 5 mob types, 5 quests, ~15 items, 2-3 abilities per class

**Not in scope:**
- Dungeons, raids, companions
- Professions, crafting, achievements
- Talent point allocation UI (trees defined in data, spending deferred)
- Buff/debuff tracker (interface designed for, not built)
- Multiple zones (Thornwood Forest is Phase 3 content)

---

## Phase 2A: Data Sprint

### New Schemas (6 total)

All schemas validate types already defined in `src/shared/definitions.ts`.

#### 1. `ability.schema.ts` → `AbilityDefinition`
- id (AbilityId), name, className (ClassName enum), spec (TalentSpec | null)
- castTime, cooldown, globalCooldown, channeled
- resourceCost, resourceType (ResourceType enum)
- targetType, range, aoeRadius, maxTargets
- effects[] (AbilityEffect: type, damageType, baseDamage, coefficient, scalingStat)
- aiPriority, aiCondition

#### 2. `item.schema.ts` → `ItemDefinition`
- id (ItemId), name, quality (QualityTier enum), itemLevel, requiredLevel
- slot (GearSlot | "consumable" | "material" | "quest" | etc.)
- stats (partial record of stat names → values)
- weaponDamageMin/Max, weaponSpeed, armorValue, blockValue
- bindOnPickup, bindOnEquip, unique, stackSize, vendorSellPrice
- sources[] (type, sourceId, dropRate)

#### 3. `zone.schema.ts` → `ZoneDefinition`
- id (ZoneId), name, levelRange {min, max}, theme, loreDescription
- mobIds[], questIds[], dungeonUnlock?, gatheringNodes[], rareSpawns[]
- worldDropTable (LootTableId), breadcrumbQuestTo?

#### 4. `mob.schema.ts` → `MobDefinition`
- id (MobId), name, level, isElite, isBoss, isRareSpawn
- health, mana?, armor, meleeDamageMin/Max, attackSpeed
- abilities[] (MobAbility: id, name, damageType, castTime, cooldown, damage, targetType)
- zoneId, lootTableId, xpReward, icon

#### 5. `quest.schema.ts` → `QuestDefinition`
- id (QuestId), name, questText, turnInText, level, zoneId
- prerequisites[], followUp?, chainName?, chainOrder?
- objectives[] (type, targetId, description, requiredCount, dropRate)
- rewards {xp, gold, choiceItems?, guaranteedItems?, unlocksContent?}
- type (main_chain | side | daily | etc.), repeatable, dailyReset

#### 6. `loot-table.schema.ts` → NEW `LootTableDefinition`
- id (LootTableId), name
- entries[] (itemId, dropRate 0-1, minQuantity, maxQuantity)
- goldMin, goldMax (gold drop range)

**Note:** `LootTableDefinition` needs to be added to `src/shared/definitions.ts`.

### Content JSON (Minimal)

#### `abilities.json` (~200 lines)
2-3 starter abilities per class. Every class gets an auto-attack plus 1-2 abilities available at level 1:
- Warrior: Heroic Strike, Battle Shout
- Mage: Fireball, Frost Armor
- Cleric: Smite, Lesser Heal
- Rogue: Sinister Strike, Eviscerate
- Ranger: Aimed Shot, Serpent Sting
- Druid: Wrath, Rejuvenation
- Necromancer: Shadow Bolt, Corruption
- Shaman: Lightning Bolt, Earth Shock

#### `items.json` (~150 lines)
~15 items sourced from Greenhollow Vale quest rewards and mob drops:
- Farmer's Pitchfork (quest 1 reward, Common 2H)
- Wolf Hide Vest (quest 2 reward, Leather armor)
- Iron Shortsword (quest 3 reward, Uncommon 1H)
- Merchant's Ring (quest 4 reward, trinket)
- Kragg's Head Trophy (quest 5 reward, trinket)
- Rat Tooth Dagger (mob drop)
- Wolf Pelt Shoulders (mob drop)
- Bandit's Leather Belt (mob drop)
- Crude Cloth Robe (vendor starter, casters)
- Rusty Mail Chestpiece (vendor starter, melee)
- Wooden Shield (vendor starter, tanks)
- Apprentice's Wand (vendor starter, casters)
- Worn Leather Gloves (world drop)
- Tarnished Silver Ring (world drop)
- Cracked Wooden Staff (vendor starter, druids/shaman)

#### `zones.json` (~30 lines)
1 zone: Greenhollow Vale (levels 1-5), references mob IDs + quest IDs.

#### `mobs.json` (~80 lines)
5 mob types from the design doc:
- Cellar Rat (level 1, low HP/damage)
- Dire Wolf (level 2-3, medium HP)
- Blackthorn Scout (level 3-4, moderate damage)
- Blackthorn Bandit (level 4, higher armor)
- Bandit Leader Kragg (level 5, elite, high HP/damage, 1 ability)

#### `quests.json` (~100 lines)
5 main chain quests — "Defense of Greenhollow":
1. The Rat Problem — kill 10 Cellar Rats → 250 XP, 15 silver, Farmer's Pitchfork
2. Wolf Menace — kill 15 Dire Wolves → 400 XP, 25 silver, Wolf Hide Vest
3. Bandit Scouts — kill 12 Blackthorn Scouts → 500 XP, 35 silver, Iron Shortsword
4. Stolen Supplies — kill 8 Blackthorn Bandits → 600 XP, 50 silver, Merchant's Ring
5. The Bandit Leader — kill 1 Bandit Leader Kragg → 800 XP, 1 gold, Kragg's Head Trophy

Skeleton quest system: auto-accept sequential quests, track kill counts, auto-turn-in on completion.

#### `loot-tables.json` (~60 lines)
5-6 tables: one per mob type + zone world drop table.
- Cellar Rat: 10% Rat Tooth Dagger, 5-12 copper
- Dire Wolf: 8% Wolf Pelt Shoulders, 10-20 copper
- Blackthorn Scout: 12% Bandit's Leather Belt, 15-30 copper
- Blackthorn Bandit: 10% Worn Leather Gloves, 20-40 copper
- Bandit Leader Kragg: 25% Tarnished Silver Ring, 50-100 copper
- World drops: 2% Worn Leather Gloves, 1% Tarnished Silver Ring

#### `xp-curves.json` (~60 lines)
Pre-calculated XP required per level 1-60 using formula: `round(1000 * level^2.4)`

### Loader & API Extensions

Extend `loadGameData()` to validate all new JSON files. New API functions:
- `getAbility(id)`, `getAllAbilities()`, `getAbilitiesByClass(className)`
- `getItem(id)`, `getAllItems()`
- `getZone(id)`, `getAllZones()`
- `getMob(id)`, `getMobsByZone(zoneId)`
- `getQuest(id)`, `getQuestsByZone(zoneId)`, `getQuestChain(chainName)`
- `getLootTable(id)`
- `getXpForLevel(level)`, `getTotalXpToLevel(level)`

---

## Phase 2B: Vertical Slice

### Combat Orchestration

#### `AbilitySystem.ts`
- `executeAbility(caster, ability, target, rng)` → `AbilityResult`
- Validates: resource cost available, cooldown ready, target valid
- Resolves: attack table roll (existing), damage/healing calc (existing), resource spend
- Returns: events generated (damage dealt, resource spent, cooldown started)
- Does NOT handle buffs/debuffs (interface slot for Phase 3)

#### `EncounterRunner.ts`
- `runEncounter(params: EncounterParams, rng: ISeededRng)` → `EncounterResult`
- Pure function, fully deterministic
- Per-tick loop:
  1. Advance cooldowns for all entities
  2. For each entity (ordered by initiative): select ability via AI priority, execute via AbilitySystem
  3. Apply damage/healing results, update HP/resources
  4. Resource regeneration (existing resource.ts)
  5. Check death conditions
  6. Emit CombatEvents
- Terminates on: all enemies dead (victory) or player dead (defeat)
- Returns: outcome, events[], ticks elapsed, xp/loot earned

#### `CombatFactory.ts`
- `buildPlayerEntity(character: CharacterState, abilities: AbilityDefinition[], equippedItems: ItemInstance[])` → `CombatEntity`
- `buildMobEntity(mob: MobDefinition)` → `CombatEntity`
- Calculates effective stats: base + per-level + equipment bonuses
- Maps abilities to CombatEntity ability slots

### Engine Wiring

#### `EventBus.ts` (build first)
- Typed event emitter: `on<T>(eventType, handler)`, `emit<T>(eventType, data)`, `off()`
- Events: `GameEvent` discriminated union from `src/shared/events.ts`
- Used by: GameManager → IPC bridge → UI stores

#### `GameManager.ts`
- Holds: character roster (loaded from DB), active character, zone state
- `onTick(tickNumber)`: routes to ActivityManager for each active character
- `handleCommand(cmd: EngineCommand)`: create character, start grinding, equip item, etc.
- `handleQuery(query: EngineQuery)`: get character state, get inventory, etc.
- Coordinates save: dirty flag, periodic flush to SQLite

#### `CharacterService.ts`
- `createCharacter(name, race, class)` → validates via data API, builds initial CharacterState, persists
- `deleteCharacter(id)`, `loadCharacter(id)`, `loadAllCharacters()`, `saveCharacter(state)`
- Initial stats from ClassDefinition.baseStats + RaceDefinition bonuses
- Starting gold: 0, starting level: 1, empty inventory

#### `InventoryService.ts`
- `addItem(characterId, item: ItemInstance)` → finds open bag slot or fails
- `removeItem(characterId, slotIndex)` → removes from bag
- `equipItem(characterId, bagSlotIndex)` → moves item to equipment slot, returns old item to bag
- `unequipItem(characterId, gearSlot)` → moves equipped item to bag
- `getEffectiveStats(character)` → base stats + sum of all equipped item stats
- Initial bag: 16 slots (one default bag)
- Equipment slots: head, shoulders, chest, legs, feet, hands, wrist, waist, weapon_main, weapon_off, ranged, trinket1, trinket2, ring1, ring2, neck, back

#### `ActivityManager.ts`
- Simple state machine per character: `idle` | `zone_grinding`
- `startZoneGrinding(characterId, zoneId)` → validate zone level range, transition state
- `stopGrinding(characterId)` → transition to idle
- `onTick(characterId)` → if zone_grinding: pick next mob, run encounter tick, handle results

#### `ProgressionService.ts`
- `awardXp(character, amount)` → add XP, check level-up threshold from xp-curves data
- On level-up: increment level, apply per-level stat gains from ClassDefinition, emit level_up event
- Supports multi-level-up (if XP gain crosses multiple thresholds)

#### `LootService.ts`
- `rollLoot(lootTableId, rng)` → iterate entries, roll against dropRate, return ItemInstance[]
- `rollGold(goldMin, goldMax, rng)` → random gold amount
- Creates ItemInstance from ItemDefinition with unique instance ID

#### `QuestTracker.ts` (skeleton)
- `getActiveQuests(characterId)` → current quest chain progress
- `onMobKill(characterId, mobId)` → increment kill count if mob matches active quest objective
- `checkCompletion(characterId)` → if objective met, auto-turn-in: award XP/gold/items, advance to next quest in chain
- Auto-accepts first quest in chain on zone entry, auto-accepts next quest on turn-in
- Persists quest state to SQLite (quest_progress table already exists in schema)

#### `OfflineCalculator.ts`
- On game resume: `calculateOfflineGains(character, elapsedSeconds)` → `WelcomeBackSummary`
- Fast-sim approach:
  1. Estimate average fight duration from mob stats vs character stats
  2. Estimate fights per elapsed time
  3. Calculate total XP (with level-ups applied iteratively)
  4. Roll loot table N times for representative drops
  5. Advance quest kill counts proportionally
- Returns: XP gained, levels gained, items found, gold earned, quests completed

### UI Layer

#### `stores/gameStore.ts`
- State: characterRoster[], activeCharacterId, combatEvents[], zoneState, questProgress
- Actions: createCharacter, selectCharacter, startGrinding, stopGrinding, equipItem, unequipItem
- Sync: IPC bridge — commands go out, events come in via `window.api.onTick`
- On mount: load roster from engine via `window.api.getGameState()`

#### `components/CharacterCreate.tsx`
- Step 1: Enter name (validated: 2-16 chars, alphanumeric + spaces)
- Step 2: Pick race (6 cards showing racial bonuses)
- Step 3: Pick class (8 cards showing description + resource type)
- Step 4: Preview stats (base stats from class + race bonuses)
- Step 5: Create button → IPC command → navigate to CharacterSheet

#### `components/CharacterSheet.tsx`
- Header: name, race, class, level, XP bar (current/required)
- Left panel: base stats (STR, AGI, INT, STA, SPI) + derived (HP, Mana, Armor, AP/SP, Crit%, etc.)
- Right panel: equipment slots (paper doll style, clickable to unequip)
- Bottom: inventory grid (16 slots, items shown as colored ASCII icons, click to equip)

#### `components/CombatLog.tsx`
- Scrolling list of combat events, max lines from settingsStore
- Color coding: damage=red, healing=green, XP gain=yellow, loot=cyan, level-up=bright white, quest=amber
- Auto-scrolls to bottom, pause-scroll on manual scroll up
- Clear button

#### `components/ZoneView.tsx`
- Zone name + level range header
- Current mob being fought (name, HP bar, level)
- Character HP/resource bars
- Start/Stop grinding toggle button
- Quest progress sidebar: current quest name, objective (e.g., "Kill Cellar Rats: 7/10")

#### `AppShell.tsx` modifications
- Initial state (no characters): show CharacterCreate full-screen
- With characters: Character tab → CharacterSheet, route other active tabs
- Add ZoneView as overlay/panel within the content area when grinding

---

## Architecture Decisions

1. **EncounterRunner is pure** — takes params + RNG, returns result. No side effects. This enables deterministic offline sim and comprehensive testing.

2. **EventBus is the backbone** — all engine → UI communication flows through typed events. IPC serializes events to renderer. UI stores subscribe to event streams.

3. **Fast-sim offline** — OfflineCalculator uses statistical estimation, not tick-by-tick replay. Simpler, faster, scales to long offline periods.

4. **No buff system yet** — AbilitySystem interface has a slot for buff application but BuffTracker is deferred. Starter abilities are all direct effects.

5. **Equipment affects combat** — CombatFactory reads equipped items to build CombatEntity. This closes the loot → power → faster kills loop that makes idle games satisfying.

---

## Success Criteria

1. `vitest run` — all tests pass (target: 650+ total)
2. `tsc --noEmit` — zero type errors
3. `electron-vite build` — clean build
4. Smoke test: create Warrior → enter Greenhollow Vale → watch combat log → gain XP → level to 5 → equip loot → complete quest chain → close/reopen → offline gains displayed
