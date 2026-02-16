// tests/game/data/schemas/item.schema.test.ts

import { describe, it, expect } from "vitest";
import { itemDefinitionSchema } from "@game/data/schemas/item.schema";
import { QualityTier, GearSlot, WeaponType } from "@shared/enums";

describe("item.schema", () => {
  const validWeapon = {
    id: "item_iron_shortsword",
    name: "Iron Shortsword",
    quality: QualityTier.Uncommon,
    itemLevel: 4,
    requiredLevel: 3,
    description: "A well-forged blade taken from a fallen bandit scout.",
    icon: { char: "I", fg: 10, bg: 0 },
    slot: GearSlot.MainHand,
    weaponType: WeaponType.Sword1H,
    stats: { strength: 2, stamina: 1 },
    weaponDamageMin: 5,
    weaponDamageMax: 10,
    weaponSpeed: 2.5,
    bindOnPickup: false,
    bindOnEquip: false,
    unique: false,
    stackSize: 1,
    vendorSellPrice: 200,
    sources: [{ type: "quest_reward" as const, sourceId: "quest_bandit_scouts" }],
  };

  it("should validate a complete weapon item", () => {
    expect(() => itemDefinitionSchema.parse(validWeapon)).not.toThrow();
  });

  it("should reject invalid quality tier", () => {
    const invalid = { ...validWeapon, quality: "mythic" };
    expect(() => itemDefinitionSchema.parse(invalid)).toThrow();
  });

  it("should reject invalid slot", () => {
    const invalid = { ...validWeapon, slot: "pants" };
    expect(() => itemDefinitionSchema.parse(invalid)).toThrow();
  });

  it("should validate a weapon with damage fields", () => {
    const result = itemDefinitionSchema.parse(validWeapon);
    expect(result.weaponDamageMin).toBe(5);
    expect(result.weaponDamageMax).toBe(10);
    expect(result.weaponSpeed).toBe(2.5);
    expect(result.weaponType).toBe(WeaponType.Sword1H);
  });

  it("should validate an armor item with armorValue", () => {
    const armorItem = {
      id: "item_wolf_hide_vest",
      name: "Wolf Hide Vest",
      quality: QualityTier.Common,
      itemLevel: 3,
      requiredLevel: 2,
      description: "Crude but warm.",
      icon: { char: "W", fg: 15, bg: 0 },
      slot: GearSlot.Chest,
      armorType: "leather",
      stats: { agility: 2, stamina: 1 },
      armorValue: 15,
      bindOnPickup: false,
      bindOnEquip: false,
      unique: false,
      stackSize: 1,
      vendorSellPrice: 75,
      sources: [{ type: "quest_reward" as const, sourceId: "quest_wolf_menace" }],
    };
    const result = itemDefinitionSchema.parse(armorItem);
    expect(result.armorValue).toBe(15);
    expect(result.armorType).toBe("leather");
  });

  it("should validate optional fields (sockets, setId)", () => {
    const itemWithOptionals = {
      ...validWeapon,
      sockets: ["red", "blue"] as const,
      socketBonus: { strength: 4 },
      setId: "set_blackthorn",
    };
    const result = itemDefinitionSchema.parse(itemWithOptionals);
    expect(result.sockets).toEqual(["red", "blue"]);
    expect(result.socketBonus).toEqual({ strength: 4 });
    expect(result.setId).toBe("set_blackthorn");
  });
});
