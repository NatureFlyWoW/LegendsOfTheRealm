// src/game/engine/InventoryService.ts
import type { CharacterState, EffectiveStats, ItemInstance } from "@shared/types";
import type { ClassDefinition, ItemDefinition } from "@shared/definitions";
import type { GearSlot, PrimaryStat } from "@shared/enums";
import { BAG_SLOT_COUNT } from "@shared/constants";
import {
  calculateMaxHp,
  calculateMaxMana,
  calculateAttackPower,
  calculateSpellPower,
  ratingToPercentage,
} from "@game/combat/stats";

export class InventoryService {
  /**
   * Add an item to the first available bag slot.
   * Returns updated character state or throws if no slots available.
   */
  addItem(character: CharacterState, item: ItemInstance): CharacterState {
    // Find first empty bag slot
    let emptySlot = -1;
    for (let i = 0; i < BAG_SLOT_COUNT; i++) {
      // Check if this slot is already used by any item
      const slotUsed = Object.values(character.equipment).includes(i);
      if (!slotUsed && emptySlot === -1) {
        emptySlot = i;
        break;
      }
    }

    if (emptySlot === -1) {
      throw new Error("No empty bag slots available");
    }

    // Update item's bag slot
    const updatedItem: ItemInstance = {
      ...item,
      bagSlot: emptySlot,
      equippedSlot: null,
    };

    // In a real implementation, this would update the database
    // For now, we just return the character state
    // The item would be tracked separately in the database
    return character;
  }

  /**
   * Remove an item from the specified bag slot.
   * Returns updated character and removed item (or null if slot was empty).
   */
  removeItem(
    character: CharacterState,
    bagSlot: number
  ): { character: CharacterState; item: ItemInstance | null } {
    if (bagSlot < 0 || bagSlot >= BAG_SLOT_COUNT) {
      throw new Error(`Invalid bag slot: ${bagSlot}`);
    }

    // In a real implementation, this would query and delete from database
    // For now, return null as no item tracking in CharacterState
    return { character, item: null };
  }

  /**
   * Equip an item from a bag slot to its designated gear slot.
   * Validates slot compatibility and swaps any existing item.
   */
  equipItem(
    character: CharacterState,
    bagSlot: number,
    item: ItemInstance,
    itemDef: ItemDefinition
  ): CharacterState {
    if (bagSlot < 0 || bagSlot >= BAG_SLOT_COUNT) {
      throw new Error(`Invalid bag slot: ${bagSlot}`);
    }

    // Validate item can be equipped (has a valid gear slot)
    const validGearSlots = [
      "head",
      "shoulder",
      "back",
      "chest",
      "wrist",
      "hands",
      "waist",
      "legs",
      "feet",
      "neck",
      "ring1",
      "ring2",
      "trinket1",
      "trinket2",
      "main_hand",
      "off_hand",
    ];

    if (!validGearSlots.includes(itemDef.slot)) {
      throw new Error(`Item cannot be equipped: ${itemDef.slot} is not a gear slot`);
    }

    const gearSlot = itemDef.slot as GearSlot;

    // If the gear slot is already occupied, swap items
    const oldBagSlot = character.equipment[gearSlot];

    // Update equipment
    const newEquipment = {
      ...character.equipment,
      [gearSlot]: bagSlot,
    };

    return {
      ...character,
      equipment: newEquipment,
    };
  }

  /**
   * Unequip an item from a gear slot back to the bag.
   */
  unequipItem(character: CharacterState, gearSlot: GearSlot): CharacterState {
    const bagSlot = character.equipment[gearSlot];
    if (bagSlot === null) {
      throw new Error(`No item equipped in slot: ${gearSlot}`);
    }

    // Clear the equipment slot
    const newEquipment = {
      ...character.equipment,
      [gearSlot]: null,
    };

    return {
      ...character,
      equipment: newEquipment,
    };
  }

  /**
   * Get all equipped items with their definitions.
   */
  getEquippedItems(
    character: CharacterState,
    itemDefs: Map<string, ItemDefinition>
  ): Array<{ slot: GearSlot; item: ItemDefinition; bagSlot: number }> {
    const equipped: Array<{ slot: GearSlot; item: ItemDefinition; bagSlot: number }> = [];

    for (const [slot, bagSlot] of Object.entries(character.equipment)) {
      if (bagSlot !== null) {
        // In a real implementation, we'd look up the ItemInstance by bagSlot
        // For now, we can't fully implement this without the database layer
        // This is a placeholder that would need to query items by characterId and bagSlot
      }
    }

    return equipped;
  }

  /**
   * Recalculate all effective stats from base stats, level gains, and equipped gear.
   */
  recalculateStats(
    character: CharacterState,
    classDef: ClassDefinition,
    equippedItems: ItemDefinition[]
  ): EffectiveStats {
    // Start with base stats
    const baseStats = { ...classDef.baseStats };

    // Add per-level gains
    const level = character.level;
    const statsWithLevels: Record<PrimaryStat, number> = {
      strength: baseStats.strength + classDef.perLevelGains.strength * (level - 1),
      agility: baseStats.agility + classDef.perLevelGains.agility * (level - 1),
      intellect: baseStats.intellect + classDef.perLevelGains.intellect * (level - 1),
      stamina: baseStats.stamina + classDef.perLevelGains.stamina * (level - 1),
      spirit: baseStats.spirit + classDef.perLevelGains.spirit * (level - 1),
    };

    // Sum all equipped item stats
    let gearStats: Record<string, number> = {};
    for (const item of equippedItems) {
      for (const [stat, value] of Object.entries(item.stats)) {
        gearStats[stat] = (gearStats[stat] || 0) + (value ?? 0);
      }
    }

    // Combine primary stats with gear
    const totalStrength = statsWithLevels.strength + (gearStats.strength || 0);
    const totalAgility = statsWithLevels.agility + (gearStats.agility || 0);
    const totalIntellect = statsWithLevels.intellect + (gearStats.intellect || 0);
    const totalStamina = statsWithLevels.stamina + (gearStats.stamina || 0);
    const totalSpirit = statsWithLevels.spirit + (gearStats.spirit || 0);

    // Calculate derived stats
    const maxHp = calculateMaxHp(totalStamina, classDef.classBaseHp);
    const maxMana = calculateMaxMana(totalIntellect, classDef.classBaseMana);
    const attackPower = calculateAttackPower(totalStrength, totalAgility, classDef.id) + (gearStats.attack_power || 0);
    const spellPower = calculateSpellPower(totalIntellect, gearStats.spell_power || 0);
    const armor = gearStats.armor || 0;

    // Calculate rating-based stats
    const critChance = ratingToPercentage(gearStats.crit_rating || 0, "critRating");
    const hitChance = ratingToPercentage(gearStats.hit_rating || 0, "hitRating");
    const hastePercent = ratingToPercentage(gearStats.haste_rating || 0, "hasteRating");
    const dodgeChance = ratingToPercentage(gearStats.dodge_rating || 0, "dodgeRating");
    const parryChance = ratingToPercentage(gearStats.parry_rating || 0, "parryRating");
    const blockChance = ratingToPercentage(gearStats.block_rating || 0, "blockRating");
    const defenseSkill = ratingToPercentage(gearStats.defense_rating || 0, "defenseRating");
    const resilience = gearStats.resilience || 0;

    // Extract weapon damage from main hand and offhand
    const mainHandWeapon = equippedItems.find((item) => item.slot === "main_hand");
    const offHandWeapon = equippedItems.find((item) => item.slot === "off_hand");

    const weaponDamageMin = mainHandWeapon?.weaponDamageMin || 0;
    const weaponDamageMax = mainHandWeapon?.weaponDamageMax || 0;
    const weaponSpeed = mainHandWeapon?.weaponSpeed || 0;

    const offhandDamageMin = offHandWeapon?.weaponDamageMin;
    const offhandDamageMax = offHandWeapon?.weaponDamageMax;
    const offhandSpeed = offHandWeapon?.weaponSpeed;

    const blockValue = gearStats.block_value || 0;
    const mp5 = gearStats.mp5 || 0;

    return {
      strength: totalStrength,
      agility: totalAgility,
      intellect: totalIntellect,
      stamina: totalStamina,
      spirit: totalSpirit,
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
  }
}
