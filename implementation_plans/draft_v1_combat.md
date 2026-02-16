# Combat Implementation Plan -- Draft v1

# Combat System Implementation Plan
## Legends of the Shattered Realm -- realm-combat Domain

---

## 1. Implementation Phases

### Phase 1: Foundational Math Layer
**Milestone:** All core numeric formulas working and tested in isolation.
**Rationale:** Every subsequent system depends on getting the math right. Damage, healing, stats, and the attack table are the atomic building blocks. If these are wrong, nothing built on top can be trusted. By establishing pure formula functions first, we create a testable foundation that can be verified against hand-calculated values from the design document.

**Deliverables:**
- Primary and secondary stat calculation from base + gear + buffs + talents
- Stat rating-to-percentage conversion with diminishing returns
- Armor mitigation formula
- Physical damage formula (weapon DPS + AP scaling)
- Spell damage formula (base + SP coefficient)
- Healing formula (base + SP coefficient, crit at 150% base)
- Attack table resolution (single-roll: Miss/Dodge/Parry/Block/Crit/Hit)
- Spell hit table resolution (Miss/Crit/Hit)
- Variance roll (0.95-1.05 multiplier)

### Phase 2: Resource and Ability System
**Milestone:** Every ability for all 24 specs can be executed on a single tick, consuming resources and applying effects.
**Rationale:** Abilities are the verbs of combat. Before we can simulate a full encounter, each ability must be representable as data and executable as a pure function that produces a `CombatEvent`. This phase bridges raw formulas to the ability execution layer.

**Deliverables:**
- Resource system (Rage, Mana, Energy, Combo Points, Soul Shards, Focus, Divine Favor, Maelstrom)
- Resource generation and spending rules per class
- Ability execution: given an ability definition + caster state + target state + RNG, produce effects
- GCD tracking (1.5s base, reduced by haste)
- Cooldown tracking per ability
- Buff/debuff application, stacking rules, duration, tick tracking
- DoT/HoT tick processing
- Proc system (chance-on-hit effects, reactive triggers)
- Auto-attack timer (weapon speed, haste-modified)

### Phase 3: Rotation and AI Engine
**Milestone:** A simulated combatant (player or NPC) can autonomously choose and execute abilities each tick according to a priority list.
**Rationale:** The game is an auto-battler. The ability priority queue is what makes each spec feel distinct. This phase also introduces the NPC companion AI, which must scale across four quality tiers. This is the system that translates "24 viable specs" from a design requirement into executable logic.

**Deliverables:**
- Priority-based ability rotation system (configurable per spec)
- Default rotation priorities for all 24 specs
- Resource-aware ability selection (do not cast if insufficient resources)
- Cooldown-aware selection (skip abilities on cooldown)
- Conditional logic (execute-phase abilities at target <20% HP, etc.)
- NPC Companion AI with quality tier scaling (Recruit/Veteran/Elite/Champion)
- Companion decision-making: heal priority, threat management, ability usage efficiency
- Threat table management and target selection

### Phase 4: Encounter Resolution Engine
**Milestone:** A full party vs. a single boss can be simulated tick-by-tick from start to victory or wipe, producing a complete combat log.
**Rationale:** This is the central deliverable of the combat domain. Everything prior converges here. The encounter resolver takes a party, enemies, and an RNG stream and runs the fight deterministically. This is what realm-engine calls when a dungeon boss is engaged or a raid encounter begins.

**Deliverables:**
- `simulateEncounter()` -- the primary API exposed to realm-engine
- Tick loop: initiative, auto-attacks, ability execution, damage/healing application, HP/resource updates, death/victory checks
- Boss mechanic framework: phase transitions, enrage timers, adds, tank busters, raid-wide damage, interruptible casts, dispellable debuffs, positional requirements
- Multi-target combat (AoE, cleave, add management)
- Party-wide event processing (healing threat split, buff auras)
- Wipe detection (all player-side characters dead)
- Victory detection (all enemies dead)
- Enrage detection (time exceeded)
- Complete `EncounterResult` output (per-character DPS/HPS/TPS, deaths, duration, events log)

### Phase 5: Party Composition and Analysis
**Milestone:** The system can validate a party composition for content, estimate clear probability, and provide performance metrics for the UI.
**Rationale:** The UI needs to display estimated success rates, DPS/HPS numbers on character sheets, and gear check results. Realm-engine needs party validation before starting content. This phase provides those read-only analysis APIs.

**Deliverables:**
- Party composition validator (role requirements per content type)
- Gear check against content iLvl requirements
- Buff/debuff coverage analysis
- Estimated DPS/HPS/TPS for a character given their gear/talents/spec
- Estimated clear probability for a party vs. specific content
- Stat summary aggregation for character sheets

### Phase 6: Balance Verification and Hardening
**Milestone:** All 24 specs verified viable, all dungeon/raid encounters clearable with appropriate gear, edge cases handled.
**Rationale:** The final phase before handoff. This is where we run mass simulations, verify that no spec falls more than 15% below mean for their role, confirm that content difficulty matches gear progression expectations, and harden against degenerate inputs.

**Deliverables:**
- Mass simulation harness (1000 fights per scenario)
- Per-spec viability verification across all content tiers
- Encounter clearability verification (appropriate gear level can clear content)
- Edge case handling (zero stats, empty party, max-level overpower, minimum gear)
- Performance profiling of encounter simulation
- Integration test suite with realm-engine's state machine

---

## 2. Module Breakdown

All files under `src/game/combat/` (new directory within the planned project structure). Every module exports only pure functions -- no classes with mutable state, no singletons, no global variables.

### `src/game/combat/stats.ts`
**Responsibility:** Calculate effective stats from all sources.
- `calculatePrimaryStats(baseStats, gearStats, buffStats, talentBonuses, racialBonuses): PrimaryStats`
- `calculateSecondaryStats(ratings, level): SecondaryPercentages` -- applies diminishing returns
- `ratingToPercentage(rating, statType, level): number` -- per-stat conversion with DR curves
- `calculateMaxHP(stamina, classBase): number` -- `(Stamina * 10) + classBase`
- `calculateMaxMana(intellect, classBase): number` -- `(Intellect * 15) + classBase`
- `calculateAttackPower(strength, agility, classType, talentMods): number`
- `calculateSpellPower(intellect, gearSP, talentMods): number`
- `calculateArmorMitigation(armor, attackerLevel): number` -- `armor / (armor + 400 + 85 * level)`
- `calculateBlockValue(strength, shieldBlockValue, talentMods): number`
- `aggregateCharacterStats(character, equippedGear, activeTalents, activeBuffs, racialData): EffectiveStats`

### `src/game/combat/attackTable.ts`
**Responsibility:** Single-roll attack table resolution.
- `resolvePhysicalAttack(attacker, defender, rng): AttackResult` -- returns Miss/Dodge/Parry/Block/Crit/Hit
- `resolveSpellAttack(attacker, defender, rng): SpellResult` -- returns Miss/Crit/Hit
- `buildAttackTable(missChance, dodgeChance, parryChance, blockChance, critChance): AttackTableBands`
- `calculateMissChance(hitRating, isDualWield, levelDelta): number`
- `calculateDodgeChance(defenderAgility, defenderDodgeRating, defenderLevel): number`
- `calculateParryChance(defenderParryRating, defenderTalents): number`
- `calculateCritChance(baseCrit, agility, critRating, talentCritBonus, critSuppression): number`
- `calculateSpellMissChance(spellHitRating, levelDelta): number`

### `src/game/combat/damage.ts`
**Responsibility:** All damage calculation formulas.
- `calculatePhysicalDamage(weaponDmg, attackPower, weaponSpeed, abilityCoeff, damageMods, armorMitigation, critMultiplier, isCrit, rng): DamageResult`
- `calculateSpellDamage(baseDamage, spellPower, coefficient, damageMods, resistPercent, critMultiplier, isCrit, rng): DamageResult`
- `calculateDotTick(baseTick, spellPower, coefficient, damageMods, resistPercent): number`
- `calculateAoeDamage(singleTargetDamage, targetCount): number` -- `damage / sqrt(targetCount)`
- `calculateAutoAttackDamage(weaponMin, weaponMax, attackPower, weaponSpeed, rng): number`
- `applyVariance(damage, rng): number` -- 0.95 to 1.05 multiplier

### `src/game/combat/healing.ts`
**Responsibility:** All healing calculation formulas.
- `calculateDirectHeal(baseHeal, spellPower, coefficient, healingMods, critMultiplier, isCrit): HealResult`
- `calculateHotTick(baseTick, spellPower, coefficient, healingMods): number`
- `calculateAbsorbShield(baseAbsorb, spellPower, coefficient, mods): number`
- `applyHealing(currentHP, maxHP, healAmount): { actualHeal: number, overheal: number }`
- `getCritHealMultiplier(baseMult, talentBonus): number` -- base 1.5, talents can raise to 2.0

### `src/game/combat/threat.ts`
**Responsibility:** Threat calculation and aggro management.
- `calculateDamageThreat(damage, stanceModifier, talentThreatMod, abilityThreatMod): number`
- `calculateHealingThreat(healAmount, enemyCount): number` -- `heal * 0.5 / enemyCount`
- `updateThreatTable(threatTable, sourceId, targetId, threatAmount): ThreatTable`
- `getHighestThreatTarget(threatTable, entityId): string`
- `shouldTauntOverride(currentTarget, tauntSource, threatTable): boolean`
- `checkAggroTransfer(currentTarget, challengerThreat, currentThreat, isMelee): boolean` -- melee 110%, ranged 130%

### `src/game/combat/resources.ts`
**Responsibility:** Resource type management (Rage, Mana, Energy, etc.).
- `generateRage(damageTaken, damageDealt, weaponSpeed, level): number`
- `regenerateMana(spirit, intellect, inCombat, mp5Bonus, talents): number`
- `regenerateEnergy(hastePercent): number` -- 20/tick base, haste-modified
- `spendResource(current, cost): { remaining: number, success: boolean }`
- `addResource(current, max, amount): number` -- clamps to max
- `calculateGCD(baseGCD, hastePercent): number` -- `max(1.0, 1.5 / (1 + hastePercent/100))`

### `src/game/combat/abilities.ts`
**Responsibility:** Ability execution -- take an ability definition and execute it.
- `executeAbility(caster, target, ability, combatState, rng): AbilityResult` -- produces list of `CombatEvent`s
- `canCastAbility(caster, ability, combatState): { canCast: boolean, reason?: string }`
- `isAbilityReady(ability, cooldownState, gcdState): boolean`
- `applyAbilityEffects(target, effects, rng): EffectResult[]` -- buffs, debuffs, DoTs, HoTs
- `processProcs(caster, procList, triggerEvent, rng): ProcResult[]`
- `tickBuffsAndDebuffs(entity, currentTick): { expired: string[], tickDamage: number, tickHealing: number }`

### `src/game/combat/rotation.ts`
**Responsibility:** Priority-based ability selection for auto-battler.
- `selectNextAbility(caster, enemies, allies, rotationPriority, combatState, rng): AbilityId | null`
- `evaluateRotationPriority(caster, priority, combatState): boolean` -- condition check per priority entry
- `getDefaultRotation(classId, specId): RotationPriority[]` -- 24 default rotations
- `selectHealTarget(allies, healerState): EntityId | null` -- lowest HP%, priority on tanks
- `selectDpsTarget(enemies, threatTable, currentTarget): EntityId | null`

### `src/game/combat/companionAI.ts`
**Responsibility:** NPC companion behavior with quality tier scaling.
- `createCompanionState(role, companionQuality, contentILvl, classId): CompanionCombatState`
- `applyQualityModifiers(baseStats, quality): ModifiedStats` -- Recruit 0.7x, Veteran 0.85x, Elite 1.0x, Champion 1.15x
- `companionDecision(companion, combatState, rng): AbilityId | null` -- wrapper around rotation with quality-based error injection
- `calculateCompanionEfficiency(quality): number`
- `injectDecisionError(optimalAction, quality, rng): AbilityId | null` -- lower quality = more suboptimal choices

### `src/game/combat/encounter.ts`
**Responsibility:** The core encounter resolution loop.
- `simulateEncounter(params: EncounterParams, rng: SeededRNG): EncounterResult` -- THE primary API
- `processTick(combatState: CombatState, rng: SeededRNG): CombatState` -- single tick of combat, returns new state
- `checkPhaseTransition(boss, combatState): PhaseTransition | null`
- `executeBossMechanic(mechanic, combatState, rng): MechanicResult`
- `checkEncounterEnd(combatState): EncounterEndCondition | null` -- victory, wipe, enrage
- `generateEncounterLog(events: CombatEvent[]): EncounterLog`

### `src/game/combat/bossMechanics.ts`
**Responsibility:** Boss mechanic type implementations.
- `processTankBuster(mechanic, tank, rng): CombatEvent[]`
- `processRaidWideDamage(mechanic, party, rng): CombatEvent[]`
- `processAddSpawn(mechanic, combatState): AddSpawnResult`
- `processInterruptibleCast(mechanic, party, rng): CastResult`
- `processDispellableDebuff(mechanic, target, party): DispelResult`
- `processEnrageTimer(enrageTime, currentTick): boolean`
- `processLinkedHealth(entities, threshold): LinkResult`
- `processPhaseTransitionEffect(phaseData, combatState): CombatState`
- `processSanityMechanic(entity, sanityState): SanityResult` -- Dreamspire Amalgam
- `processPositionalMechanic(mechanic, entityPositions, rng): CombatEvent[]`

### `src/game/combat/partyAnalysis.ts`
**Responsibility:** Party validation and performance estimation.
- `validatePartyComposition(party, contentType): ValidationResult`
- `estimateClearProbability(party, encounter, companionQualities): number`
- `estimateCharacterDPS(character, effectiveStats): number`
- `estimateCharacterHPS(character, effectiveStats): number`
- `estimateCharacterTPS(character, effectiveStats): number`
- `checkGearRequirement(partyAvgILvl, contentRequiredILvl): GearCheckResult`
- `analyzeBuffCoverage(party): BuffCoverageReport`

### `src/game/combat/index.ts`
**Responsibility:** Public API barrel export -- only expose what other domains need.

---

## 3. Formula Specification

All formulas below are transcribed from `02_character_and_combat.md` with exact values. Comments indicate design doc section references.

### 3.1 Physical Melee Damage (Section 2.3.2)

```
BaseDamage = random(weaponMin, weaponMax)   // from SeededRNG
APBonus = (AttackPower / 14) * WeaponSpeed
RawDamage = BaseDamage + APBonus
ModifiedDamage = RawDamage * AbilityCoefficient * (1 + sumOf(DamageModifiers))
AfterArmor = ModifiedDamage * (1 - ArmorReduction)
FinalDamage = AfterArmor * CritMultiplier * random(0.95, 1.05)
```

Where CritMultiplier = 2.0 base (talents can modify, e.g., Impale +20% = 2.2, Ruin +100% on spell crits = 3.0).

### 3.2 Armor Mitigation Formula (Section 2.3.2)

```
DamageReduction% = Armor / (Armor + 400 + (85 * AttackerLevel))

At level 60: DR = Armor / (Armor + 5500)

Reference values:
  0 armor     = 0% reduction
  2750 armor  = 33.3% reduction
  5500 armor  = 50% reduction
  11000 armor = 66.7% reduction (tank in full raid gear)
```

### 3.3 Spell Damage Formula (Section 2.3.2)

```
BaseDamage = SpellBaseDamage
SPBonus = SpellPower * Coefficient
RawDamage = BaseDamage + SPBonus
ModifiedDamage = RawDamage * (1 + sumOf(DamageModifiers)) * CritMultiplier
ResistedDamage = ModifiedDamage * (1 - TargetResistance%)
FinalDamage = ResistedDamage * random(0.95, 1.05)
```

### 3.4 Spell Coefficients (Section 2.3.2)

```
Fast spells   (1.5s cast): 0.428 (= 1.5 / 3.5)
Medium spells (2.5s cast): 0.714 (= 2.5 / 3.5)
Slow spells   (3.5s cast): 1.000 (= 3.5 / 3.5)
DoTs:          (Duration / 15) * 1.0
               e.g., 12s DoT = 0.8 coefficient spread across ticks
AoE penalty:   totalCoeff / sqrt(targetCount)
```

### 3.5 Healing Formula (Section 2.3.3)

```
BaseHeal = SpellBaseHealing
SPBonus = SpellPower * Coefficient
RawHeal = BaseHeal + SPBonus
ModifiedHeal = RawHeal * (1 + sumOf(HealingModifiers)) * CritMultiplier
FinalHeal = min(ModifiedHeal, TargetMissingHP)
Overheal = ModifiedHeal - FinalHeal

CritHealMultiplier = 1.5 base (talents can increase to 2.0)
```

### 3.6 Health and Mana Pools (Section 2.1.3)

```
Health = (Stamina * 10) + ClassBaseHP
Mana = (Intellect * 15) + ClassBaseMana

Reference values at level 60 in raid gear:
  Tank:   ~12,000 HP
  DPS:    ~5,500 HP
  Healer: ~4,800 HP, ~8,500 Mana
```

### 3.7 Attack Table (Section 2.3.4) -- Single-Roll System

Resolution order: Miss -> Dodge -> Parry -> Block -> Crit -> Hit

All bands must sum to exactly 100%.

```
Miss% = max(0, BaseMiss - HitRating/12.5 + DualWieldPenalty)
  BaseMiss vs same level:  5%
  BaseMiss vs boss (+3):   9%
  Dual-wield penalty:     +19%  (total 28% base vs boss)

Dodge% = BaseClass + (Agility / 15) + DodgeRating / 18 + Talents
  Diminishing returns after ~20%

Parry% = 5% + ParryRating / 20 + Talents

Block% = 5% + BlockRating / 5 + Talents  (shield users only)

Crit% = ClassBase + (Agi_or_Int / 20) + CritRating / 22 + Talents
  Boss crit suppression: -4.8% vs bosses

Hit% = 100% - (Miss + Dodge + Parry + Block + Crit)
```

### 3.8 Spell Hit Table (Section 2.3.4)

```
SpellMiss% = max(0, BaseResist - SpellHitRating / 12.5)
  Base vs boss: 16%
  Cap:          200 rating (16%)

SpellCrit% = ClassBase + (Intellect / 20) + CritRating / 22 + Talents - 4.8%(boss)

SpellHit% = 100% - SpellMiss% - SpellCrit%
```

### 3.9 Threat Formula (Section 2.3.5)

```
Threat = Damage * StanceModifier * TalentMod * AbilityMod

Stance Modifiers:
  DPS specs:    1.0  (1 damage = 1 threat)
  Tank specs:   1.5-2.0  (1 damage = 1.5-2.0 threat)
  Healer:       HealAmount * 0.5 = threat (split across all engaged enemies)

Aggro transfer:
  Melee:  needs 110% of current target's threat to pull aggro
  Ranged: needs 130% of current target's threat to pull aggro
```

### 3.10 Secondary Stat Rating Conversions (Section 2.1.2)

```
Critical Strike Rating:  22 rating = 1% crit at level 60
Hit Rating:              12.5 rating = 1% hit
Haste Rating:            15 rating = 1% haste
Defense Rating:          2.5 rating = 1 defense skill
Dodge Rating:            18 rating = 1% dodge
Parry Rating:            20 rating = 1% parry
Block Rating:            5 rating = 1% block
Resilience:              25 rating = 1% crit damage reduction
```

### 3.11 XP Formulas (Section 2.4)

```
XP_Required(level) = round(1000 * (level ^ 2.4))
Total 1->60: 4,827,000 XP

Mob XP:
  Base XP = MobLevel * 45 + 100
  Level delta modifiers:
    Same level: 100% | -1: 90% | -2: 75% | -3: 50% | -5+: 10% (grey)
    +1: 110% | +2: 120% | +3: 130% | +4+: 140%

  Stacking multipliers: Rested(200%) * Human(105%) * Heirlooms(150%) * GuildHall(115%)
  Max combined: 361%

Rested XP:
  Accumulation: 5% of level's XP per 8 hours inactive
  Cap: 150% of level's XP requirement
  Effect: doubles XP gain until depleted
```

Note: XP values are specified in the design doc but XP *awarding* is realm-engine's responsibility. Combat owns the mob XP base calculation formula, engine owns the application with modifiers.

### 3.12 Stat Caps (Section 2.1.2)

```
Hit cap:     9% vs bosses (112.5 hit rating at 60)
Spell hit:   16% vs bosses (200 spell hit rating at 60)
Defense:     350 skill minimum for raids (can't be crit by bosses)
Crit:        no hard cap, diminishing returns after ~40%
Haste:       no hard cap, most valuable 0-30%
```

---

## 4. Cross-Domain Interfaces

### 4.1 Primary API Exposed to Engine (`simulateEncounter`)

This is THE function realm-engine calls during dungeon/raid state machine execution.

```typescript
// src/game/combat/encounter.ts

interface EncounterParams {
  party: CombatEntity[];              // Player character(s) + NPC companions
  enemies: CombatEntity[];            // Boss + any initial adds
  encounterData: EncounterDefinition; // Boss mechanics, phases, enrage timer
  tickLimit: number;                  // Maximum ticks before forced end
}

interface CombatEntity {
  id: string;
  name: string;
  entityType: 'player' | 'companion' | 'enemy';
  role: 'tank' | 'healer' | 'dps';
  classId: string;
  specId: string;
  level: number;
  effectiveStats: EffectiveStats;     // Pre-calculated by stats.ts
  abilities: AbilityInstance[];       // Loaded from data
  rotation: RotationPriority[];      // Priority queue
  resources: ResourceState;          // Mana/Rage/Energy/etc.
  equipment: EquipmentSummary;       // Weapon speed, DPS, etc.
  companionQuality?: CompanionQuality; // Recruit|Veteran|Elite|Champion
}

interface EncounterResult {
  outcome: 'victory' | 'wipe' | 'enrage' | 'timeout';
  durationTicks: number;
  perEntity: Map<string, EntityPerformance>;
  deaths: DeathEvent[];
  events: CombatEvent[];             // Full log for UI combat log
  phasesReached: number;
  rngState: RNGState;                // For engine to persist
}

interface EntityPerformance {
  totalDamage: number;
  totalHealing: number;
  totalOverhealing: number;
  totalThreat: number;
  totalDamageTaken: number;
  totalHealingReceived: number;
  dps: number;                       // damage / duration
  hps: number;                       // healing / duration
  tps: number;                       // threat / duration
  deaths: number;
  abilitiesUsed: Map<string, number>;
}

function simulateEncounter(
  params: EncounterParams,
  rng: SeededRNG
): EncounterResult;
```

### 4.2 Stat Aggregation API (consumed by Engine when building CombatEntity)

```typescript
// src/game/combat/stats.ts

interface EffectiveStats {
  // Primary
  strength: number;
  agility: number;
  intellect: number;
  stamina: number;
  spirit: number;
  
  // Derived
  maxHP: number;
  maxMana: number;
  attackPower: number;
  spellPower: number;
  armor: number;
  
  // Secondary (percentages, post-DR)
  critChance: number;
  hitChance: number;
  hastePercent: number;
  dodgeChance: number;
  parryChance: number;
  blockChance: number;
  blockValue: number;
  defenseSkill: number;
  resilience: number;
  
  // Weapon
  weaponDamageMin: number;
  weaponDamageMax: number;
  weaponSpeed: number;
  offhandDamageMin?: number;
  offhandDamageMax?: number;
  offhandSpeed?: number;
}

function aggregateCharacterStats(
  character: CharacterData,
  equippedGear: ItemData[],
  activeTalents: TalentNode[],
  activeBuffs: BuffData[],
  racialData: RaceData
): EffectiveStats;
```

### 4.3 Party Analysis API (consumed by Engine and UI)

```typescript
// src/game/combat/partyAnalysis.ts

interface PartyValidation {
  isValid: boolean;
  missingRoles: string[];         // e.g., ["healer", "tank"]
  warnings: string[];             // e.g., "Average iLvl 82, content requires 85+"
  estimatedClearChance: number;   // 0.0 - 1.0
}

function validatePartyComposition(
  party: CombatEntity[],
  contentType: 'dungeon' | 'raid10' | 'raid20',
  contentId: string
): PartyValidation;

function estimateCharacterDPS(
  character: CharacterData,
  effectiveStats: EffectiveStats
): number;

function estimateCharacterHPS(
  character: CharacterData,
  effectiveStats: EffectiveStats
): number;
```

### 4.4 Companion Generation API (consumed by Engine)

```typescript
// src/game/combat/companionAI.ts

function createCompanionState(
  role: 'tank' | 'healer' | 'dps',
  quality: CompanionQuality,
  contentILvl: number,
  classId: string,
  specId: string,
  abilityData: AbilityDefinition[],
  rng: SeededRNG
): CombatEntity;

type CompanionQuality = 'recruit' | 'veteran' | 'elite' | 'champion';

// Quality -> iLvl offset and efficiency
// recruit:  contentILvl - 10, 70% efficiency
// veteran:  contentILvl,      85% efficiency
// elite:    contentILvl + 5,  100% efficiency
// champion: contentILvl + 10, 115% efficiency
```

### 4.5 SeededRNG Interface (consumed FROM Engine)

```typescript
// src/shared/types.ts (defined by engine, consumed by combat)

interface SeededRNG {
  next(): number;                    // Returns [0, 1)
  nextInt(min: number, max: number): number;  // Returns [min, max] inclusive
  nextFloat(min: number, max: number): number;
  getState(): RNGState;             // For persistence
}
```

Combat NEVER creates an RNG instance. It receives one from engine and passes it through all function calls.

---

## 5. Dependencies on Other Domains

### 5.1 From Engine (realm-engine)

| Dependency | Type | Notes |
|------------|------|-------|
| `SeededRNG` instance | Runtime | Combat consumes, never creates. Every function that involves randomness receives it as a parameter. |
| Tick dispatch | Orchestration | Engine calls `simulateEncounter()` during content state machine execution. Combat does not self-invoke. |
| Entity lifecycle | Data flow | Engine constructs `CombatEntity` objects from saved character data + gear, passes them to combat. |
| Encounter orchestration | Control flow | Engine manages dungeon flow (trash -> boss -> loot). Combat only resolves a single encounter. |
| Companion clear counts | Data | Engine tracks how many times a character has cleared a dungeon/raid, determines companion quality tier, passes it to combat. |
| Offline simulation context | Decision | Engine decides whether to run full tick-by-tick sim or simplified probability roll for idle dungeon farming. Combat provides both APIs. |

### 5.2 From Data (realm-data)

| Dependency | Type | Notes |
|------------|------|-------|
| `abilities.json` | Content | Ability definitions: name, resource cost, cooldown, coefficient, effects, cast time. Combat formulas are parameterized by these. |
| `classes.json` | Content | Base stats per class/level, resource type, armor proficiency. |
| `talents.json` | Content | Talent effects: stat bonuses, ability modifications, proc chances. Combat reads active talent effects. |
| `stats.json` | Content | Rating-to-percentage conversion tables, diminishing return curves, stat caps. |
| `races.json` | Content | Racial bonuses (Orc +5% melee damage, Dwarf +5% armor, etc.). |
| `mobs.json` | Content | Enemy stat blocks per level, abilities, resistances. |
| `dungeons.json` / `raids.json` | Content | Boss encounter definitions: phases, mechanics, HP, enrage timers, add spawn schedules. |
| TypeScript schemas | Compile-time | Shared interfaces in `src/shared/types.ts` define the shape of all data. |

### 5.3 From UI (realm-ui)

No direct dependencies. UI consumes combat output (combat logs, DPS numbers, party validation); combat never depends on UI.

---

## 6. NPC Companion System

### 6.1 Quality Tier Effects

The companion system simulates "guild progression" -- first clears are brutal, repeated clears get smoother.

```
Quality        iLvl Offset    Efficiency    Unlock Condition (Dungeons / Raids)
-----------    -----------    ----------    ------------------------------------
Recruit        -10            70%           Default
Veteran        +0             85%           1 clear / 1 clear
Elite           +5            100%          10 clears / 5 clears
Champion       +10            115%          25 clears / 15 clears
```

**Efficiency affects:**
- DPS output (damage multiplied by efficiency)
- Healing throughput (healing multiplied by efficiency)
- Tank survivability (effective HP/mitigation scaled, reaction speed to mechanics)
- Mechanic response (higher quality = fewer "fails" on avoidable damage)

### 6.2 Companion AI Decision-Making

The companion AI is a degraded version of the optimal rotation system. Quality determines the degradation.

**Tank Companion AI:**
1. Maintain active mitigation (Shield Block, Ironfur equivalent)
2. Use taunt if non-tank has aggro
3. Execute threat-generating rotation
4. Use defensive cooldowns when HP drops below threshold
5. **Quality scaling:** Recruit tanks may delay taunts (2-3 tick lag), forget mitigation uptime, and hold cooldowns too long. Champion tanks react within 1 tick and chain cooldowns optimally.

**Healer Companion AI:**
1. Triage: heal lowest HP% party member first, priority on tanks
2. Maintain HoTs/shields on tank proactively
3. Dispel priority debuffs
4. Manage mana (Spirit-based regen, mana potions)
5. **Quality scaling:** Recruit healers overheal significantly (+40% overhealing), react 2-3 ticks late to damage spikes, and may let DPS die before switching targets. Champion healers pre-heal incoming damage, maintain near-zero overhealing, and never let preventable deaths occur.

**DPS Companion AI:**
1. Execute spec's optimal rotation priority
2. Switch to adds when spawned (with appropriate delay)
3. Interrupt interruptible casts (with quality-based reaction time)
4. Avoid avoidable damage mechanics
5. **Quality scaling:** Recruit DPS use suboptimal rotations (skip procs, wrong ability priority, clip DoTs), fail to switch targets promptly, and stand in fire. Champion DPS execute perfect rotations, immediately switch to priority targets, and never take avoidable damage.

### 6.3 Decision Error Injection

```typescript
function injectDecisionError(
  optimalAction: AbilityId,
  quality: CompanionQuality,
  availableAbilities: AbilityId[],
  rng: SeededRNG
): AbilityId {
  const errorChance = {
    recruit:  0.30,   // 30% chance of suboptimal choice
    veteran:  0.15,   // 15% chance
    elite:    0.03,   // 3% chance (near-perfect)
    champion: 0.00    // 0% -- always optimal
  };
  
  if (rng.next() < errorChance[quality]) {
    // Pick a random valid but suboptimal ability
    const suboptimal = availableAbilities.filter(a => a !== optimalAction);
    return suboptimal[rng.nextInt(0, suboptimal.length - 1)];
  }
  return optimalAction;
}
```

### 6.4 Mechanic Avoidance

For positional mechanics (ground AoE, frontal cleave, etc.), companions have a quality-based avoidance rate:

```
Recruit:  50% chance to avoid avoidable damage
Veteran:  75% chance
Elite:    95% chance
Champion: 100% chance
```

This is computed per mechanic event via an RNG roll, and determines whether the companion takes full damage from an avoidable source.

---

## 7. Risk Assessment

### 7.1 Balance Risks

**RISK: 24-spec viability is the single hardest balance challenge.** With 8 classes and 3 specs each, ensuring every spec produces competitive output within 15% of the mean for its role is a massive tuning surface. A single broken coefficient in a data file can make a spec wildly over- or under-powered.

*Mitigation:* Phase 6 mass simulation harness. Run 1000 encounters per spec against standardized targets (Patchwerk-style pure DPS/HPS check). Flag any spec outside the 15% band. Coefficients live in data files, so tuning is a data change, not a code change.

**RISK: Threat system creates non-obvious failure modes.** If DPS can never pull aggro from a tank, threat is meaningless. If DPS constantly pull aggro, fights become unplayable. The 110%/130% thresholds must be validated against actual damage output ratios at each gear tier.

*Mitigation:* Dedicated threat-balance simulation tests. Verify that at equivalent gear, a tank can hold aggro against 3 DPS within the first 5 ticks of combat. Verify that an undergeared tank (10 iLvl below DPS) can hold aggro with moderate difficulty. Verify that an overgeared DPS (10 iLvl above tank) can pull aggro if not using threat reduction.

**RISK: Healer mana economy defines encounter length.** If healers never go OOM, encounters have no healing tension. If healers OOM in 2 minutes, encounters are capped at 2 minutes. The Spirit/Intellect/MP5 balance against incoming damage rates determines viable fight lengths.

*Mitigation:* Design encounters with explicit mana budgets. For each encounter, calculate total incoming damage, required HPS, and mana cost of that HPS. Verify that a healer with content-appropriate gear can sustain for the encounter duration minus a 10% buffer (allowing for optimal play to stretch further).

### 7.2 Edge Cases

1. **Empty party / zero-stat entity** -- must not divide by zero or produce NaN. All formulas need floor/ceiling guards.
2. **100% miss chance** -- if hit rating is zero and target is much higher level, the attack table could theoretically hit 100% miss. The system must handle a combatant that never lands a hit.
3. **Infinite encounter** -- if DPS is so low that boss healing (from adds, mechanics) outpaces damage, the encounter never ends. The enrage timer is the explicit guard, but `tickLimit` in EncounterParams is the hard safety net.
4. **Overflow on large numbers** -- raid bosses have up to 6,000,000 HP. With 20 attackers, total damage events could be millions. Use standard number (JavaScript's Number is IEEE 754 double, safe up to 2^53). No risk of overflow for these values.
5. **DoT stacking** -- some DoTs stack, some refresh. The design doc implies per-spell stacking rules. Must be explicit in ability data which DoTs stack, which refresh duration, which are unique.
6. **Dual-wield interaction with attack table** -- the +19% miss penalty for dual-wielding must correctly interact with the single-roll table. The miss band expands, pushing crit and hit down.
7. **Boss immunity phases** -- some bosses become immune during phase transitions (Bjornskar Phase 3 sits on throne, Leviathan Deepmaw submerges). Must handle "target cannot be damaged" state without breaking the tick loop.

### 7.3 Hardest Challenges

**Challenge 1: Deterministic offline encounter simulation.**
When realm-engine runs idle dungeon farming, it calls `simulateEncounter()` potentially hundreds of times to calculate offline progress. Each call must be fast (target: <50ms for a 5-minute dungeon boss fight at 1 tick/second = 300 ticks). With 300 ticks, each processing 5+ entities with 5+ abilities, that is 7500+ ability evaluations per encounter. Must profile and optimize the hot loop.

**Challenge 2: Boss mechanic generalization.**
The design docs specify 25+ dungeon bosses and 36 raid bosses, each with unique mechanics. These must be representable as data-driven mechanic definitions, not hardcoded per-boss functions. The mechanic framework must be expressive enough to encode: timed casts (interruptible/not), ground AoE, add spawns, phase transitions, linked health, sanity bars, target debuffs, enrage, tank swap triggers, and dispel checks -- all as composable mechanic primitives.

**Challenge 3: Companion AI must feel emergent but be deterministic.**
A Recruit companion that "stands in fire" must do so because the deterministic RNG + quality-based avoidance rate said so, not because of a random behavior. The player should see consistent improvement as companion quality increases, and the improvement must feel natural, not mechanical.

---

## 8. Testing Strategy

### 8.1 Unit Tests (per-formula verification)

Every formula function gets a test file. Tests use hand-calculated expected values from the design document.

**`tests/combat/damage.test.ts`:**
```
- Physical damage with known weapon, AP, coefficient -> exact expected value
- Armor mitigation: 0 armor = 0%, 2750 = 33.3%, 5500 = 50%, 11000 = 66.7%
- Spell damage with known base, SP, coefficient -> exact expected value
- DoT tick calculation
- AoE falloff: 1 target = 100%, 4 targets = 50%, 9 targets = 33.3%
- Variance bounds: result always in [base*0.95, base*1.05]
- Crit multiplier application: 2.0x for physical, 1.5x for heals
```

**`tests/combat/attackTable.test.ts`:**
```
- Attack table bands sum to exactly 100%
- Miss chance reduces correctly with hit rating (12.5 rating = 1%)
- Dual-wield penalty adds 19% to miss
- Boss crit suppression (-4.8%)
- Dodge diminishing returns after ~20%
- Spell hit cap at 200 rating vs bosses
- Distribution test: 10,000 rolls, verify actual distribution matches expected within 2% margin
```

**`tests/combat/stats.test.ts`:**
```
- HP calculation: Stamina 100, base 100 -> 1100 HP
- Mana calculation: Intellect 100, base 100 -> 1600 Mana
- Rating conversions at level 60 for all secondary stats
- Diminishing returns curves: verify non-linear scaling past threshold
- Racial bonus application (Orc +5% melee damage multiplicative)
- Buff stacking: additive within category, multiplicative between categories
```

### 8.2 Integration Tests (encounter-level)

**`tests/combat/encounter.test.ts`:**
```
- Known party vs. known boss, same seed -> identical result every time (determinism)
- Party wipe when undergeared -> outcome is 'wipe'
- Party victory when appropriately geared -> outcome is 'victory'
- Enrage timer triggers at correct tick
- Boss phase transitions at correct HP thresholds
- Add spawn at correct HP/time intervals
- Tank swap mechanic forces target change
- Interrupt prevents cast completion
- Dispel removes debuff
```

**`tests/combat/companionAI.test.ts`:**
```
- Recruit companions deal 70% of optimal DPS (within 5% tolerance)
- Champion companions deal 115% of optimal DPS (within 2% tolerance)
- Healer companion keeps tank alive through sustained damage
- Tank companion maintains aggro against 3 DPS companions
- Quality-based error injection produces expected error rates over 1000 decisions
- Mechanic avoidance rates match quality tier specs
```

### 8.3 Balance Simulation Tests (statistical)

These are owned by realm-data but consume combat's `simulateEncounter()` API.

```
- For each of 24 specs: simulate 1000 fights against level-60 target dummy
  - Assert DPS/HPS/TPS within 15% of role mean
  - Assert no spec has 0 output
  - Assert resource sustainability (mana/energy not depleted before 5-minute mark)

- For each dungeon boss at level 60: simulate 100 fights with iLvl 85 party
  - Assert clear rate > 50% with Elite companions
  - Assert clear rate > 80% with Champion companions
  - Assert clear rate < 20% with Recruit companions

- For each raid tier: simulate 50 fights with tier-appropriate gear
  - Assert clear rate > 30% on first attempt (Recruit companions)
  - Assert clear rate > 70% with Champion companions

- Threat stability: simulate 100 fights, count aggro pulls
  - Assert tank holds aggro > 95% of ticks with equal gear
  - Assert DPS with threat reduction talents pulls aggro < 5% of fights
```

### 8.4 Determinism Tests

```
- Run simulateEncounter() twice with identical params and seed -> bit-identical results
- Run simulateEncounter() with seed A, get result A. Seed B -> result B. Seed A again -> result A again.
- Verify RNG state after encounter can be saved and restored for continuation
```

### 8.5 Performance Tests

```
- Single encounter (5 entities, 300 ticks): < 50ms
- Raid encounter (20 entities, 1200 ticks): < 500ms
- 100 dungeon encounters (idle simulation): < 5 seconds
- Memory: encounter simulation < 10MB allocation
```

---

## 9. Estimated Complexity

| Phase | Description | Estimated Complexity | Rationale |
|-------|-------------|---------------------|-----------|
| **Phase 1** | Foundational Math Layer | **M** | Well-defined formulas from design doc. Most are single-function implementations with clear inputs/outputs. The complexity is in getting diminishing returns curves exactly right and ensuring the attack table always sums to 100%. |
| **Phase 2** | Resource and Ability System | **L** | 8 resource types, each with different generation/spending rules. Buff/debuff system with stacking, duration, and tick tracking. Proc system with conditional triggers. The combinatorial surface of ability effects is large. |
| **Phase 3** | Rotation and AI Engine | **XL** | 24 spec-specific default rotations, each with conditional logic, resource-aware selection, and cooldown management. The NPC companion AI with quality-tier degradation adds a second dimension. This is the most design-intensive phase -- every spec must "feel right" when auto-played. |
| **Phase 4** | Encounter Resolution Engine | **XL** | The convergence of all prior phases. Boss mechanic framework must generalize across 60+ unique boss encounters. Multi-entity tick processing with threat, healing, add management. Phase transitions, enrage, and multiple simultaneous combatants. Performance matters here. |
| **Phase 5** | Party Analysis | **S** | Mostly derived calculations using already-built stat and formula functions. Party validation is rule-checking. Clear probability estimation can use a simplified model rather than full simulation. |
| **Phase 6** | Balance and Hardening | **L** | Writing the test harness is moderate. Running and interpreting results, identifying outliers, and feeding corrections back to realm-data is iterative. Edge case hardening requires systematic adversarial testing. The unknowns are in how many tuning iterations are needed. |

**Total estimated effort:** The combat system is the most formula-dense and algorithmically complex domain in the project. Phases 3 and 4 are XL because they involve the most design decisions that cannot be mechanically derived from the design doc -- the doc says "priority system" but does not specify the exact priority list for all 24 specs, nor does it specify the exact boss mechanic encoding format. Those must be designed here.

---

### Critical Files for Implementation

- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/project_plans/02_character_and_combat.md` - Primary design reference containing every formula, stat table, and combat system specification that must be implemented
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/project_plans/04_dungeons.md` - Defines all 25 dungeon boss encounters with exact HP values, ability damage numbers, phase transitions, and companion quality tiers that the encounter resolution engine must support
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/project_plans/05_raids.md` - Defines all 36 raid boss encounters with multi-phase mechanics, enrage timers, and composition requirements that stress-test the mechanic framework's generalization
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/.claude/agents/realm-engine.md` - Defines the engine's ownership boundaries and the `simulateEncounter()` integration contract that combat must conform to, including SeededRNG consumption and tick dispatch patterns
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/.claude/agents/realm-data.md` - Defines all JSON data file schemas (abilities.json, classes.json, stats.json, etc.) that combat formulas must consume -- establishes the data contract between balance coefficients and formula implementations