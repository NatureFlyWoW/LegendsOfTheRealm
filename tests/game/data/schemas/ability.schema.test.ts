import { describe, it, expect } from "vitest";
import { abilityDefinitionSchema } from "@game/data/schemas/ability.schema";
import { ClassName, ResourceType, DamageType } from "@shared/enums";

describe("ability.schema", () => {
  const validAbility = {
    id: "warrior_heroic_strike",
    name: "Heroic Strike",
    className: ClassName.Warrior,
    spec: null,
    description: "A powerful melee strike.",
    icon: { char: "!", fg: 9, bg: 0 },
    castTime: 0,
    cooldown: 0,
    globalCooldown: true,
    channeled: false,
    resourceCost: 15,
    resourceType: ResourceType.Rage,
    targetType: "enemy",
    range: 5,
    effects: [{
      type: "damage",
      damageType: DamageType.Physical,
      baseDamageMin: 10,
      baseDamageMax: 14,
      coefficient: 1.0,
      scalingStat: "attack_power",
    }],
    aiPriority: 1,
  };

  it("validates a complete ability definition", () => {
    expect(() => abilityDefinitionSchema.parse(validAbility)).not.toThrow();
  });

  it("rejects invalid className", () => {
    expect(() => abilityDefinitionSchema.parse({ ...validAbility, className: "invalid" })).toThrow();
  });

  it("rejects invalid resourceType", () => {
    expect(() => abilityDefinitionSchema.parse({ ...validAbility, resourceType: "invalid" })).toThrow();
  });

  it("rejects missing effects array", () => {
    const { effects, ...noEffects } = validAbility;
    expect(() => abilityDefinitionSchema.parse(noEffects)).toThrow();
  });

  it("validates ability with optional fields", () => {
    const withOptionals = { ...validAbility, aoeRadius: 10, maxTargets: 5, aiCondition: "self_resource_above:50", channelDuration: 3 };
    expect(() => abilityDefinitionSchema.parse(withOptionals)).not.toThrow();
  });

  it("allows spec to be null for base class abilities", () => {
    const result = abilityDefinitionSchema.parse(validAbility);
    expect(result.spec).toBeNull();
  });

  it("validates spec when provided", () => {
    const withSpec = { ...validAbility, spec: "protection" };
    expect(() => abilityDefinitionSchema.parse(withSpec)).not.toThrow();
  });
});
