// src/shared/combat-interfaces.ts
import type {
  EffectiveStats, AbilityId,
} from "./types";
import type {
  ResourceType, DamageType, CompanionQuality,
  EncounterOutcome,
} from "./enums";

// ============================================================
// Seeded RNG Interface (Decision 11)
// ============================================================

export interface RngState {
  s0: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface ISeededRng {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  nextBool(probability: number): boolean;
  getState(): RngState;
  setState(state: RngState): void;
}

// ============================================================
// Combat Entity (Decision 1 — numeric IDs)
// ============================================================

export interface ResourceState {
  type: ResourceType;
  current: number;
  max: number;
  secondary?: { type: ResourceType; current: number; max: number };
}

export interface EquipmentSummary {
  weaponSpeed: number;
  weaponDps: number;
  offhandSpeed?: number;
  offhandDps?: number;
}

export interface AbilityInstance {
  id: AbilityId;
  name: string;
  resourceCost: number;
  resourceType: ResourceType;
  cooldownMs: number;
  castTimeMs: number;
  coefficient: number;
  baseDamage?: number;
  baseHealing?: number;
  damageType?: DamageType;
  maxTargets?: number;
  isAoE?: boolean;
}

export interface RotationEntry {
  abilityId: AbilityId;
  priority: number;
  condition?: RotationCondition;
}

export type RotationCondition =
  | { type: "target_hp_below"; threshold: number }
  | { type: "target_hp_above"; threshold: number }
  | { type: "self_resource_above"; threshold: number }
  | { type: "self_resource_below"; threshold: number }
  | { type: "buff_missing"; buffName: string }
  | { type: "debuff_missing_on_target"; debuffName: string }
  | { type: "cooldown_ready"; abilityId: AbilityId }
  | { type: "combo_points_at"; value: number }
  | { type: "always" };

export interface CombatEntity {
  id: number;
  name: string;
  entityType: "player" | "companion" | "enemy";
  role: "tank" | "healer" | "dps";
  classId: string;
  specId: string;
  level: number;
  effectiveStats: EffectiveStats;
  abilities: AbilityInstance[];
  rotation: RotationEntry[];
  resources: ResourceState;
  equipment: EquipmentSummary;
  companionQuality?: CompanionQuality;
  activePets?: PetState[];
}

export interface PetState {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
}

// ============================================================
// Encounter Params & Result (Decision 4, 12)
// ============================================================

export interface EncounterParams {
  party: CombatEntity[];
  enemies: CombatEntity[];
  encounterDefinition: EncounterDefinitionRef;
  tickLimit: number;
}

export interface EncounterDefinitionRef {
  bossId: string;
  phases: PhaseDefinition[];
  enrageTimerTicks: number;
  mechanics: MechanicDefinition[];
}

export interface PhaseDefinition {
  phase: number;
  name: string;
  triggerHpPercent?: number;
  triggerTick?: number;
  abilities: string[];
}

export interface MechanicDefinition {
  type: string;
  name: string;
  damage?: number;
  interval?: number;
  interruptible?: boolean;
  dispellable?: boolean;
}

export interface EncounterResult {
  outcome: EncounterOutcome;
  durationTicks: number;
  perEntity: Record<number, EntityPerformance>;
  deaths: DeathEvent[];
  events: CombatEvent[];
  phasesReached: number;
  finalRngState: RngState;
}

export interface EntityPerformance {
  totalDamage: number;
  totalHealing: number;
  totalOverhealing: number;
  totalThreat: number;
  totalDamageTaken: number;
  totalHealingReceived: number;
  dps: number;
  hps: number;
  tps: number;
  deaths: number;
  abilitiesUsed: Record<string, number>;
}

export interface DeathEvent {
  tick: number;
  entityId: number;
  killedBy: string;
}

// ============================================================
// Tick Result (Decision 12 — per-tick output)
// ============================================================

export interface TickResult {
  tick: number;
  status: "ongoing" | EncounterOutcome;
  events: CombatEvent[];
  entitySnapshots: Record<number, EntitySnapshot>;
}

export interface EntitySnapshot {
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  buffs: string[];
  debuffs: string[];
  alive: boolean;
}

// ============================================================
// Combat Events (Decision 10)
// ============================================================

interface CombatEventBase {
  tick: number;
  sourceId: number;
  sourceName: string;
  targetId: number;
  targetName: string;
}

export type CombatEvent =
  | CombatEventBase & { type: "damage"; abilityName: string; amount: number; damageType: DamageType; isCrit: boolean; isBlocked: boolean; blockAmount: number; overkill: number }
  | CombatEventBase & { type: "heal"; abilityName: string; amount: number; isCrit: boolean; overheal: number }
  | CombatEventBase & { type: "miss"; abilityName: string; missType: "miss" | "dodge" | "parry" }
  | CombatEventBase & { type: "buff_apply"; buffName: string; duration: number; stacks: number }
  | CombatEventBase & { type: "buff_expire"; buffName: string }
  | CombatEventBase & { type: "death"; killingAbility: string }
  | CombatEventBase & { type: "ability_cast"; abilityName: string; castTime: number }
  | CombatEventBase & { type: "interrupt"; abilityName: string; interruptedAbility: string }
  | CombatEventBase & { type: "dispel"; abilityName: string; dispelledBuff: string }
  | CombatEventBase & { type: "absorb"; abilityName: string; amount: number }
  | CombatEventBase & { type: "phase_change"; phase: number; phaseName: string }
  | CombatEventBase & { type: "enrage" }
  | CombatEventBase & { type: "summon"; summonName: string; summonId: number }
  | CombatEventBase & { type: "resource_change"; resourceType: ResourceType; amount: number; current: number };

// ============================================================
// Outcome Estimate (Decision 12 — fast path for offline)
// ============================================================

export interface ContentDifficulty {
  contentId: string;
  contentType: "dungeon" | "raid10" | "raid20";
  requiredILvl: number;
  bossCount: number;
  averageClearTimeTicks: number;
}

export interface OutcomeEstimate {
  successRate: number;
  averageDurationTicks: number;
  expectedDeaths: number;
}
