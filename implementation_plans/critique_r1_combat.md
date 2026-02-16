# Combat Expert Critique — Round 1

## Reviewer: Combat Domain Expert (realm-combat)
## Date: 2026-02-15

---

## 1. Self-Critique of the Combat Plan (`draft_v1_combat.md`)

### 1.1 Underspecified Formulas

**Pet/Summon damage is completely absent.** The combat plan lists 8 resource types at line 30 ("Rage, Mana, Energy, Combo Points, Soul Shards, Focus, Divine Favor, Maelstrom") but provides zero formulas for pet damage, pet scaling, or pet stat inheritance. The design doc explicitly names three specs that are pet-centric:

- **Beast Mastery Ranger** -- capstone "The Beast Within" affects both pet and player; "Bestial Wrath (+50% pet damage)" (design doc line 319)
- **Demonology Necromancer** -- capstone "Metamorphosis"; key talents include "Soul Link, Demonic Sacrifice, Master Demonologist, Summon Felguard" (design doc line 363)
- **Survival Ranger** -- capstone "Black Arrow" summons a "Dark Minion pet" (design doc line 324)
- **Enhancement Shaman** -- capstone "Feral Spirit" summons 2 spirit wolves (design doc line 384)
- **Balance Druid** -- "Force of Nature (summon treants)" (design doc line 347)

Where is `calculatePetDamage()`? Where is `petStatInheritance(ownerStats, petType, scalingRatio)`? Where is the pet auto-attack timer? Pet threat generation? The `CombatEntity` interface has no field for "owned pets" or "active summons." If a Beast Mastery Ranger enters an encounter, their pet is a major fraction of their DPS. Omitting pets means at least 5 of 24 specs are non-functional.

**Combo Points and secondary resource systems have no formulas.** The plan lists Combo Points, Soul Shards, Focus, Divine Favor, and Maelstrom as resource types but the `resources.ts` module (lines 150-157) only defines `generateRage`, `regenerateMana`, `regenerateEnergy`, and `spendResource`. There is no:

- `generateComboPoints(abilityType)` -- Rogues build and spend combo points per finisher
- `generateSoulShards(killEvent)` -- Necromancers generate shards on kills
- `regenerateFocus(hastePercent)` -- Rangers use focus, not mana
- `accumulateDivineFavor(healingDone)` -- Clerics build favor through healing
- `generateMaelstrom(damageDealt)` -- Shamans generate maelstrom through attacks

Without these, 16 of 24 specs cannot function. The resource system formulas are specified for exactly 3 resource types (Rage, Mana, Energy) and the remaining 5 are ghost entries.

**Arcane Charges are unaddressed.** The Arcane Mage capstone "Arcane Barrage" costs "4 Arcane Charges" (design doc line 220). Arcane Charges are a per-spell stacking mechanic, not a simple resource pool. The combat plan has no mechanism for this. Neither `resources.ts` nor `abilities.ts` accounts for stacking spell-specific resources.

**Feral Druid form-switching is unaddressed.** Feral Druids can be both tank (bear form) and melee DPS (cat form). The design doc says the capstone "Berserk" has different effects in each form (design doc line 340: "Bear: no cost on abilities. Cat: Energy costs halved"). The `CombatEntity` interface has a single `role` field. There is no concept of stance/form switching. A Feral Druid is simultaneously a potential tank AND DPS. The stat calculations change based on form (bear form provides bonus armor, cat form provides bonus crit). The combat plan treats role as static.

### 1.2 Attack Table Edge Cases

**The attack table resolution at line 117 is missing the "push off" mechanic.** When miss, dodge, parry, and block bands overflow 100%, hit and crit are pushed off the table entirely. This is the core single-roll table mechanic from vanilla WoW. The plan says "All bands must sum to exactly 100%" (line 302) but does not specify the PRIORITY of what gets pushed off. If a boss has enough defense to push hit off the table, the attacker can never land a non-avoidance outcome. The implementation must handle this: bands are filled top-to-bottom (miss first), and hit fills the remainder. If the sum of avoidance bands exceeds 100%, crit is pushed off first, then hit is clamped to 0%.

**Block value damage reduction formula is missing.** The plan defines `calculateBlockValue` in `stats.ts` (line 109) but never shows the formula for how block value reduces damage. Is it a flat subtraction? (`damageTaken = max(0, rawDamage - blockValue)`)? Or a percentage reduction? The design doc says block VALUE, not block reduction percentage, implying flat subtraction. But the combat plan never connects `blockValue` to the damage pipeline in `damage.ts`. The `calculatePhysicalDamage` function signature (line 125) has `armorMitigation` but no `blockValue` parameter.

### 1.3 Multi-Target Situations

**AoE damage formula is overly simplistic.** Line 128 says `calculateAoeDamage(singleTargetDamage, targetCount): number -- damage / sqrt(targetCount)`. But this ignores:

- Abilities with max target caps (Whirlwind hits up to 4, Chain Lightning bounces to 3)
- AoE abilities that do NOT have the sqrt penalty (e.g., Consecration ground effect damage is flat per target)
- Cleave abilities that hit only adjacent targets (Warrior Cleave is 2 targets, no reduction)
- Chain abilities with bounce reduction (Chain Heal heals 50% less per bounce)

A single `calculateAoeDamage` with a blanket sqrt penalty is insufficient. We need at least three AoE models: `uncapped_aoe` (sqrt penalty), `capped_aoe` (max N targets, no penalty per target), and `chain` (per-bounce falloff coefficient).

### 1.4 Missing Mechanic Primitives

**The `bossMechanics.ts` module (lines 193-204) lists mechanic types but is missing several critical ones from the raid design doc:**

- **Linked Health** -- listed but formula is absent. The Risen Twins in Deadhollow have linked health where if one twin is >10% HP ahead, both enrage. This is NOT simple "shared HP pool." It is a differential check.
- **Dominate Mind** (Tomb of Ancients Boss 2, raid doc line 131) -- a mind control mechanic where DPS companions attack allies for 15 seconds. The combat plan has no "charmed" or "mind controlled" state.
- **Room/Plane splitting** -- Shattered Citadel Boss 1 (line 174-175) splits the 20-player raid into two 10-player groups in separate rooms. The encounter resolution engine assumes a single combat space.
- **Environmental interaction** -- Molten Construct's "Water Valve" (dungeon doc line 149) is a non-combat action that interrupts the boss. This requires an interaction mechanic type, not a player ability.
- **Guaranteed crit interactions** -- Lava Burst "guaranteed crit vs Flame Shocked" targets (Elemental Shaman key talent, design doc line 379). The attack table resolution must support conditional guaranteed outcomes that bypass the normal roll.

### 1.5 Companion AI Degradation Model Gaps

**The error injection model (line 659-679) is too coarse.** It picks a RANDOM suboptimal ability. But the real failure modes are specific:

- A bad healer does not cast random abilities -- they overheal the tank while DPS dies, or they heal too late (reaction delay)
- A bad tank does not use random abilities -- they fail to taunt on time, or they forget active mitigation
- A bad DPS does not use random abilities -- they clip DoTs, fail to switch targets, or stand in fire

The current model where Recruit quality has a 30% chance of picking any random ability could produce a tank that casts a DPS ability, or a healer that casts a damage spell when the tank is dying. This breaks immersion and produces nonsensical combat logs. The error injection needs to be role-aware: for healers, "error" means wrong target selection or delayed reaction; for tanks, "error" means missed mitigation timing or delayed taunt; for DPS, "error" means suboptimal rotation priority but still DPS abilities.

---

## 2. Critique of the Engine Plan (`draft_v1_engine.md`)

### 2.1 Interface Mismatch with Combat

**The Engine plan defines `CombatEntity.id` as `number` (line 599); the Combat plan defines it as `string` (line 416).** This is a type mismatch that will cause compilation failures at the integration boundary. One of us is wrong. Since entity IDs originate in SQLite (which uses INTEGER PRIMARY KEY), the engine's `number` is likely correct, and my plan needs to change. But this must be resolved NOW, not at integration time.

**The Engine defines three separate combat call signatures (lines 631-641):**
```
simulateEncounterTick(encounter: ActiveEncounter, rng: SeededRng): TickResult
simulateEncounter(request: EncounterRequest): EncounterResult
estimateEncounterOutcome(party: PartyComposition, content: ContentDifficulty): { successRate, averageDuration, expectedDeaths }
```

My plan defines `simulateEncounter(params: EncounterParams, rng: SeededRNG): EncounterResult` and `processTick(combatState: CombatState, rng: SeededRNG): CombatState`. The problems:

1. The engine's `simulateEncounterTick` expects an `ActiveEncounter` type and returns a `TickResult`. My `processTick` expects `CombatState` and returns `CombatState`. These are different contracts. Who manages the mutable encounter state between ticks? The engine thinks it does (`ActiveEncounter` lives in engine). My plan thinks combat does (returns new `CombatState` each tick). This is a fundamental ownership disagreement.

2. The engine's `estimateEncounterOutcome` has no RNG parameter, but my `estimateClearProbability` in `partyAnalysis.ts` is defined as a deterministic function of party stats and content. Do we agree? Actually, yes -- the estimate is statistical, not simulated, so no RNG is correct. But the engine plan also says (line 98): "Combat domain must provide: `estimateEncounterOutcome()` -- a fast-path statistical estimator for dungeon encounters (not tick-by-tick simulation)." My plan calls this `estimateClearProbability(party, encounter, companionQualities): number` (line 208). The return types differ: engine expects `{ successRate, averageDuration, expectedDeaths }`, I return a single `number`. We need to agree on the return shape.

### 2.2 Offline Fast-Path Concerns

**The engine's `calculateOfflineDungeons` function (lines 443-464) loops over attempts and calls `rng.nextBool(successRate)` for each one.** For 7 days of dungeon farming at 30-minute clears, that is 336 iterations. This is fine for performance. But the `successRate` is obtained from `estimateSuccessRate(char, companionQuality, dungeon)` -- a function that does not exist in either the engine or combat plan. Who implements it?

The engine says combat provides `estimateEncounterOutcome()` which returns a `successRate`. But the engine hardcodes `clearTime = dungeon.averageClearTime / IDLE_PENALTY` (line 450). This is wrong for two reasons:

1. Clear time varies with party DPS. A Champion-quality party clears faster than a Recruit-quality party. The `averageClearTime` from dungeon data is a single static number. It should be modulated by companion quality.

2. The offline penalty (0.70) is applied to clear TIME, not to success rate. But the design doc applies efficiency penalties to OUTPUT (grinding 80%, questing 75%, dungeons 70%). Applying 70% to time means dungeons take LONGER offline (correct interpretation: fewer attempts), but it does not reduce the probability of each attempt succeeding. Is the penalty a success rate reduction, an attempt count reduction, or both?

### 2.3 RNG Stream Determinism Risk

**The engine plan's RNG stream architecture (lines 549-568) creates separate streams for `combat`, `loot`, `worldEvents`, `crafting`, `fishing`, `offline`.** But the offline calculation uses the `offline` stream (stated at line 808), while active play uses `combat` and `loot` streams. This means:

- A player who grinds a zone for 8 hours actively will get DIFFERENT loot than a player who closes the app for 8 hours, even with the same starting state and identical character.
- This is acknowledged at line 808-811: "offline and online results are NOT expected to be identical."

This is acceptable as stated, BUT there is an unaddressed problem: what happens when a player plays for 4 hours, closes the app, and comes back 4 hours later? The first 4 hours used the `combat`+`loot` streams. The next 4 hours use the `offline` stream. But the `combat` and `loot` stream states were advanced by the active play. If the same player had played for 8 hours straight, the `combat`+`loot` streams would be at a completely different state. This is fine -- but the engine plan says "same offline duration + same starting RNG state = identical offline results." The starting RNG state of the `offline` stream is always fixed because it is only used during offline calculation. But when is the `offline` stream state advanced? Only during offline calculation. So after each offline calculation, the stream state is advanced. This seems correct. But if the player closes and reopens the app 100 times for 1-second intervals, does the offline stream advance 100 times differently than if they were offline for 100 seconds? The engine plan does not specify whether the offline stream is reset or persistent between offline calculations.

### 2.4 Tick Budget with Combat

**Line 79 specifies the tick update order: "combat -> loot -> progression -> professions -> quests -> meta."** Line 205 says ticks are budgeted at 50ms. But during an active dungeon run, the combat step must call `simulateEncounterTick()` which processes all 5 party members and all enemies. For a raid encounter (20 party members + boss + adds), a single tick could involve 25+ entities each evaluating abilities, resolving attacks, and updating state. My performance target (line 834) is 300 ticks for 5 entities in <50ms total, meaning ~0.03ms per entity per tick. For a 25-entity raid tick, that is 0.75ms -- well under budget. But this assumes only ONE active encounter per tick. If multiple characters are doing content simultaneously (character A in a dungeon, character B grinding, character C in a raid), the engine must process multiple encounters per tick. The plan does not address this explicitly.

---

## 3. Critique of the Data Plan (`draft_v1_data.md`)

### 3.1 ResourceType Enum is Critically Incomplete

**The `ResourceType` enum (data plan lines 213-218) defines only THREE types:**
```typescript
export enum ResourceType {
  Mana = "mana",
  Rage = "rage",
  Energy = "energy",
}
```

**My combat plan requires EIGHT:** Mana, Rage, Energy, Combo Points, Soul Shards, Focus, Divine Favor, Maelstrom (combat plan line 30). The data plan's `AbilityDefinition.resourceType` field (line 416) uses this enum, so every Rogue ability that costs Combo Points, every Ranger ability that costs Focus, every Necromancer ability that costs Soul Shards will be unrepresentable.

This is a blocking defect. The entire ability data schema is incomplete.

### 3.2 AbilityEffect Type Enum is Missing Critical Types

**The `AbilityEffect.type` union (data plan lines 437-439) includes:**
```
"damage" | "heal" | "dot" | "hot" | "buff" | "debuff" | "summon" | "absorb" | "dispel" | "interrupt" | "taunt" | "stun" | "root" | "silence" | "knockback" | "threat_mod"
```

**Missing types my combat system needs:**
- `"charm"` / `"mind_control"` -- High Priest An'thos "Dominate Mind" (raid doc line 131)
- `"mana_drain"` / `"mana_burn"` -- Shadow Fiend "drains healer mana" (raid doc line 151), Seer Kath'ryn "Mana Burn" (raid doc line 200)
- `"immunity"` -- Ice Block, boss immunity phases (Bjornskar sits on throne, Leviathan submerges)
- `"damage_reduction_cooldown"` -- Last Stand, Shield Wall, Pain Suppression
- `"resource_restore"` -- "Crits refund 30% mana" (Master of Elements), "Devastate crits refund 30 rage" (Sword and Board)
- `"fear"` / `"disorient"` -- Dragon's Breath "AoE cone disorient" (design doc line 182), Psychic Scream
- `"morph"` / `"form_change"` -- Metamorphosis (Demonology capstone), Moonkin Form, Tree of Life, Bear/Cat form
- `"linked_health"` -- Risen Twins mechanic
- `"aura"` -- Sanctity Aura "+10% holy damage to party", Leader of the Pack "+5% party crit"
- `"execute"` -- abilities that only work below a HP threshold (Hammer of Wrath at <20%, Warrior Execute)
- `"guaranteed_crit"` -- Lava Burst vs Flame Shocked targets, Cold Blood, Combustion

The current enum covers perhaps 60% of the effect types I need. The remaining 40% will require workarounds or schema changes.

### 3.3 Ability Schema Lacks Scaling Stat Clarity

**Line 444:** `scalingStat: StatName | "attack_power" | "spell_power" | "weapon_dps"`

This is confusing because `attack_power` and `spell_power` are already in `StatName` (data plan lines 137-138). The `StatName` enum includes:
```
Armor = "armor",
SpellPower = "spell_power",
AttackPower = "attack_power",
```

So `scalingStat` is `StatName | "attack_power" | "spell_power" | "weapon_dps"` where two of the union alternatives are already members of `StatName`. This is a union redundancy that will cause confusion. More importantly, `"weapon_dps"` is NOT in `StatName`, and it is the MOST IMPORTANT scaling stat for melee abilities. The physical damage formula uses `(AttackPower / 14) * WeaponSpeed + WeaponBaseDamage` -- there is no single "weapon_dps" coefficient. The ability needs to know whether it scales with weapon damage (normalized or not), attack power, or both. The `scalingStat` field conflates these.

My combat formulas distinguish:
1. Abilities that use base weapon damage + AP scaling (most melee strikes)
2. Abilities that use normalized weapon damage (instant attacks in vanilla WoW)
3. Abilities that ignore weapon damage entirely (Mortal Strike uses a fixed coefficient)
4. Spell abilities that scale only with Spell Power

The `scalingStat` field cannot express this nuance. We need at minimum: `scalingType: "weapon_damage" | "attack_power" | "spell_power" | "weapon_dps_normalized" | "none"` and a separate `weaponDamageCoefficient` field.

### 3.4 Talent Effect Type Gaps

**The `TalentEffect.type` union (data plan lines 479-481):**
```
"stat_bonus" | "ability_modifier" | "passive_proc" | "grant_ability"
| "resource_modifier" | "cooldown_reduction" | "cost_reduction"
| "damage_increase" | "healing_increase" | "crit_bonus"
```

**Missing types from the design doc talent trees:**
- `"form_bonus"` -- Feral Druid talents that only apply in bear/cat form
- `"stance_bonus"` -- Warrior Tactical Mastery "rage retained on stance swap"
- `"pet_bonus"` -- Beast Mastery "Bestial Wrath (+50% pet damage)", Serpent's Swiftness (+20% pet speed)
- `"threat_modifier"` -- Defiance "+15% threat generation", Burning Soul "-10% threat"
- `"avoidance_bonus"` -- Shield Specialization "+6% block chance", Anticipation "+10 defense skill"
- `"pushback_resistance"` -- Burning Soul "fire spell pushback resistance"
- `"execute_threshold"` -- abilities unlocked below HP threshold
- `"duration_modifier"` -- Improved Renew "+3s duration", Improved Frost Nova "CD -2s" (wait, that is cooldown_reduction)

The biggest gap is `"pet_bonus"`. Without it, the Beast Mastery, Demonology, and Enhancement talent trees cannot be represented.

### 3.5 Stat Budget vs Combat Formula Consistency

**The data plan says `Total Stat Points = iLvl * 2` (line 1429).** Let me verify this against my combat formulas and the design doc reference values.

A tank in full raid gear should have ~12,000 HP (design doc line 78). HP = Stamina * 10 + classBase. If classBase is ~200, then Stamina needs to be ~1,180. At level 60, a Warrior gets Stamina 25 base + (2 * 59 levels) = 143 from leveling. That leaves 1,037 Stamina from gear. At Tier 1 gear (iLvl ~100 Epic), the budget per item is `floor(100 * 2 * 1.20) = 240` stat points. A plate tank template allocates 45% to Stamina, so `240 * 0.45 = 108` Stamina per piece. With 15 gear slots (but some share budgets -- ring/trinket), roughly 12 real slots worth: `12 * 108 = 1,296` Stamina from gear. Total: `143 + 1,296 = 1,439` Stamina, giving `1,439 * 10 + 200 = 14,590 HP`.

That is 14,590 HP, not ~12,000 HP. The stat budget is overshooting by 20%. This means either:
- The `iLvl * 2` budget is too generous
- The template allocation percentages are wrong
- Not all slots contribute equally (trinkets/rings have lower budgets)
- The design doc reference values are for a lower gear level than Tier 1

This is a balance-relevant discrepancy that needs resolution before any items are authored. If items are created with the `iLvl * 2` budget and the HP numbers come out 20% too high, tank encounters will be too easy and healer mana will never be stressed.

### 3.6 BossAbility Schema vs Combat Mechanics Interface

**The `BossAbility` schema (data plan lines 889-918) has a `damageLeveling` and `damageScaled` field pair.** But my combat formulas expect abilities to have coefficients and base damage that interact with the boss's stats. Having raw damage numbers hardcoded per ability means bosses do not benefit from standard damage calculations. This creates two separate damage pipelines: one for player abilities (formula-based) and one for boss abilities (flat numbers).

This is actually correct for boss design -- boss ability damage SHOULD be flat values defined by the designer, not computed from stats. But it means my `calculatePhysicalDamage` and `calculateSpellDamage` functions are irrelevant for boss attacks. The combat plan needs an explicit `applyBossAbilityDamage(ability: BossAbility, targets, rng)` function that bypasses the formula pipeline. I did not plan for this.

---

## 4. Critique of the UI Plan (`draft_v1_ui.md`)

### 4.1 Combat Log Event Format Mismatch

**The UI plan (line 50) specifies combat log coloring:** "white=hit, red=damage taken, green=heal, yellow=crit, grey=miss/dodge/parry." But my `CombatEvent` type is not defined in the combat plan. I say the encounter returns `events: CombatEvent[]` (line 435) but never define the `CombatEvent` discriminated union.

The UI cannot display combat log entries if the event format is unspecified. At minimum, `CombatEvent` must include:
```
type: 'damage' | 'heal' | 'miss' | 'dodge' | 'parry' | 'block' | 'crit' | 'buff_apply' | 'buff_expire' | 'death' | 'resurrect' | 'ability_cast' | 'interrupt' | 'dispel' | 'phase_change' | 'enrage'
source: string  // entity ID
target: string  // entity ID
ability: string  // ability name
amount?: number
isCrit?: boolean
overkill?: number
overheal?: number
tick: number    // game tick timestamp
```

Until this is defined by combat, the UI team is guessing at the format.

### 4.2 DPS Meter Data Consumption

**The UI plan (line 434) says:** "DPS/HPS/TPS estimates per character -- Computed by combat, exposed via engine state." My combat plan provides `EntityPerformance` (lines 440-452) which has `dps`, `hps`, `tps` fields. These are computed as `damage / duration` at the END of an encounter.

But the UI wants REAL-TIME DPS meters during encounters, not just final numbers. A live DPS meter needs per-tick damage accumulation and a sliding window average (last 5 seconds, last 10 seconds, fight-total). My plan does not provide incremental performance metrics -- only the final summary. The engine would need to accumulate these from combat log events, or combat would need to provide a `getRunningPerformance(combatState): Map<string, EntityPerformance>` function callable each tick.

### 4.3 State Update Frequency Discrepancy

**The UI plan says state updates at "10 times per second (every 100ms)" (line 368).** The engine plan says "1 Hz" tick rate with IPC state deltas once per tick (engine plan line 206, line 835). These contradict. Is it 1 Hz or 10 Hz?

The engine plan specifically says at line 836: "For combat log entries during active encounters: batch and send at most 10 entries per tick." This implies 1 tick = 1 IPC update. But the UI plan says 10 updates per second. If the tick rate is 1 Hz and combat runs at tick rate, then combat events happen once per second. Sending IPC at 10 Hz would send 9 empty updates and 1 with data. This is wasteful. Or the UI plans to interpolate, which is stated at line 368: "The UI interpolates between updates for smooth 60 FPS rendering." But HP bar interpolation between 1-second ticks will look jerky -- a boss losing 5% HP will appear as a 1-second chunk, not smooth damage.

This needs resolution. Either the engine ticks faster during active combat (unaddressed in engine plan), or the UI accepts chunky 1-second updates.

### 4.4 Party Composition Analysis Access

**The UI plan (line 435-436) says:** "Party composition analysis (buff coverage, role validation) -- Computed by combat, exposed via engine state" and "Encounter clear probability -- Computed by combat, exposed via engine state."

But my combat plan's `validatePartyComposition` (line 521-525) takes a `contentId: string` parameter that requires knowing WHICH dungeon/raid. The engine plan's IPC API (lines 488-499) has `dungeon.start(charId, dungeonId)` but no `dungeon.previewParty(charId, dungeonId)` or `dungeon.getGearCheck(charId, dungeonId)`. The UI needs to show the party composition preview and gear check BEFORE the player commits to entering the dungeon. This is a missing IPC endpoint. The engine plan has no "preview" API for content -- only "start" APIs that commit the character.

---

## 5. Cross-Cutting Concerns

### 5.1 Formula Coefficient Ownership

**Who defines ability coefficients?** The data plan defines `AbilityEffect.coefficient: number` (line 443). The combat plan's formulas consume coefficients as parameters. So far, clear: data defines, combat consumes.

But TALENT MODIFICATIONS to coefficients are problematic. Consider "Impale (2/2): Crit damage +20%" (design doc line 135). This modifies the crit multiplier for Arms Warriors from 2.0 to 2.2. Is this:
- A coefficient in `abilities.json`? No, it modifies crit multiplier, not ability coefficient.
- A talent effect in `talents.json`? The data plan's `TalentEffect` has `"crit_bonus"` type (line 481). But `crit_bonus` with `value: 0.20` and `isPercentage: true` -- does this add 20% to crit CHANCE, or 20% to crit DAMAGE MULTIPLIER? The schema does not distinguish.

This ambiguity will produce incorrect calculations. A talent that says "+5% crit" (Cruelty) and one that says "+20% crit damage" (Impale) use the same `"crit_bonus"` effect type but have fundamentally different formulas. The data plan needs separate types: `"crit_chance_bonus"` and `"crit_damage_bonus"`.

### 5.2 Buff/Debuff State Tracking

**Who tracks active buffs and debuffs during combat?**

- The engine plan's `GameState` tracks character state between encounters (persistent buffs, flask effects, world buffs)
- My combat plan's `processTick` returns a new `CombatState` which includes buff/debuff state during combat
- But the handoff is unclear: when the engine calls `simulateEncounter()`, it passes `CombatEntity[]` which includes `effectiveStats` (pre-computed). Are pre-combat buffs (like food buffs, flasks) baked into `effectiveStats` before the call? Or does combat need to process them?

The engine plan says at line 599-606 that `CombatEntity.effectiveStats` contains "All stats after gear+talents+buffs." This implies pre-combat buffs are already in the stats. But some buffs have COMBAT effects beyond stats -- like "Rapture: Shield absorbs return mana" or "Grace: your direct heals increase healing taken by target." These are combat-time mechanics, not stat bonuses. They must be passed to combat as something other than `effectiveStats`. Neither plan addresses this.

### 5.3 Companion AI Quality vs Data Plan Definitions

**The data plan defines companion thresholds in the dungeon schema (lines 839-844):**
```typescript
companionThresholds: {
    veteran: number;    // 1
    elite: number;      // 10
    champion: number;   // 25
};
```

**My combat plan defines efficiency scaling (lines 618-623):**
```
Recruit: -10 iLvl, 70% efficiency
Veteran: +0 iLvl, 85% efficiency
Elite: +5 iLvl, 100% efficiency
Champion: +10 iLvl, 115% efficiency
```

**The engine plan tracks companion clears in `CompanionSystem.ts` (line 232).** Who applies the iLvl offset? My `createCompanionState` (line 543) takes `contentILvl` and computes the offset. But the companion's gear stats need to come from SOMEWHERE. Are companion equipment sets auto-generated? From what data? The data plan has no "companion gear templates" or "companion stat tables." There is a complete gap: combat expects a fully formed `CombatEntity` for each companion, the engine needs to construct it, but the data plan defines no companion-specific data.

The engine plan mentions `Companion quality tracking (clear counts per dungeon/raid, tier thresholds)` (line 138) but never shows how companion stats are generated. My `createCompanionState` function (line 543) takes `classId`, `specId`, and `abilityData` -- implying companions have specific classes and specs. But who decides which class/spec a companion is? The design doc (dungeon doc lines 36-39) says the game generates companions based on the player's spec to fill missing roles, with "class distribution balanced (melee/ranged/caster mix)." This is a non-trivial companion generation algorithm that nobody claims ownership of.

---

## 6. Balance Risks

### 6.1 Titan's Grip Fury Warrior is Likely Broken

The Fury Warrior capstone "Titan's Grip: Can dual-wield 2H weapons (-10% dmg penalty)" (design doc line 159) interacts catastrophically with the physical damage formula:

```
APBonus = (AttackPower / 14) * WeaponSpeed
```

2H weapons have 3.4-3.6 weapon speed vs 1H weapons at 2.0-2.4 speed. A Titan's Grip Fury Warrior with two 2H weapons gets:
- Main hand: `(AP/14) * 3.5 + WeaponDamage` then -10% penalty = 0.9x
- Off hand: same formula but with the +19% dual-wield miss penalty

The AP scaling per swing is `3.5/2.0 = 1.75x` that of a 1H weapon. Even with the -10% penalty and +19% miss, the raw damage per swing is massively higher. Combined with Enrage (crits generate extra rage, which fuels more abilities), and Rampage (+20% AP for 15s after crit), this spec will likely do 40-50% more DPS than Arms. The 15% balance band will be blown.

Neither the combat plan nor the data plan has any mechanism to detect this during development. The balance test harness (data plan Phase 7) would catch it, but only if the test harness is built AFTER the combat system and AFTER the data is authored. If anyone tunes ability coefficients without running mass simulations, this will ship broken.

### 6.2 Healer Mana vs Encounter Duration

My combat plan acknowledges this risk (line 709) but does not specify the mana regeneration formula during combat. `resources.ts` defines `regenerateMana(spirit, intellect, inCombat, mp5Bonus, talents): number` (line 152) but does not show the formula body. The design doc says Spirit governs regen, but the exact in-combat regen formula is absent from both the design doc and my plan.

In vanilla WoW, the "five second rule" (FSR) governed mana regen: no regen for 5 seconds after casting a mana-spending spell, then Spirit-based regen resumed. If we implement FSR, healers who chain-cast will have zero regen and depend entirely on MP5 and class mechanics. If we do NOT implement FSR, Spirit-based regen will be too strong and healers will never go OOM.

This is THE defining knob for raid encounter tuning. If healer mana is too generous, encounters can last forever. If too stingy, encounters must be under 3 minutes. The design doc specifies encounter durations of 12-30 minutes for raid bosses (e.g., Xal'vothis at 30 minutes, line 258). A healer sustaining for 30 minutes of continuous healing requires either massive MP5 or periodic regen phases. Neither plan addresses how this works.

### 6.3 Boss Mechanics with Recruit Companions

**The design doc says raids "cannot be idled" (raid doc line 14) but dungeons can.** Dungeon boss mechanics like "Corpse Explosion: move away from dead adds" (dungeon doc line 86) require spatial awareness. Recruit companions have 50% avoidance rate for positional mechanics (combat plan line 687). For a boss like Archbishop Severus Phase 2, which spawns Corrupted Acolytes that wipe the party if not killed in 15 seconds, a Recruit DPS companion doing 70% efficiency with 30% error rate in ability selection could easily fail the DPS check.

The design doc says the FIRST clear is "brutal" with Recruit companions. But is it too brutal? If the first dungeon (Deadhollow Crypt, level 15-18) has a soft DPS check on Archbishop Severus that Recruit companions consistently fail, then no character can ever clear the dungeon, which means companions never upgrade to Veteran, which means dungeon content is permanently locked.

The balance test harness (data plan line 815-817) tests "clear rate < 20% with Recruit companions" for dungeons. But the combat plan's party analysis (line 208) only has `estimateClearProbability` -- it does not simulate whether Recruit companions can handle specific mechanics like the 15-second add kill timer. This requires actual `simulateEncounter()` testing with Recruit-quality AI against Archbishop Severus's add spawn mechanic.

### 6.4 Linked Health Encounters with Auto-Battler

**The Risen Twins (dungeon doc line 104):** "If one twin >10% HP ahead, both gain Enraged (+50% dmg, +25% speed)." In a player-controlled game, you DPS both evenly. In an AUTO-BATTLER, the DPS companions use `selectDpsTarget` (combat plan line 173) which picks a target based on threat table and current target. There is no mechanism for "keep two targets at similar HP." The companion AI will focus one twin, it will die first, the other will enrage before dying, and the party wipes.

This is a design-level problem that the combat plan must solve explicitly. The companion AI needs a `target_balancing` mechanic for linked-health encounters. My `selectDpsTarget` function must account for boss mechanic constraints, not just threat.

Similarly, the Undying Twins in Tomb of Ancients (raid doc line 141) have "Resurrection Bond: dead twin revives at 50% after 10s. Must kill both within 10s." The auto-battler AI must coordinate DPS to kill both within a 10-second window. This requires ALL DPS companions to switch targets simultaneously at a specific HP threshold. The current priority-based rotation system has no concept of "global coordination signal." Each companion makes independent decisions. This mechanic may be fundamentally incompatible with the per-entity independent decision model.

### 6.5 Multi-Character Simultaneous Content

The engine plan supports 20+ characters each doing independent activities (grinding, dungeons, etc.). If two characters are simultaneously in dungeon encounters, the engine must call `simulateEncounterTick()` for BOTH encounters each tick. At 5 entities per encounter, that is 10 entity evaluations per tick. Manageable. But with 20 characters, if 10 are in dungeons simultaneously (unlikely but possible), that is 50 entity evaluations per tick. Still under budget.

However, if a player sends a character into a 20-man raid with 20 entities + boss + adds (potentially 30+ entities), AND another character is in a 5-man dungeon, that single tick must process 35+ entities. My performance target of <50ms for a 300-tick encounter assumes serial processing. The engine's 50ms per-tick budget would be consumed by a single raid encounter, leaving no room for other characters' activities.

---

## Summary of Critical Issues (Severity-Ordered)

| # | Severity | Owner | Issue |
|---|----------|-------|-------|
| 1 | **BLOCKER** | Data | `ResourceType` enum has 3 entries; combat needs 8. 16 of 24 specs cannot be represented. |
| 2 | **BLOCKER** | Combat | Pet/summon system completely absent. 5 of 24 specs non-functional. |
| 3 | **HIGH** | Combat+Data | `AbilityEffect.type` missing ~10 critical effect types (mind control, mana drain, immunity, form change, aura, guaranteed crit). |
| 4 | **HIGH** | Combat+Engine | `CombatEntity.id` type mismatch: engine says `number`, combat says `string`. |
| 5 | **HIGH** | Combat | Block value damage reduction never connected to the damage pipeline. |
| 6 | **HIGH** | Data+Combat | `TalentEffect.type` conflates crit chance bonus and crit damage bonus. |
| 7 | **HIGH** | All | Companion generation algorithm has no owner. Engine must construct `CombatEntity` for companions but has no companion data source. |
| 8 | **HIGH** | Combat | Feral Druid form switching has no model. Single-role `CombatEntity` cannot express stance/form. |
| 9 | **HIGH** | Combat | AoE damage model has one formula; needs at least three (uncapped sqrt, capped flat, chain bounce). |
| 10 | **MEDIUM** | Combat | Companion AI error injection is role-unaware. Random ability selection produces nonsensical behavior. |
| 11 | **MEDIUM** | Engine+Combat | Tick-by-tick encounter state ownership disagreement (engine's `ActiveEncounter` vs combat's `CombatState`). |
| 12 | **MEDIUM** | Data | Stat budget formula (`iLvl * 2`) produces ~20% higher HP than design doc reference values at Tier 1. |
| 13 | **MEDIUM** | Combat | `CombatEvent` discriminated union undefined. UI cannot build combat log display. |
| 14 | **MEDIUM** | Combat | Linked-health and coordinated-kill boss mechanics are incompatible with per-entity independent AI decision model. |
| 15 | **MEDIUM** | Engine+UI | State update frequency disagreement (engine: 1 Hz, UI: 10 Hz). |
| 16 | **MEDIUM** | Combat | In-combat mana regeneration formula unspecified. Determines viability of 30-minute raid encounters. |
| 17 | **LOW** | Data | `AbilityDefinition.scalingStat` conflates weapon damage and AP scaling. |
| 18 | **LOW** | Engine | Missing "preview" IPC endpoint for dungeon party composition before commit. |
| 19 | **LOW** | Combat | Titan's Grip dual-2H likely breaks 15% DPS balance band. Needs early simulation. |
| 20 | **LOW** | Combat+Engine | Boss ability damage bypasses player damage formulas; needs explicit `applyBossAbilityDamage()` pathway. |
