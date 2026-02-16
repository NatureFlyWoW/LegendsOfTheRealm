// src/game/combat/CombatFactory.ts
import type {
  CombatEntity,
  AbilityInstance,
  RotationEntry,
  ResourceState,
  EquipmentSummary,
} from "@shared/combat-interfaces";
import type {
  CharacterState,
  EffectiveStats,
  AbilityId,
} from "@shared/types";
import type {
  ClassDefinition,
  AbilityDefinition,
  ItemDefinition,
  MobDefinition,
  MobAbility,
} from "@shared/definitions";
import type { GearSlot, ResourceType, DamageType } from "@shared/enums";
import {
  calculateMaxHp,
  calculateMaxMana,
  calculateAttackPower,
  calculateSpellPower,
  calculateArmorMitigation,
  ratingToPercentage,
} from "./stats";

/**
 * Build a CombatEntity from a player character.
 *
 * @param character - The character state
 * @param classDef - The class definition
 * @param abilities - Array of ability definitions for this character
 * @param equippedItems - Array of equipped item definitions with their slots
 * @returns A combat-ready CombatEntity
 */
export function buildPlayerEntity(
  character: CharacterState,
  classDef: ClassDefinition,
  abilities: AbilityDefinition[],
  equippedItems: Array<{ slot: GearSlot; item: ItemDefinition }>,
): CombatEntity {
  // 1. Calculate base stats from class and level
  const level = character.level;
  const baseStrength = classDef.baseStats.strength + classDef.perLevelGains.strength * (level - 1);
  const baseAgility = classDef.baseStats.agility + classDef.perLevelGains.agility * (level - 1);
  const baseIntellect = classDef.baseStats.intellect + classDef.perLevelGains.intellect * (level - 1);
  const baseStamina = classDef.baseStats.stamina + classDef.perLevelGains.stamina * (level - 1);
  const baseSpirit = classDef.baseStats.spirit + classDef.perLevelGains.spirit * (level - 1);

  // 2. Add equipment stats
  let strength = baseStrength;
  let agility = baseAgility;
  let intellect = baseIntellect;
  let stamina = baseStamina;
  let spirit = baseSpirit;
  let armor = 0;
  let gearSpellPower = 0;
  let critRating = 0;
  let hitRating = 0;
  let hasteRating = 0;
  let dodgeRating = 0;
  let parryRating = 0;
  let blockRating = 0;
  let blockValue = 0;
  let defenseRating = 0;
  let resilience = 0;
  let mp5 = 0;

  // Track weapon stats for equipment summary
  let mainHandWeapon: ItemDefinition | null = null;
  let offHandWeapon: ItemDefinition | null = null;

  for (const equipped of equippedItems) {
    const { item } = equipped;
    const stats = item.stats;

    // Add primary stats
    if (stats.strength) strength += stats.strength;
    if (stats.agility) agility += stats.agility;
    if (stats.intellect) intellect += stats.intellect;
    if (stats.stamina) stamina += stats.stamina;
    if (stats.spirit) spirit += stats.spirit;

    // Add combat stats
    if (item.armorValue) armor += item.armorValue;
    if (stats.spellPower) gearSpellPower += stats.spellPower;
    if (stats.critRating) critRating += stats.critRating;
    if (stats.hitRating) hitRating += stats.hitRating;
    if (stats.hasteRating) hasteRating += stats.hasteRating;
    if (stats.dodgeRating) dodgeRating += stats.dodgeRating;
    if (stats.parryRating) parryRating += stats.parryRating;
    if (stats.blockRating) blockRating += stats.blockRating;
    if (item.blockValue) blockValue += item.blockValue;
    if (stats.defenseRating) defenseRating += stats.defenseRating;
    if (stats.resilience) resilience += stats.resilience;
    if (stats.mp5) mp5 += stats.mp5;

    // Track weapons for equipment summary
    if (equipped.slot === "main_hand" && item.weaponDamageMin !== undefined) {
      mainHandWeapon = item;
    } else if (equipped.slot === "off_hand" && item.weaponDamageMin !== undefined) {
      offHandWeapon = item;
    }
  }

  // 3. Calculate derived stats
  const maxHp = calculateMaxHp(stamina, classDef.classBaseHp);
  const maxMana = classDef.resourceType === "mana"
    ? calculateMaxMana(intellect, classDef.classBaseMana)
    : 0; // Non-mana classes have 0 mana
  const attackPower = calculateAttackPower(strength, agility, classDef.id);
  const spellPower = calculateSpellPower(intellect, gearSpellPower);

  // Convert ratings to percentages
  const critChance = ratingToPercentage(critRating, "critRating");
  const hitChance = 100 - ratingToPercentage(hitRating, "hitRating"); // Hit reduces miss chance
  const hastePercent = ratingToPercentage(hasteRating, "hasteRating");
  const dodgeChance = ratingToPercentage(dodgeRating, "dodgeRating");
  const parryChance = ratingToPercentage(parryRating, "parryRating");
  const blockChance = ratingToPercentage(blockRating, "blockRating");
  const defenseSkill = ratingToPercentage(defenseRating, "defenseRating");

  // Extract weapon damage stats
  const weaponDamageMin = mainHandWeapon?.weaponDamageMin ?? 1;
  const weaponDamageMax = mainHandWeapon?.weaponDamageMax ?? 2;
  const weaponSpeed = mainHandWeapon?.weaponSpeed ?? 2.0;
  const offhandDamageMin = offHandWeapon?.weaponDamageMin;
  const offhandDamageMax = offHandWeapon?.weaponDamageMax;
  const offhandSpeed = offHandWeapon?.weaponSpeed;

  const effectiveStats: EffectiveStats = {
    strength,
    agility,
    intellect,
    stamina,
    spirit,
    maxHp,
    maxMana,
    attackPower,
    spellPower,
    armor,
    critChance,
    hitChance,
    hastePercent,
    dodgeChance,
    parryChance,
    blockChance,
    blockValue,
    defenseSkill,
    resilience,
    mp5,
    weaponDamageMin,
    weaponDamageMax,
    weaponSpeed,
    offhandDamageMin,
    offhandDamageMax,
    offhandSpeed,
  };

  // 4. Map abilities to AbilityInstance[]
  const abilityInstances: AbilityInstance[] = abilities.map((abilityDef) =>
    mapAbilityToInstance(abilityDef)
  );

  // 5. Build rotation from aiPriority ordering (higher priority = cast first)
  const rotation: RotationEntry[] = abilities
    .map((abilityDef) => ({
      abilityId: abilityDef.id,
      priority: abilityDef.aiPriority,
      condition: parseAiCondition(abilityDef.aiCondition),
    }))
    .sort((a, b) => a.priority - b.priority); // Lower priority number = higher actual priority

  // 6. Set up resource state
  const resources: ResourceState = {
    type: classDef.resourceType,
    current: classDef.resourceType === "mana" ? maxMana : 0,
    max: classDef.resourceType === "mana" ? maxMana : getMaxResourceForType(classDef.resourceType),
  };

  // 7. Build equipment summary
  const equipment: EquipmentSummary = {
    weaponSpeed,
    weaponDps: mainHandWeapon
      ? ((mainHandWeapon.weaponDamageMin + mainHandWeapon.weaponDamageMax) / 2) / weaponSpeed
      : 0,
    offhandSpeed,
    offhandDps: offHandWeapon
      ? ((offHandWeapon.weaponDamageMin! + offHandWeapon.weaponDamageMax!) / 2) / offhandSpeed!
      : undefined,
  };

  // 8. Determine role from spec
  const role = determineRoleFromSpec(character.activeSpec);

  return {
    id: character.id,
    name: character.name,
    entityType: "player",
    role,
    classId: classDef.id,
    specId: character.activeSpec,
    level,
    effectiveStats,
    abilities: abilityInstances,
    rotation,
    resources,
    equipment,
  };
}

/**
 * Build a CombatEntity from a mob definition.
 *
 * @param mob - The mob definition
 * @returns A combat-ready CombatEntity
 */
export function buildMobEntity(mob: MobDefinition): CombatEntity {
  // 1. Map mob stats directly to EffectiveStats
  const effectiveStats: EffectiveStats = {
    strength: 0, // Mobs don't use attribute stats
    agility: 0,
    intellect: 0,
    stamina: 0,
    spirit: 0,
    maxHp: mob.health,
    maxMana: mob.mana ?? 0,
    attackPower: (mob.meleeDamageMin + mob.meleeDamageMax) / 2, // Approximate
    spellPower: 0,
    armor: mob.armor,
    critChance: 5, // Base 5% crit for mobs
    hitChance: 95, // Base 95% hit for mobs
    hastePercent: 0,
    dodgeChance: 0,
    parryChance: 0,
    blockChance: 0,
    blockValue: 0,
    defenseSkill: 0,
    resilience: 0,
    mp5: 0,
    weaponDamageMin: mob.meleeDamageMin,
    weaponDamageMax: mob.meleeDamageMax,
    weaponSpeed: mob.attackSpeed,
  };

  // 2. Map MobAbility[] to AbilityInstance[]
  const abilityInstances: AbilityInstance[] = mob.abilities.map((mobAbility) =>
    mapMobAbilityToInstance(mobAbility)
  );

  // 3. Build simple priority rotation (abilities ordered by cooldown — shorter cooldown = higher priority)
  const rotation: RotationEntry[] = mob.abilities
    .map((mobAbility, index) => ({
      abilityId: mobAbility.id as AbilityId,
      priority: mobAbility.cooldown > 0 ? mobAbility.cooldown : 100 + index, // Instant abilities get lower priority
      condition: { type: "always" as const },
    }))
    .sort((a, b) => a.priority - b.priority);

  // 4. Set up resource state (mobs use mana if they have it, otherwise rage)
  const resourceType: ResourceType = mob.mana !== undefined && mob.mana > 0 ? "mana" : "rage";
  const resources: ResourceState = {
    type: resourceType,
    current: resourceType === "mana" ? mob.mana ?? 0 : 0,
    max: resourceType === "mana" ? mob.mana ?? 0 : 100,
  };

  // 5. Build equipment summary from mob melee stats
  const equipment: EquipmentSummary = {
    weaponSpeed: mob.attackSpeed,
    weaponDps: (mob.meleeDamageMin + mob.meleeDamageMax) / 2 / mob.attackSpeed,
  };

  // 6. Determine role (bosses are usually DPS, but could be tank role for certain mechanics)
  const role = mob.isBoss ? "dps" : "dps"; // All mobs default to DPS for now

  return {
    id: 0, // Will be assigned by combat engine
    name: mob.name,
    entityType: "enemy",
    role,
    classId: "mob",
    specId: mob.id,
    level: mob.level,
    effectiveStats,
    abilities: abilityInstances,
    rotation,
    resources,
    equipment,
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Map an AbilityDefinition to an AbilityInstance.
 */
function mapAbilityToInstance(abilityDef: AbilityDefinition): AbilityInstance {
  // Find the primary damage/healing effect
  const damageEffect = abilityDef.effects.find((e) => e.type === "damage");
  const healingEffect = abilityDef.effects.find((e) => e.type === "heal");

  return {
    id: abilityDef.id,
    name: abilityDef.name,
    resourceCost: abilityDef.resourceCost,
    resourceType: abilityDef.resourceType,
    cooldownMs: abilityDef.cooldown * 1000,
    castTimeMs: abilityDef.castTime * 1000,
    coefficient: damageEffect?.coefficient ?? healingEffect?.coefficient ?? 0,
    baseDamage: damageEffect
      ? (damageEffect.baseDamageMin! + damageEffect.baseDamageMax!) / 2
      : undefined,
    baseHealing: healingEffect
      ? (healingEffect.baseDamageMin! + healingEffect.baseDamageMax!) / 2
      : undefined,
    damageType: damageEffect?.damageType,
    maxTargets: abilityDef.maxTargets,
    isAoE: abilityDef.targetType === "aoe_ground" || abilityDef.targetType === "aoe_self" || abilityDef.targetType === "cone",
  };
}

/**
 * Map a MobAbility to an AbilityInstance.
 */
function mapMobAbilityToInstance(mobAbility: MobAbility): AbilityInstance {
  return {
    id: mobAbility.id as AbilityId,
    name: mobAbility.name,
    resourceCost: 0,
    resourceType: "rage" as ResourceType,
    cooldownMs: mobAbility.cooldown * 1000,
    castTimeMs: mobAbility.castTime * 1000,
    coefficient: 0,
    baseDamage: mobAbility.damage,
    damageType: mobAbility.damageType,
    isAoE: mobAbility.targetType === "all" || mobAbility.targetType === "cone_frontal" || mobAbility.targetType === "aoe_ground",
  };
}

/**
 * Parse AI condition string into RotationCondition.
 * For now, returns always condition. Full parsing can be added later.
 */
function parseAiCondition(condition?: string) {
  if (!condition) return { type: "always" as const };
  // Future: Parse conditions like "hp_below_50", "cooldown_ready", etc.
  return { type: "always" as const };
}

/**
 * Get max resource value for a given resource type.
 */
function getMaxResourceForType(resourceType: ResourceType): number {
  switch (resourceType) {
    case "mana":
      return 0; // Will be calculated from intellect
    case "rage":
      return 100;
    case "energy":
      return 100;
    case "focus":
      return 100;
    case "runic_power":
      return 100;
    default:
      return 100;
  }
}

/**
 * Determine role from spec ID.
 * This is a simplified mapping; full logic can use talent tree definitions.
 */
function determineRoleFromSpec(specId: string): "tank" | "healer" | "dps" {
  // Tank specs
  if (specId === "protection" || specId === "feral") return "tank";
  // Healer specs
  if (specId === "holy" || specId === "discipline" || specId === "restoration_druid" || specId === "restoration_shaman") {
    return "healer";
  }
  // Everything else is DPS
  return "dps";
}
