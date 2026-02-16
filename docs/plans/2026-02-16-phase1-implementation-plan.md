# Phase 1: Domain Foundations — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundational layer of all 4 game domains (Engine, Combat, Data, UI) independently, with no cross-domain integration.

**Architecture:** Prerequisites install dependencies and add missing shared types. Then 4 parallel tracks build each domain's foundation: Engine (Electron + SQLite + RNG + tick loop), Combat (pure math functions), Data (Zod schemas + JSON files), UI (Canvas ASCII renderer + Tailwind shell). Each track uses test fixtures, not real cross-domain data.

**Tech Stack:** Electron 27+ via electron-vite, TypeScript 5+, better-sqlite3 + Kysely, React 18 + Zustand, Tailwind CSS, Zod, Vitest, HTML5 Canvas

**Design doc:** `docs/plans/2026-02-16-phase1-domain-foundations-design.md`

**Parallel execution note:** Tasks 1-4 are sequential prerequisites. After Task 4, Tracks A/B/C/D are fully independent and can execute in parallel (use `superpowers:dispatching-parallel-agents` or `superpowers:subagent-driven-development`).

---

## Prerequisites (Tasks 1-4, Sequential)

### Task 1: Add Missing Enums (WeaponType, ArmorType, TalentSpec)

**Files:**
- Modify: `src/shared/enums.ts`
- Create: `tests/shared/enums-extended.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/shared/enums-extended.test.ts
import { describe, test, expect } from "vitest";
import { WeaponType, ArmorType, TalentSpec } from "@shared/enums";

describe("WeaponType enum", () => {
  test("has 13 weapon types", () => {
    expect(Object.values(WeaponType)).toHaveLength(13);
  });

  test("includes all expected weapon types", () => {
    expect(WeaponType.Sword1H).toBe("sword_1h");
    expect(WeaponType.Sword2H).toBe("sword_2h");
    expect(WeaponType.Dagger).toBe("dagger");
    expect(WeaponType.Staff).toBe("staff");
    expect(WeaponType.Bow).toBe("bow");
    expect(WeaponType.Shield).toBe("shield");
    expect(WeaponType.Wand).toBe("wand");
  });
});

describe("ArmorType enum", () => {
  test("has 4 armor types", () => {
    expect(Object.values(ArmorType)).toHaveLength(4);
  });

  test("includes cloth through plate", () => {
    expect(ArmorType.Cloth).toBe("cloth");
    expect(ArmorType.Leather).toBe("leather");
    expect(ArmorType.Mail).toBe("mail");
    expect(ArmorType.Plate).toBe("plate");
  });
});

describe("TalentSpec enum", () => {
  test("has exactly 24 specs (3 per class x 8 classes)", () => {
    expect(Object.values(TalentSpec)).toHaveLength(24);
  });

  test("includes warrior specs", () => {
    expect(TalentSpec.Protection).toBe("protection");
    expect(TalentSpec.Arms).toBe("arms");
    expect(TalentSpec.Fury).toBe("fury");
  });

  test("includes mage specs", () => {
    expect(TalentSpec.FireMage).toBe("fire");
    expect(TalentSpec.FrostMage).toBe("frost");
    expect(TalentSpec.ArcaneMage).toBe("arcane");
  });

  test("includes cleric specs", () => {
    expect(TalentSpec.Holy).toBe("holy");
    expect(TalentSpec.Discipline).toBe("discipline");
    expect(TalentSpec.Retribution).toBe("retribution");
  });

  test("includes rogue specs", () => {
    expect(TalentSpec.Assassination).toBe("assassination");
    expect(TalentSpec.Combat).toBe("combat");
    expect(TalentSpec.Subtlety).toBe("subtlety");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/enums-extended.test.ts
```

Expected: FAIL — `WeaponType`, `ArmorType`, `TalentSpec` not exported.

**Step 3: Add the enums to `src/shared/enums.ts`**

Append the following after the existing `TalentEffectType`:

```typescript
// ---------------------------------------------------------------------------
// Weapon Types
// ---------------------------------------------------------------------------

export enum WeaponType {
  Sword1H = "sword_1h",
  Sword2H = "sword_2h",
  Mace1H = "mace_1h",
  Mace2H = "mace_2h",
  Axe1H = "axe_1h",
  Axe2H = "axe_2h",
  Dagger = "dagger",
  Staff = "staff",
  Polearm = "polearm",
  Wand = "wand",
  Bow = "bow",
  Shield = "shield",
  OffhandFrill = "offhand_frill",
}

// ---------------------------------------------------------------------------
// Armor Types
// ---------------------------------------------------------------------------

export enum ArmorType {
  Cloth = "cloth",
  Leather = "leather",
  Mail = "mail",
  Plate = "plate",
}

// ---------------------------------------------------------------------------
// Talent Specs — 24 specs (3 per class)
// Some specs share names across classes, so we suffix with class name
// where ambiguous (Fire for Mage vs Fire damage type, etc.)
// ---------------------------------------------------------------------------

export enum TalentSpec {
  // Warrior
  Protection = "protection",
  Arms = "arms",
  Fury = "fury",
  // Mage
  FireMage = "fire",
  FrostMage = "frost",
  ArcaneMage = "arcane",
  // Cleric
  Holy = "holy",
  Discipline = "discipline",
  Retribution = "retribution",
  // Rogue
  Assassination = "assassination",
  Combat = "combat",
  Subtlety = "subtlety",
  // Ranger
  Marksmanship = "marksmanship",
  BeastMastery = "beast_mastery",
  Survival = "survival",
  // Druid
  RestorationDruid = "restoration_druid",
  Feral = "feral",
  Balance = "balance",
  // Necromancer
  Affliction = "affliction",
  Demonology = "demonology",
  Destruction = "destruction",
  // Shaman
  Elemental = "elemental",
  Enhancement = "enhancement",
  RestorationShaman = "restoration_shaman",
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/enums-extended.test.ts
```

Expected: PASS.

**Step 5: Run all existing tests to verify no regressions**

```bash
npx vitest run
```

Expected: All tests pass (68 existing + new tests).

**Step 6: Commit**

```bash
git add src/shared/enums.ts tests/shared/enums-extended.test.ts
git commit -m "feat: add WeaponType, ArmorType, TalentSpec enums to shared"
```

---

### Task 2: Add Data Definition Types

**Files:**
- Create: `src/shared/definitions.ts`
- Modify: `src/shared/index.ts` (add export)
- Create: `tests/shared/definitions.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/shared/definitions.test.ts
import { describe, test, expect } from "vitest";
import type {
  RaceDefinition, ClassDefinition, StatFormulas,
  AbilityDefinition, TalentNode, TalentTree,
  ItemDefinition, ZoneDefinition, MobDefinition,
} from "@shared/definitions";

describe("Definition type structure", () => {
  test("RaceDefinition has correct shape", () => {
    const race: RaceDefinition = {
      id: "human" as any,
      name: "Human",
      lore: "Versatile folk",
      primaryBonus: { stat: "xp_gain", value: 0.05, isPercentage: true },
      secondaryBonus: { stat: "spirit", value: 0.03, isPercentage: true },
      professionBonuses: [],
      icon: { char: "@", fg: 7, bg: 0 },
    };
    expect(race.id).toBe("human");
    expect(race.primaryBonus.value).toBe(0.05);
  });

  test("ClassDefinition has 3 specs", () => {
    const cls: ClassDefinition = {
      id: "warrior" as any,
      name: "Warrior",
      description: "A mighty fighter",
      resourceType: "rage" as any,
      armorProficiency: ["plate" as any],
      weaponProficiency: ["sword_1h" as any],
      baseStats: { strength: 25, agility: 15, intellect: 8, stamina: 22, spirit: 10 },
      perLevelGains: { strength: 2.5, agility: 1.0, intellect: 0.5, stamina: 2.0, spirit: 0.5 },
      classBaseHp: 100,
      classBaseMana: 0,
      specs: ["protection" as any, "arms" as any, "fury" as any],
    };
    expect(cls.specs).toHaveLength(3);
    expect(cls.baseStats.strength).toBe(25);
  });

  test("ItemDefinition has stat budget fields", () => {
    const item: ItemDefinition = {
      id: "iron_sword" as any,
      name: "Iron Sword",
      quality: "common" as any,
      itemLevel: 10,
      requiredLevel: 5,
      description: "A basic sword",
      icon: { char: "/", fg: 7, bg: 0 },
      slot: "main_hand" as any,
      stats: {},
      bindOnPickup: false,
      bindOnEquip: true,
      unique: false,
      stackSize: 1,
      vendorSellPrice: 500,
      sources: [],
    };
    expect(item.itemLevel).toBe(10);
    expect(item.vendorSellPrice).toBe(500);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/definitions.test.ts
```

Expected: FAIL — module `@shared/definitions` not found.

**Step 3: Create `src/shared/definitions.ts`**

```typescript
// src/shared/definitions.ts
// Data definition types — shapes of JSON content files consumed by all domains.
// These describe static game content (templates), not runtime state (instances).

import type {
  ClassName, RaceName, QualityTier, GearSlot, ResourceType,
  CompanionQuality, PrimaryStat, DamageType,
  WeaponType, ArmorType, TalentSpec,
  AbilityEffectType, TalentEffectType,
} from "./enums";
import type {
  ItemId, QuestId, ZoneId, DungeonId, RaidId,
  AbilityId, TalentId, MobId, LootTableId, RecipeId,
  BossId, AchievementId, AsciiIcon,
} from "./types";

// ============================================================
// Race Definition
// ============================================================

export interface RacialBonus {
  stat: PrimaryStat | "xp_gain" | "crit_chance" | "dodge_chance" | "melee_damage" | "shadow_resist" | "regen";
  value: number;
  isPercentage: boolean;
}

export interface RaceDefinition {
  id: RaceName;
  name: string;
  lore: string;
  primaryBonus: RacialBonus;
  secondaryBonus: RacialBonus;
  professionBonuses: Array<{ profession: string; value: number }>;
  icon: AsciiIcon;
}

// ============================================================
// Class Definition
// ============================================================

export interface ClassDefinition {
  id: ClassName;
  name: string;
  description: string;
  resourceType: ResourceType;
  armorProficiency: ArmorType[];
  weaponProficiency: WeaponType[];
  baseStats: Record<PrimaryStat, number>;
  perLevelGains: Record<PrimaryStat, number>;
  classBaseHp: number;
  classBaseMana: number;
  specs: [TalentSpec, TalentSpec, TalentSpec];
}

// ============================================================
// Stat Formulas
// ============================================================

export interface RatingConversion {
  stat: string;
  ratingPerPercent: number;
}

export interface StatCap {
  stat: string;
  softCap?: number;
  hardCap?: number;
  description: string;
}

export interface StatFormulas {
  health: { staminaMultiplier: number };
  mana: { intellectMultiplier: number };
  armorReduction: { constantBase: number; levelMultiplier: number };
  critChance: { agilityDivisor: number; intDivisor: number; baseCritSuppression: number };
  dodge: { agilityDivisor: number; diminishingReturnThreshold: number };
  parry: { basePercent: number };
  block: { basePercent: number; strengthDivisor: number };
  ratingConversions: RatingConversion[];
  caps: StatCap[];
}

// ============================================================
// Ability Definition
// ============================================================

export interface AbilityEffect {
  type: AbilityEffectType;
  damageType?: DamageType;
  baseDamageMin?: number;
  baseDamageMax?: number;
  coefficient: number;
  scalingStat: PrimaryStat | "attack_power" | "spell_power" | "weapon_dps";
  duration?: number;
  tickInterval?: number;
  stacks?: number;
  threatMultiplier?: number;
  dispellable?: boolean;
  procChance?: number;
}

export interface AbilityDefinition {
  id: AbilityId;
  name: string;
  className: ClassName;
  spec: TalentSpec | null;
  description: string;
  icon: AsciiIcon;
  castTime: number;
  cooldown: number;
  globalCooldown: boolean;
  channeled: boolean;
  channelDuration?: number;
  resourceCost: number;
  resourceType: ResourceType;
  targetType: "self" | "enemy" | "friendly" | "aoe_ground" | "aoe_self" | "cone";
  range: number;
  aoeRadius?: number;
  maxTargets?: number;
  effects: AbilityEffect[];
  aiPriority: number;
  aiCondition?: string;
}

// ============================================================
// Talent Definitions
// ============================================================

export interface TalentEffect {
  type: TalentEffectType;
  stat?: string;
  value: number;
  isPercentage: boolean;
  affectedAbility?: AbilityId;
  description: string;
}

export interface TalentNode {
  id: TalentId;
  name: string;
  description: string;
  maxRanks: number;
  tier: number;
  position: number;
  prerequisites: TalentId[];
  tierPointRequirement: number;
  perRankEffects: TalentEffect[];
  grantsAbility?: AbilityId;
}

export interface TalentTree {
  id: string;
  className: ClassName;
  spec: TalentSpec;
  name: string;
  description: string;
  role: "tank" | "melee_dps" | "ranged_dps" | "healer";
  iconChar: string;
  nodes: TalentNode[];
  totalPossiblePoints: number;
  capstoneNodeId: TalentId;
}

// ============================================================
// Item Definition
// ============================================================

export interface ItemSource {
  type: "boss_drop" | "world_drop" | "quest_reward" | "vendor" | "crafted"
      | "rare_spawn" | "fishing" | "gathering" | "achievement" | "reputation";
  sourceId: string;
  dropRate?: number;
  context?: string;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  quality: QualityTier;
  itemLevel: number;
  requiredLevel: number;
  description: string;
  icon: AsciiIcon;
  slot: GearSlot | "bag" | "consumable" | "material" | "quest" | "recipe" | "gem" | "mount";
  armorType?: ArmorType;
  weaponType?: WeaponType;
  stats: Partial<Record<string, number>>;
  weaponDamageMin?: number;
  weaponDamageMax?: number;
  weaponSpeed?: number;
  armorValue?: number;
  blockValue?: number;
  sockets?: Array<"red" | "yellow" | "blue" | "meta">;
  socketBonus?: Partial<Record<string, number>>;
  setId?: string;
  bindOnPickup: boolean;
  bindOnEquip: boolean;
  unique: boolean;
  stackSize: number;
  vendorSellPrice: number;
  bagSlots?: number;
  sources: ItemSource[];
}

// ============================================================
// Zone Definition
// ============================================================

export interface ZoneDefinition {
  id: ZoneId;
  name: string;
  levelRange: { min: number; max: number };
  theme: string;
  loreDescription: string;
  mobIds: MobId[];
  questIds: QuestId[];
  dungeonUnlock?: DungeonId;
  gatheringNodes: Array<{
    profession: string;
    nodeType: string;
    skillRange: { min: number; max: number };
    spawnRate: number;
    loot: LootTableId;
  }>;
  rareSpawns: Array<{ mobId: MobId; respawnHoursMin: number; respawnHoursMax: number }>;
  worldDropTable: LootTableId;
  breadcrumbQuestTo?: ZoneId;
}

// ============================================================
// Mob Definition
// ============================================================

export interface MobAbility {
  id: string;
  name: string;
  damageType: DamageType;
  castTime: number;
  cooldown: number;
  damage: number;
  targetType: "tank" | "random" | "all" | "cone_frontal" | "aoe_ground" | "self";
}

export interface MobDefinition {
  id: MobId;
  name: string;
  level: number;
  isElite: boolean;
  isBoss: boolean;
  isRareSpawn: boolean;
  health: number;
  mana?: number;
  armor: number;
  meleeDamageMin: number;
  meleeDamageMax: number;
  attackSpeed: number;
  abilities: MobAbility[];
  zoneId: ZoneId;
  lootTableId: LootTableId;
  xpReward: number;
  icon: AsciiIcon;
}

// ============================================================
// Dungeon & Raid Definitions
// ============================================================

export interface BossAbilityDef {
  id: string;
  name: string;
  description: string;
  damageType: DamageType;
  castTime: number;
  cooldown: number;
  interruptible: boolean;
  dispellable: boolean;
  damageLeveling: number;
  damageScaled: number;
  targetType: "tank" | "random" | "all" | "cone_frontal" | "aoe_ground" | "self";
  aoeRadius?: number;
  activeInPhases?: number[];
}

export interface BossPhase {
  phaseNumber: number;
  healthThreshold: number;
  description: string;
  addedAbilities: string[];
  removedAbilities?: string[];
}

export interface DungeonBoss {
  bossId: BossId;
  name: string;
  order: number;
  isFinalBoss: boolean;
  healthLeveling: number;
  healthScaled: number;
  abilities: BossAbilityDef[];
  phases: BossPhase[];
  enrageTimer?: number;
  strategyText: string;
  lootTableId: LootTableId;
}

export interface TrashPack {
  id: string;
  mobs: Array<{ mobId: MobId; count: number }>;
  description: string;
}

export interface DungeonDefinition {
  id: DungeonId;
  name: string;
  levelRange: { min: number; max: number };
  zoneId: ZoneId;
  theme: string;
  estimatedClearTimeMinutes: { min: number; max: number };
  unlockQuestId?: QuestId;
  partySize: 5;
  trashPacks: TrashPack[];
  bosses: DungeonBoss[];
  companionThresholds: { veteran: number; elite: number; champion: number };
  lockoutType: "daily";
  completionXp: number;
  completionGold: number;
  recommendedIlvl: number;
}

export interface RaidDefinition {
  id: RaidId;
  name: string;
  tier: number;
  raidSize: 10 | 20;
  bossCount: number;
  requiredIlvl: number;
  theme: string;
  bosses: DungeonBoss[];
  companionThresholds: { veteran: number; elite: number; champion: number };
  lockoutType: "weekly";
}

// ============================================================
// Quest Definition
// ============================================================

export interface QuestObjective {
  type: "kill" | "collect" | "deliver" | "explore" | "interact" | "escort"
      | "survive" | "craft" | "gather" | "fish" | "use_item";
  targetId?: string;
  description: string;
  requiredCount: number;
  dropRate?: number;
  baseRate?: number;
}

export interface QuestDefinition {
  id: QuestId;
  name: string;
  questText: string;
  turnInText: string;
  level: number;
  zoneId: ZoneId;
  prerequisites: QuestId[];
  followUp?: QuestId;
  chainName?: string;
  chainOrder?: number;
  objectives: QuestObjective[];
  rewards: {
    xp: number;
    gold: number;
    choiceItems?: ItemId[];
    guaranteedItems?: ItemId[];
    unlocksContent?: string;
  };
  type: "main_chain" | "side" | "daily" | "profession" | "dungeon_unlock"
      | "legendary" | "hidden" | "breadcrumb";
  repeatable: boolean;
  dailyReset: boolean;
}

// ============================================================
// Profession & Recipe Definitions
// ============================================================

export interface ProfessionDefinition {
  id: string;
  name: string;
  type: "gathering" | "crafting" | "secondary";
  maxSkill: 300;
  skillTiers: Array<{
    name: string;
    skillRange: { min: number; max: number };
    trainerCost: number;
    requiredLevel: number;
  }>;
}

export interface RecipeDefinition {
  id: RecipeId;
  name: string;
  profession: string;
  requiredSkill: number;
  materials: Array<{ itemId: ItemId; quantity: number }>;
  resultItemId: ItemId;
  resultQuantity: number;
  craftTime: number;
  cooldownHours?: number;
  orangeSkill: number;
  yellowSkill: number;
  greenSkill: number;
  greySkill: number;
  source: "trainer" | "drop" | "vendor" | "quest" | "discovery";
}

// ============================================================
// Achievement Definition
// ============================================================

export interface AchievementCondition {
  type: "kill_count" | "level_reached" | "dungeon_clear" | "raid_clear"
      | "profession_skill" | "gold_earned" | "item_collected" | "quest_complete"
      | "boss_kill" | "custom";
  targetId?: string;
  requiredCount: number;
  description: string;
}

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  category: "leveling" | "dungeons_raids" | "professions" | "pve_combat"
           | "collections" | "character" | "meta" | "feats_of_strength";
  points: number;
  hidden: boolean;
  conditions: AchievementCondition[];
  conditionLogic: "all" | "any";
  rewards: {
    gold?: number;
    title?: string;
    mountId?: ItemId;
    itemId?: ItemId;
  };
  isAccountWide: boolean;
}
```

**Step 4: Add export to `src/shared/index.ts`**

Add this line after the existing exports:

```typescript
export * from "./definitions";
```

**Step 5: Run test to verify it passes**

```bash
npx vitest run tests/shared/definitions.test.ts
```

Expected: PASS.

**Step 6: Run full test suite**

```bash
npx vitest run && npx tsc --noEmit
```

Expected: All tests pass, 0 type errors.

**Step 7: Commit**

```bash
git add src/shared/definitions.ts src/shared/index.ts tests/shared/definitions.test.ts
git commit -m "feat: add data definition types for all game content schemas"
```

---

### Task 3: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Electron and build tooling**

```bash
npm install --save-dev electron electron-vite @electron/rebuild
```

**Step 2: Install main process dependencies**

```bash
npm install better-sqlite3 kysely
npm install --save-dev @types/better-sqlite3
```

**Step 3: Install renderer dependencies**

```bash
npm install react react-dom zustand
npm install --save-dev @types/react @types/react-dom tailwindcss @tailwindcss/vite
```

**Step 4: Install data validation**

```bash
npm install zod
```

**Step 5: Install test utilities**

```bash
npm install --save-dev @testing-library/react jsdom
```

**Step 6: Verify installation**

```bash
npx tsc --noEmit
npx vitest run
```

Expected: Existing tests still pass. Type checking still passes.

**Step 7: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Electron, React, SQLite, Zustand, Tailwind, Zod dependencies"
```

---

### Task 4: Set Up electron-vite Build System

**Files:**
- Create: `electron.vite.config.ts`
- Create: `tsconfig.main.json`
- Create: `tsconfig.preload.json`
- Create: `tsconfig.renderer.json`
- Modify: `tsconfig.json` (becomes base config)
- Create: `src/main/main.ts` (minimal placeholder)
- Create: `src/main/preload.ts` (minimal placeholder)
- Create: `src/renderer/index.html`
- Create: `src/renderer/main.tsx` (minimal placeholder)
- Modify: `package.json` (update scripts)

**Step 1: Create `electron.vite.config.ts`**

```typescript
// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@game": resolve("src/game"),
        "@main": resolve("src/main"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@game": resolve("src/game"),
        "@renderer": resolve("src/renderer"),
      },
    },
    plugins: [tailwindcss()],
  },
});
```

**Step 2: Update `tsconfig.json` to be base config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@game/*": ["src/game/*"],
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "out"]
}
```

**Step 3: Create `tsconfig.main.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out/main",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["src/main/**/*.ts", "src/shared/**/*.ts", "src/game/**/*.ts"]
}
```

**Step 4: Create `tsconfig.preload.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out/preload",
    "lib": ["ES2022", "DOM"],
    "types": ["node"]
  },
  "include": ["src/main/preload.ts", "src/shared/**/*.ts"]
}
```

**Step 5: Create `tsconfig.renderer.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out/renderer",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "types": []
  },
  "include": ["src/renderer/**/*.ts", "src/renderer/**/*.tsx", "src/shared/**/*.ts", "src/game/**/*.ts"]
}
```

**Step 6: Create placeholder main process**

```typescript
// src/main/main.ts
import { app, BrowserWindow } from "electron";
import { join } from "path";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

**Step 7: Create placeholder preload**

```typescript
// src/main/preload.ts
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("api", {
  ping: () => "pong",
});
```

**Step 8: Create renderer HTML entry**

```html
<!-- src/renderer/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Legends of the Shattered Realm</title>
</head>
<body class="bg-gray-950 text-gray-100">
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

**Step 9: Create renderer entry**

```tsx
// src/renderer/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-mono text-amber-400">
        Legends of the Shattered Realm
      </h1>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
```

**Step 10: Update package.json scripts**

Add/modify these scripts:

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "main": "./out/main/main.js"
}
```

**Step 11: Verify type checking**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

**Step 12: Verify tests still pass**

```bash
npx vitest run
```

Expected: All existing tests pass.

**Step 13: Commit**

```bash
git add electron.vite.config.ts tsconfig.json tsconfig.main.json tsconfig.preload.json tsconfig.renderer.json src/main/ src/renderer/ package.json
git commit -m "chore: set up electron-vite build system with split tsconfig"
```

---

## Track A: Engine Foundation (Tasks 5-14)

> Can run in parallel with Tracks B, C, D after Task 4.

### Task 5: SeededRng Implementation

**Files:**
- Create: `src/game/rng/SeededRng.ts`
- Create: `tests/game/rng/SeededRng.test.ts`

**Reference:** `src/shared/combat-interfaces.ts:14-28` (ISeededRng interface)

**Step 1: Write the failing test**

```typescript
// tests/game/rng/SeededRng.test.ts
import { describe, test, expect } from "vitest";
import { SeededRng } from "@game/rng/SeededRng";

describe("SeededRng", () => {
  test("implements ISeededRng interface", () => {
    const rng = new SeededRng(12345);
    expect(typeof rng.next).toBe("function");
    expect(typeof rng.nextInt).toBe("function");
    expect(typeof rng.nextFloat).toBe("function");
    expect(typeof rng.nextBool).toBe("function");
    expect(typeof rng.getState).toBe("function");
    expect(typeof rng.setState).toBe("function");
  });

  test("next() returns values in [0, 1)", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test("nextInt(min, max) returns values in [min, max] inclusive", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.nextInt(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  test("nextFloat(min, max) returns values in [min, max)", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.nextFloat(0.95, 1.05);
      expect(v).toBeGreaterThanOrEqual(0.95);
      expect(v).toBeLessThan(1.05);
    }
  });

  test("nextBool(1.0) always returns true", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 100; i++) {
      expect(rng.nextBool(1.0)).toBe(true);
    }
  });

  test("nextBool(0.0) always returns false", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 100; i++) {
      expect(rng.nextBool(0.0)).toBe(false);
    }
  });

  test("determinism: same seed produces identical sequences", () => {
    const rng1 = new SeededRng(99999);
    const rng2 = new SeededRng(99999);
    for (let i = 0; i < 10000; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  test("different seeds produce different sequences", () => {
    const rng1 = new SeededRng(1);
    const rng2 = new SeededRng(2);
    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());
    expect(seq1).not.toEqual(seq2);
  });

  test("getState/setState preserves and restores RNG position", () => {
    const rng = new SeededRng(42);
    // Advance the RNG
    for (let i = 0; i < 50; i++) rng.next();
    // Save state
    const state = rng.getState();
    // Generate sequence from saved point
    const seq1 = Array.from({ length: 20 }, () => rng.next());
    // Restore state and regenerate
    rng.setState(state);
    const seq2 = Array.from({ length: 20 }, () => rng.next());
    expect(seq1).toEqual(seq2);
  });

  test("distribution: nextInt is roughly uniform", () => {
    const rng = new SeededRng(42);
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60000; i++) {
      counts[rng.nextInt(0, 5)]++;
    }
    // Each bucket should have ~10000, allow 15% tolerance
    for (const count of counts) {
      expect(count).toBeGreaterThan(8500);
      expect(count).toBeLessThan(11500);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/game/rng/SeededRng.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement SeededRng using xoshiro128** (32-bit for JS number safety)**

```typescript
// src/game/rng/SeededRng.ts
import type { ISeededRng, RngState } from "@shared/combat-interfaces";

/**
 * Seeded PRNG using xoshiro128** algorithm.
 * Deterministic: same seed always produces the same sequence.
 * All game randomness MUST use this — never Math.random().
 */
export class SeededRng implements ISeededRng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // Initialize state using SplitMix32 from seed
    let s = seed | 0;
    this.s0 = splitmix32(s); s = (s + 0x9e3779b9) | 0;
    this.s1 = splitmix32(s); s = (s + 0x9e3779b9) | 0;
    this.s2 = splitmix32(s); s = (s + 0x9e3779b9) | 0;
    this.s3 = splitmix32(s);
    // Warm up
    for (let i = 0; i < 20; i++) this.nextRaw();
  }

  private nextRaw(): number {
    const result = Math.imul(rotl(Math.imul(this.s1, 5), 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);
    return result;
  }

  next(): number {
    return (this.nextRaw() >>> 0) / 0x100000000;
  }

  nextInt(min: number, max: number): number {
    const range = max - min + 1;
    return min + (this.nextRaw() % range + range) % range;
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextBool(probability: number): boolean {
    return this.next() < probability;
  }

  getState(): RngState {
    return { s0: this.s0, s1: this.s1, s2: this.s2, s3: this.s3 };
  }

  setState(state: RngState): void {
    this.s0 = state.s0;
    this.s1 = state.s1;
    this.s2 = state.s2;
    this.s3 = state.s3;
  }
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

function splitmix32(seed: number): number {
  let z = (seed + 0x9e3779b9) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/game/rng/SeededRng.test.ts
```

Expected: PASS — all tests.

**Step 5: Commit**

```bash
git add src/game/rng/SeededRng.ts tests/game/rng/SeededRng.test.ts
git commit -m "feat: add SeededRng (xoshiro128**) with determinism and state serialization"
```

---

### Task 6: RngStreamManager

**Files:**
- Create: `src/game/rng/RngStreamManager.ts`
- Create: `tests/game/rng/RngStreamManager.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/game/rng/RngStreamManager.test.ts
import { describe, test, expect } from "vitest";
import { RngStreamManager } from "@game/rng/RngStreamManager";

describe("RngStreamManager", () => {
  test("creates 6 independent streams from master seed", () => {
    const mgr = new RngStreamManager(42);
    const domains = ["combat", "loot", "worldEvents", "crafting", "fishing", "offline"];
    for (const domain of domains) {
      const rng = mgr.get(domain);
      expect(rng).toBeDefined();
      expect(typeof rng.next()).toBe("number");
    }
  });

  test("throws on unknown domain", () => {
    const mgr = new RngStreamManager(42);
    expect(() => mgr.get("invalid")).toThrow("Unknown RNG domain");
  });

  test("streams are independent — consuming one does not affect another", () => {
    const mgr1 = new RngStreamManager(42);
    const mgr2 = new RngStreamManager(42);

    // Consume 100 values from combat on mgr1
    for (let i = 0; i < 100; i++) mgr1.get("combat").next();

    // Loot stream should be identical on both managers
    const loot1 = Array.from({ length: 10 }, () => mgr1.get("loot").next());
    const loot2 = Array.from({ length: 10 }, () => mgr2.get("loot").next());
    expect(loot1).toEqual(loot2);
  });

  test("serialize/deserialize preserves all stream states", () => {
    const mgr = new RngStreamManager(42);
    // Advance streams differently
    for (let i = 0; i < 50; i++) mgr.get("combat").next();
    for (let i = 0; i < 30; i++) mgr.get("loot").next();

    // Serialize
    const serialized = mgr.serialize();

    // Create fresh manager and deserialize
    const mgr2 = new RngStreamManager(1); // different seed doesn't matter
    mgr2.deserialize(serialized);

    // Sequences should match from this point
    const seq1 = Array.from({ length: 20 }, () => mgr.get("combat").next());
    const seq2 = Array.from({ length: 20 }, () => mgr2.get("combat").next());
    expect(seq1).toEqual(seq2);

    const loot1 = Array.from({ length: 20 }, () => mgr.get("loot").next());
    const loot2 = Array.from({ length: 20 }, () => mgr2.get("loot").next());
    expect(loot1).toEqual(loot2);
  });

  test("same master seed produces identical managers", () => {
    const mgr1 = new RngStreamManager(12345);
    const mgr2 = new RngStreamManager(12345);

    for (const domain of ["combat", "loot", "worldEvents", "crafting", "fishing", "offline"]) {
      const seq1 = Array.from({ length: 10 }, () => mgr1.get(domain).next());
      const seq2 = Array.from({ length: 10 }, () => mgr2.get(domain).next());
      expect(seq1).toEqual(seq2);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/game/rng/RngStreamManager.test.ts
```

Expected: FAIL.

**Step 3: Implement**

```typescript
// src/game/rng/RngStreamManager.ts
import type { ISeededRng, RngState } from "@shared/combat-interfaces";
import { SeededRng } from "./SeededRng";

const DOMAINS = ["combat", "loot", "worldEvents", "crafting", "fishing", "offline"] as const;
export type RngDomain = (typeof DOMAINS)[number];

export class RngStreamManager {
  private streams: Map<string, SeededRng> = new Map();

  constructor(masterSeed: number) {
    const seedGen = new SeededRng(masterSeed);
    for (const domain of DOMAINS) {
      this.streams.set(domain, new SeededRng(seedGen.nextInt(0, 0x7fffffff)));
    }
  }

  get(domain: string): ISeededRng {
    const stream = this.streams.get(domain);
    if (!stream) throw new Error(`Unknown RNG domain: ${domain}`);
    return stream;
  }

  serialize(): Record<string, RngState> {
    const result: Record<string, RngState> = {};
    for (const [domain, rng] of this.streams) {
      result[domain] = rng.getState();
    }
    return result;
  }

  deserialize(data: Record<string, RngState>): void {
    for (const [domain, state] of Object.entries(data)) {
      const rng = this.streams.get(domain);
      if (rng) rng.setState(state);
    }
  }
}
```

**Step 4: Run test**

```bash
npx vitest run tests/game/rng/RngStreamManager.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/game/rng/RngStreamManager.ts tests/game/rng/RngStreamManager.test.ts
git commit -m "feat: add RngStreamManager with 6 independent seeded streams"
```

---

### Task 7: SQLite Connection + Kysely Schema

**Files:**
- Create: `src/main/database/connection.ts`
- Create: `src/main/database/schema.ts`
- Create: `tests/main/database/connection.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/main/database/connection.test.ts
import { describe, test, expect, afterEach } from "vitest";
import { openDatabase, closeDatabase } from "@main/database/connection";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_DB = join(tmpdir(), "test_lotr_connection.db");

afterEach(() => {
  try { unlinkSync(TEST_DB); } catch { /* ignore */ }
  try { unlinkSync(TEST_DB + "-wal"); } catch { /* ignore */ }
  try { unlinkSync(TEST_DB + "-shm"); } catch { /* ignore */ }
});

describe("openDatabase", () => {
  test("creates a new database file", () => {
    const db = openDatabase(TEST_DB);
    expect(existsSync(TEST_DB)).toBe(true);
    closeDatabase(db);
  });

  test("enables WAL mode", () => {
    const db = openDatabase(TEST_DB);
    const result = db.pragma("journal_mode") as Array<{ journal_mode: string }>;
    expect(result[0].journal_mode).toBe("wal");
    closeDatabase(db);
  });

  test("enables foreign keys", () => {
    const db = openDatabase(TEST_DB);
    const result = db.pragma("foreign_keys") as Array<{ foreign_keys: number }>;
    expect(result[0].foreign_keys).toBe(1);
    closeDatabase(db);
  });

  test("passes integrity check", () => {
    const db = openDatabase(TEST_DB);
    const result = db.pragma("integrity_check") as Array<{ integrity_check: string }>;
    expect(result[0].integrity_check).toBe("ok");
    closeDatabase(db);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/main/database/connection.test.ts
```

Expected: FAIL.

**Step 3: Implement connection**

```typescript
// src/main/database/connection.ts
import Database from "better-sqlite3";

export function openDatabase(path: string): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  return db;
}

export function closeDatabase(db: Database.Database): void {
  db.close();
}
```

**Step 4: Create Kysely schema types**

```typescript
// src/main/database/schema.ts
import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface DatabaseSchema {
  save_metadata: SaveMetadataTable;
  characters: CharactersTable;
  items: ItemsTable;
  quest_progress: QuestProgressTable;
  account_data: AccountDataTable;
  rng_state: RngStateTable;
  active_state_machines: ActiveStateMachinesTable;
  reset_tracking: ResetTrackingTable;
  guild_hall: GuildHallTable;
  profession_cooldowns: ProfessionCooldownsTable;
}

interface SaveMetadataTable {
  id: Generated<number>;
  save_name: string;
  version: string;
  created_at: number;
  last_saved_at: number;
  total_playtime_seconds: number;
}

interface CharactersTable {
  id: Generated<number>;
  name: string;
  race: string;
  class_name: string;
  level: number;
  xp: number;
  rested_xp: number;
  gold: number;
  current_zone: string;
  activity: string;
  active_spec: string;
  talent_points: string; // JSON
  equipment: string; // JSON
  companion_clears: string; // JSON
  created_at: number;
  last_played_at: number;
}

interface ItemsTable {
  id: Generated<number>;
  template_id: string; // String content ID per Decision 1
  character_id: number;
  bag_slot: number | null;
  equipped_slot: string | null;
  durability: number;
  enchant_id: string | null;
  gem_ids: string | null; // JSON array
}

interface QuestProgressTable {
  id: Generated<number>;
  quest_id: string;
  character_id: number;
  status: string;
  objectives: string; // JSON
  accepted_at: number;
}

interface AccountDataTable {
  id: Generated<number>;
  heirloom_unlocks: string; // JSON
  transmog_unlocks: string; // JSON
  mount_unlocks: string; // JSON
  title_unlocks: string; // JSON
  achievement_points: number;
  guild_hall_level: number;
}

interface RngStateTable {
  stream_name: string;
  state_s0: number;
  state_s1: number;
  state_s2: number;
  state_s3: number;
}

interface ActiveStateMachinesTable {
  id: Generated<number>;
  character_id: number;
  machine_type: string;
  machine_id: string;
  current_state: string;
  context_data: string; // JSON
  started_at: number;
}

interface ResetTrackingTable {
  id: Generated<number>;
  last_daily_reset: number | null;
  last_weekly_reset: number | null;
  daily_quest_seed: number | null;
}

interface GuildHallTable {
  id: Generated<number>;
  level: number;
  upgrades: string; // JSON
  upgrade_in_progress: string | null; // JSON
  total_gold_invested: number;
}

interface ProfessionCooldownsTable {
  id: Generated<number>;
  character_id: number;
  cooldown_type: string;
  expires_at: number;
}

// Convenience types
export type SaveMetadata = Selectable<SaveMetadataTable>;
export type NewSaveMetadata = Insertable<SaveMetadataTable>;
export type CharacterRow = Selectable<CharactersTable>;
export type NewCharacterRow = Insertable<CharactersTable>;
export type ItemRow = Selectable<ItemsTable>;
export type NewItemRow = Insertable<ItemsTable>;
```

**Step 5: Run test**

```bash
npx vitest run tests/main/database/connection.test.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add src/main/database/connection.ts src/main/database/schema.ts tests/main/database/connection.test.ts
git commit -m "feat: add SQLite connection (WAL, FK) and Kysely database schema"
```

---

### Task 8: Database Migration System

**Files:**
- Create: `src/main/database/migrations/001_initial.ts`
- Create: `src/main/database/migrator.ts`
- Create: `tests/main/database/migration.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/main/database/migration.test.ts
import { describe, test, expect, afterEach } from "vitest";
import { openDatabase, closeDatabase } from "@main/database/connection";
import { runMigrations, getCurrentVersion } from "@main/database/migrator";
import { unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_DB = join(tmpdir(), "test_lotr_migration.db");

afterEach(() => {
  try { unlinkSync(TEST_DB); } catch { /* ignore */ }
  try { unlinkSync(TEST_DB + "-wal"); } catch { /* ignore */ }
  try { unlinkSync(TEST_DB + "-shm"); } catch { /* ignore */ }
});

describe("Database migrations", () => {
  test("runMigrations creates all tables", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);

    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as Array<{ name: string }>;

    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain("save_metadata");
    expect(tableNames).toContain("characters");
    expect(tableNames).toContain("items");
    expect(tableNames).toContain("quest_progress");
    expect(tableNames).toContain("account_data");
    expect(tableNames).toContain("rng_state");
    expect(tableNames).toContain("reset_tracking");
    expect(tableNames).toContain("guild_hall");
    expect(tableNames).toContain("profession_cooldowns");

    closeDatabase(db);
  });

  test("getCurrentVersion returns 0.1.0 after initial migration", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe("0.1.0");
    closeDatabase(db);
  });

  test("running migrations twice is idempotent", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe("0.1.0");
    closeDatabase(db);
  });

  test("characters table has correct columns", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);

    const info = db.prepare("PRAGMA table_info(characters)").all() as Array<{ name: string }>;
    const colNames = info.map(c => c.name);

    expect(colNames).toContain("id");
    expect(colNames).toContain("name");
    expect(colNames).toContain("race");
    expect(colNames).toContain("class_name");
    expect(colNames).toContain("level");
    expect(colNames).toContain("xp");
    expect(colNames).toContain("gold");
    expect(colNames).toContain("current_zone");
    expect(colNames).toContain("equipment");

    closeDatabase(db);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/main/database/migration.test.ts
```

Expected: FAIL.

**Step 3: Implement migrations**

```typescript
// src/main/database/migrations/001_initial.ts
import type Database from "better-sqlite3";

export const version = "0.1.0";
export const description = "Initial schema — all core tables";

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS save_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      save_name TEXT NOT NULL,
      version TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_saved_at INTEGER NOT NULL,
      total_playtime_seconds INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      race TEXT NOT NULL,
      class_name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      rested_xp INTEGER NOT NULL DEFAULT 0,
      gold INTEGER NOT NULL DEFAULT 0,
      current_zone TEXT NOT NULL DEFAULT 'greenhollow_vale',
      activity TEXT NOT NULL DEFAULT 'idle',
      active_spec TEXT NOT NULL,
      talent_points TEXT NOT NULL DEFAULT '{}',
      equipment TEXT NOT NULL DEFAULT '{}',
      companion_clears TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      last_played_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL,
      character_id INTEGER NOT NULL,
      bag_slot INTEGER,
      equipped_slot TEXT,
      durability INTEGER NOT NULL DEFAULT 100,
      enchant_id TEXT,
      gem_ids TEXT,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS quest_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id TEXT NOT NULL,
      character_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'accepted',
      objectives TEXT NOT NULL DEFAULT '{}',
      accepted_at INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS account_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heirloom_unlocks TEXT NOT NULL DEFAULT '[]',
      transmog_unlocks TEXT NOT NULL DEFAULT '[]',
      mount_unlocks TEXT NOT NULL DEFAULT '[]',
      title_unlocks TEXT NOT NULL DEFAULT '[]',
      achievement_points INTEGER NOT NULL DEFAULT 0,
      guild_hall_level INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS rng_state (
      stream_name TEXT PRIMARY KEY,
      state_s0 INTEGER NOT NULL,
      state_s1 INTEGER NOT NULL,
      state_s2 INTEGER NOT NULL,
      state_s3 INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS active_state_machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      machine_type TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      current_state TEXT NOT NULL,
      context_data TEXT NOT NULL DEFAULT '{}',
      started_at INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS reset_tracking (
      id INTEGER PRIMARY KEY,
      last_daily_reset INTEGER,
      last_weekly_reset INTEGER,
      daily_quest_seed INTEGER
    );

    CREATE TABLE IF NOT EXISTS guild_hall (
      id INTEGER PRIMARY KEY,
      level INTEGER NOT NULL DEFAULT 1,
      upgrades TEXT NOT NULL DEFAULT '{}',
      upgrade_in_progress TEXT,
      total_gold_invested INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profession_cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      cooldown_type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );
  `);
}
```

```typescript
// src/main/database/migrator.ts
import type Database from "better-sqlite3";
import * as migration001 from "./migrations/001_initial";

interface Migration {
  version: string;
  description: string;
  up: (db: Database.Database) => void;
}

const MIGRATIONS: Migration[] = [
  migration001,
];

export function runMigrations(db: Database.Database): void {
  // Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const applied = new Set(
    (db.prepare("SELECT version FROM _migrations").all() as Array<{ version: string }>)
      .map(r => r.version)
  );

  for (const migration of MIGRATIONS) {
    if (!applied.has(migration.version)) {
      migration.up(db);
      db.prepare("INSERT INTO _migrations (version, applied_at) VALUES (?, ?)").run(
        migration.version,
        Math.floor(Date.now() / 1000)
      );
    }
  }
}

export function getCurrentVersion(db: Database.Database): string {
  const row = db.prepare(
    "SELECT version FROM _migrations ORDER BY rowid DESC LIMIT 1"
  ).get() as { version: string } | undefined;
  return row?.version ?? "0.0.0";
}
```

**Step 4: Run test**

```bash
npx vitest run tests/main/database/migration.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/main/database/migrations/ src/main/database/migrator.ts tests/main/database/migration.test.ts
git commit -m "feat: add database migration system with initial schema"
```

---

### Task 9: SaveManager

**Files:**
- Create: `src/game/engine/SaveManager.ts`
- Create: `tests/game/engine/SaveManager.test.ts`

This task implements create, open, backup, validate, and platform-specific save paths. The implementation is straightforward but critical for save integrity.

**Step 1: Write test, Step 2: Verify fail, Step 3: Implement, Step 4: Verify pass, Step 5: Commit**

Follow the same TDD pattern. Key test cases:
- `createSave(name)` creates a new `.db` file and runs migrations
- `openSave(path)` opens an existing save and validates integrity
- `backupSave(path)` creates a `.db.bak` copy
- `getSavePath()` returns platform-specific path (`%APPDATA%` on Windows, `~/.config` on Linux, `~/Library` on macOS)
- `listSaves()` returns all `.db` files in the save directory
- Round-trip: create → save metadata → backup → open → read metadata → matches

```bash
git commit -m "feat: add SaveManager with create, open, backup, validate"
```

---

### Task 10: GameLoop Skeleton

**Files:**
- Create: `src/game/engine/GameLoop.ts`
- Create: `tests/game/engine/GameLoop.test.ts`

Key test cases:
- `start()` begins ticking at ~1 Hz
- `stop()` stops ticking
- `pause()` / `resume()` pauses and resumes
- Drift correction: after a 3-second delay, processes 3 catch-up ticks
- Catch-up cap: never processes more than 10 ticks per interval
- Tick callback receives incrementing tick number
- `isRunning` reflects current state

```bash
git commit -m "feat: add GameLoop with 1 Hz tick dispatch and drift correction"
```

---

### Tasks 11-14: Electron Main Process, Preload, IPC Handlers, Window Management

These tasks flesh out the Electron skeleton from Task 4 into a working app:

- **Task 11:** `src/main/main.ts` — full app lifecycle, database initialization, GameLoop start/stop
- **Task 12:** `src/main/preload.ts` — expose typed `GameAPI` subset (save management for now)
- **Task 13:** `src/main/ipc/handlers.ts` — register IPC handlers for save CRUD, wire to SaveManager
- **Task 14:** `src/main/window.ts` — window state persistence (position, size), minimize to tray placeholder

Each follows the same TDD pattern. Integration testing for Electron IPC requires the app to be running, so these tests use vitest with mocked Electron APIs where possible.

```bash
git commit -m "feat: add Electron main process with IPC handlers and window management"
```

---

## Track B: Combat Math (Tasks 15-20)

> Can run in parallel with Tracks A, C, D after Task 4.

### Task 15: Stat Calculations

**Files:**
- Create: `src/game/combat/stats.ts`
- Create: `tests/game/combat/stats.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/game/combat/stats.test.ts
import { describe, test, expect } from "vitest";
import {
  calculateMaxHp, calculateMaxMana, calculateArmorMitigation,
  ratingToPercentage, calculateAttackPower, calculateSpellPower,
} from "@game/combat/stats";

describe("HP and Mana", () => {
  test("HP = stamina * 10 + classBaseHp", () => {
    expect(calculateMaxHp(100, 100)).toBe(1100);
    expect(calculateMaxHp(0, 0)).toBe(0);
    expect(calculateMaxHp(500, 200)).toBe(5200);
  });

  test("Mana = intellect * 15 + classBaseMana", () => {
    expect(calculateMaxMana(100, 100)).toBe(1600);
    expect(calculateMaxMana(0, 0)).toBe(0);
    expect(calculateMaxMana(500, 200)).toBe(7700);
  });
});

describe("Armor mitigation", () => {
  test("0 armor = 0% at level 60", () => {
    expect(calculateArmorMitigation(0, 60)).toBeCloseTo(0, 5);
  });

  test("2750 armor = 33.3% at level 60", () => {
    // armor / (armor + 400 + 85*60) = 2750 / (2750 + 5500) = 2750/8250 = 0.333...
    expect(calculateArmorMitigation(2750, 60)).toBeCloseTo(0.333, 2);
  });

  test("5500 armor = 50% at level 60", () => {
    expect(calculateArmorMitigation(5500, 60)).toBeCloseTo(0.5, 5);
  });

  test("11000 armor = 66.7% at level 60", () => {
    expect(calculateArmorMitigation(11000, 60)).toBeCloseTo(0.667, 2);
  });
});

describe("Rating conversions", () => {
  test("22 crit rating = 1% crit", () => {
    expect(ratingToPercentage(22, "crit_rating")).toBeCloseTo(1.0, 5);
  });

  test("12.5 hit rating = 1% hit", () => {
    expect(ratingToPercentage(12.5, "hit_rating")).toBeCloseTo(1.0, 5);
  });

  test("15 haste rating = 1% haste", () => {
    expect(ratingToPercentage(15, "haste_rating")).toBeCloseTo(1.0, 5);
  });

  test("0 rating = 0%", () => {
    expect(ratingToPercentage(0, "crit_rating")).toBe(0);
  });
});

describe("Attack Power", () => {
  test("strength-based class: AP = strength * 2", () => {
    expect(calculateAttackPower(100, 50, "warrior")).toBe(200);
  });

  test("agility-based class: AP = agility * 2", () => {
    expect(calculateAttackPower(50, 100, "rogue")).toBe(200);
  });
});

describe("Spell Power", () => {
  test("SP from intellect and gear", () => {
    expect(calculateSpellPower(200, 50)).toBe(50); // gearSP only, intellect doesn't add SP directly
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/game/combat/stats.test.ts
```

Expected: FAIL.

**Step 3: Implement**

```typescript
// src/game/combat/stats.ts
import {
  HP_PER_STAMINA, MANA_PER_INTELLECT,
  ARMOR_CONSTANT_BASE, ARMOR_CONSTANT_PER_LEVEL,
  RATING_CONVERSIONS,
} from "@shared/constants";

export function calculateMaxHp(stamina: number, classBaseHp: number): number {
  return stamina * HP_PER_STAMINA + classBaseHp;
}

export function calculateMaxMana(intellect: number, classBaseMana: number): number {
  return intellect * MANA_PER_INTELLECT + classBaseMana;
}

export function calculateArmorMitigation(armor: number, attackerLevel: number): number {
  if (armor <= 0) return 0;
  const denominator = armor + ARMOR_CONSTANT_BASE + ARMOR_CONSTANT_PER_LEVEL * attackerLevel;
  return armor / denominator;
}

export function ratingToPercentage(rating: number, statType: string): number {
  const conversion = RATING_CONVERSIONS[statType as keyof typeof RATING_CONVERSIONS];
  if (!conversion || rating === 0) return 0;
  return rating / conversion;
}

const STRENGTH_CLASSES = new Set(["warrior", "cleric"]);
const AGILITY_CLASSES = new Set(["rogue", "ranger", "druid"]);

export function calculateAttackPower(
  strength: number,
  agility: number,
  classId: string,
): number {
  if (STRENGTH_CLASSES.has(classId)) return strength * 2;
  if (AGILITY_CLASSES.has(classId)) return agility * 2;
  // Hybrid or caster — lower AP
  return strength + agility;
}

export function calculateSpellPower(intellect: number, gearSpellPower: number): number {
  // Intellect does not directly add spell power — gear and talents provide it
  return gearSpellPower;
}
```

**Step 4: Run test**

```bash
npx vitest run tests/game/combat/stats.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/game/combat/stats.ts tests/game/combat/stats.test.ts
git commit -m "feat: add stat calculation functions (HP, mana, armor, ratings, AP, SP)"
```

---

### Task 16: Attack Table Resolution

**Files:**
- Create: `src/game/combat/attackTable.ts`
- Create: `tests/game/combat/attackTable.test.ts`

Key tests (from design doc Section 2.3.4):
- Bands always sum to exactly 100%
- Miss reduces by 1% per 12.5 hit rating
- Dual-wield adds 19% miss
- Boss crit suppression -4.8%
- Push-off: when avoidance exceeds space, crit then hit are pushed off
- Spell hit table: Miss → Crit → Hit
- Distribution: 10,000 rolls verify actual matches expected ±2%

```bash
git commit -m "feat: add attack table resolution (physical and spell hit tables)"
```

---

### Task 17: Damage Formulas

**Files:**
- Create: `src/game/combat/damage.ts`
- Create: `tests/game/combat/damage.test.ts`

Key tests from design doc:
- Physical: `weaponDmg + (AP/14)*speed * coeff * mods * (1-armor) * crit * variance`
- Spell: `baseDmg + SP*coeff * mods * crit * (1-resist) * variance`
- DoT tick: `(baseTick + SP*coeff) / numTicks`
- AoE: 3 models — uncapped sqrt, capped flat, chain bounce
- Variance: 0.95 to 1.05
- Crit multiplier: 2.0x physical, can be modified by talents

```bash
git commit -m "feat: add damage formulas (physical, spell, DoT, AoE, auto-attack)"
```

---

### Task 18: Healing Formulas

**Files:**
- Create: `src/game/combat/healing.ts`
- Create: `tests/game/combat/healing.test.ts`

Key tests:
- Direct heal: `baseHeal + SP*coeff * mods * critMult`
- HoT tick calculation
- Absorb shields
- `applyHealing` returns actual + overheal
- Crit heal multiplier: 1.5x base

```bash
git commit -m "feat: add healing formulas (direct, HoT, absorb, overheal tracking)"
```

---

### Task 19: Threat Calculations

**Files:**
- Create: `src/game/combat/threat.ts`
- Create: `tests/game/combat/threat.test.ts`

Key tests:
- Damage threat: `damage * stanceMod * talentMod * abilityMod`
- Healing threat: `heal * 0.5 / enemyCount`
- Aggro transfer: melee 110%, ranged 130%
- Threat table update and query

```bash
git commit -m "feat: add threat calculation and aggro management functions"
```

---

### Task 20: Resource System (All 9 Types)

**Files:**
- Create: `src/game/combat/resources.ts`
- Create: `tests/game/combat/resources.test.ts`

Key tests:
- Rage generation from damage
- Mana regeneration (spirit-based, in/out of combat)
- Energy regeneration (20/tick base, haste-modified)
- Combo point generation/spending
- Soul shard generation on kill
- Focus regeneration
- Divine Favor accumulation
- Maelstrom generation
- Arcane Charges stacking
- GCD calculation: `max(1.0, 1.5 / (1 + haste/100))`
- `spendResource` success/failure
- `addResource` clamping to max

```bash
git commit -m "feat: add resource system for all 9 resource types with GCD calculation"
```

---

## Track C: Data Schemas + Content (Tasks 21-28)

> Can run in parallel with Tracks A, B, D after Task 4.

### Task 21: Zod Schema for Races

**Files:**
- Create: `src/game/data/schemas/race.schema.ts`
- Create: `tests/game/data/schemas/race.schema.test.ts`

Test validates: Zod schema accepts valid race data, rejects invalid data, enforces required fields.

```bash
git commit -m "feat: add Zod schema for RaceDefinition"
```

### Task 22: Zod Schema for Classes

Similar pattern. Validates 3 specs per class, valid resource types, base stats.

```bash
git commit -m "feat: add Zod schema for ClassDefinition"
```

### Task 23: Zod Schema for Stat Formulas

```bash
git commit -m "feat: add Zod schema for StatFormulas"
```

### Task 24: races.json — All 6 Races

**Files:**
- Create: `src/game/data/content/races.json`
- Create: `tests/game/data/content/races.test.ts`

Test: loads JSON, validates against Zod schema, checks 6 entries, checks design doc values (Human +5% XP, Dwarf +5% armor, etc.)

```bash
git commit -m "feat: add races.json with all 6 races per design doc"
```

### Task 25: classes.json — All 8 Classes

```bash
git commit -m "feat: add classes.json with all 8 classes per design doc"
```

### Task 26: stats.json — Stat Formulas

```bash
git commit -m "feat: add stats.json with rating conversions and formula data"
```

### Task 27: Data Loader Skeleton

**Files:**
- Create: `src/game/data/loader.ts`
- Create: `tests/game/data/loader.test.ts`

Test: `loadGameData()` returns typed object with races, classes, stats. All validated.

```bash
git commit -m "feat: add data loader skeleton with Zod validation"
```

### Task 28: Data Public API

**Files:**
- Create: `src/game/data/index.ts`
- Create: `tests/game/data/index.test.ts`

Test: `getRace("human")` returns Human, `getClass("warrior")` returns Warrior, etc.

```bash
git commit -m "feat: add data public API with convenience accessors"
```

---

## Track D: UI Renderer Foundation (Tasks 29-38)

> Can run in parallel with Tracks A, B, C after Task 4.

### Task 29: ANSI Color Palette

**Files:**
- Create: `src/renderer/ascii/Palette.ts`
- Create: `tests/renderer/ascii/Palette.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/renderer/ascii/Palette.test.ts
import { describe, test, expect } from "vitest";
import { ANSI_COLORS, getQualityColor, ANSIColor } from "@renderer/ascii/Palette";

describe("ANSI Color Palette", () => {
  test("has 16 color entries", () => {
    expect(ANSI_COLORS).toHaveLength(16);
  });

  test("black is [0,0,0]", () => {
    expect(ANSI_COLORS[ANSIColor.Black]).toEqual([0, 0, 0]);
  });

  test("bright white is [255,255,255]", () => {
    expect(ANSI_COLORS[ANSIColor.BrightWhite]).toEqual([255, 255, 255]);
  });

  test("red is correct", () => {
    expect(ANSI_COLORS[ANSIColor.Red]).toEqual([170, 0, 0]);
  });
});

describe("Quality color mapping", () => {
  test("common maps to white", () => {
    expect(getQualityColor("common")).toBe(ANSIColor.White);
  });

  test("uncommon maps to green", () => {
    expect(getQualityColor("uncommon")).toBe(ANSIColor.Green);
  });

  test("rare maps to bright blue", () => {
    expect(getQualityColor("rare")).toBe(ANSIColor.BrightBlue);
  });

  test("epic maps to bright magenta", () => {
    expect(getQualityColor("epic")).toBe(ANSIColor.BrightMagenta);
  });

  test("legendary maps to bright yellow", () => {
    expect(getQualityColor("legendary")).toBe(ANSIColor.BrightYellow);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/renderer/ascii/Palette.test.ts
```

Expected: FAIL.

**Step 3: Implement**

```typescript
// src/renderer/ascii/Palette.ts
export enum ANSIColor {
  Black = 0,
  Red = 1,
  Green = 2,
  Yellow = 3,
  Blue = 4,
  Magenta = 5,
  Cyan = 6,
  White = 7,
  BrightBlack = 8,
  BrightRed = 9,
  BrightGreen = 10,
  BrightYellow = 11,
  BrightBlue = 12,
  BrightMagenta = 13,
  BrightCyan = 14,
  BrightWhite = 15,
}

export type RGB = [number, number, number];

export const ANSI_COLORS: RGB[] = [
  [0, 0, 0],       // 0: Black
  [170, 0, 0],     // 1: Red
  [0, 170, 0],     // 2: Green
  [170, 85, 0],    // 3: Yellow (dark)
  [0, 0, 170],     // 4: Blue
  [170, 0, 170],   // 5: Magenta
  [0, 170, 170],   // 6: Cyan
  [170, 170, 170], // 7: White
  [85, 85, 85],    // 8: Bright Black (Dark Grey)
  [255, 85, 85],   // 9: Bright Red
  [85, 255, 85],   // 10: Bright Green
  [255, 255, 85],  // 11: Bright Yellow
  [85, 85, 255],   // 12: Bright Blue
  [255, 85, 255],  // 13: Bright Magenta
  [85, 255, 255],  // 14: Bright Cyan
  [255, 255, 255], // 15: Bright White
];

const QUALITY_COLORS: Record<string, ANSIColor> = {
  common: ANSIColor.White,
  uncommon: ANSIColor.Green,
  rare: ANSIColor.BrightBlue,
  epic: ANSIColor.BrightMagenta,
  legendary: ANSIColor.BrightYellow,
};

export function getQualityColor(quality: string): ANSIColor {
  return QUALITY_COLORS[quality] ?? ANSIColor.White;
}

export function colorToHex(color: ANSIColor): string {
  const [r, g, b] = ANSI_COLORS[color];
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function colorToCSS(color: ANSIColor): string {
  const [r, g, b] = ANSI_COLORS[color];
  return `rgb(${r}, ${g}, ${b})`;
}
```

**Step 4: Run test**

```bash
npx vitest run tests/renderer/ascii/Palette.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/renderer/ascii/Palette.ts tests/renderer/ascii/Palette.test.ts
git commit -m "feat: add ANSI 16-color palette with quality tier color mapping"
```

---

### Task 30: CharacterGrid Data Structure

**Files:**
- Create: `src/renderer/ascii/CharacterGrid.ts`
- Create: `tests/renderer/ascii/CharacterGrid.test.ts`

Key tests:
- Constructor creates grid with correct dimensions
- `setCell(x, y, char, fg, bg)` sets cell and marks dirty
- `getCell(x, y)` returns cell data
- `fill(char, fg, bg)` fills entire grid
- `clear()` resets all cells to space with default colors
- `isDirty(x, y)` returns true after `setCell`, false after `clearDirty`
- `drawText(x, y, text, fg)` writes a string starting at (x, y)
- Out-of-bounds access is safe (no crash)

```bash
git commit -m "feat: add CharacterGrid data structure for ASCII rendering"
```

---

### Task 31: Box Drawing Utility

**Files:**
- Create: `src/renderer/ascii/BoxDrawing.ts`
- Create: `tests/renderer/ascii/BoxDrawing.test.ts`

Key tests:
- `drawBorder(grid, x, y, w, h, "single")` places correct corner and edge chars
- Single-line border uses: `┌─┐│└─┘`
- Double-line border uses: `╔═╗║╚═╝`
- Minimum size is 2x2

```bash
git commit -m "feat: add box-drawing border utility for ASCII panels"
```

---

### Tasks 32-38: FontLoader, Renderer, Zustand Stores, AppShell, React Entry

These follow the same TDD pattern:

- **Task 32:** `FontLoader.ts` — loads bitmap font, extracts 256 glyphs, fallback to Canvas fillText
- **Task 33:** `Renderer.ts` — 60 FPS render loop, dirty-cell optimization, glyph tinting with LRU cache
- **Task 34:** `uiStore.ts` — Zustand store for UI-only state (active tab, panel sizes, modals)
- **Task 35:** `settingsStore.ts` — Persisted settings store (localStorage)
- **Task 36:** `AppShell.tsx` — Root Tailwind layout with title bar, menu bar, content area
- **Task 37:** `renderer/main.tsx` — React entry point with store providers
- **Task 38:** Tailwind configuration and `renderer/index.html` polish

Each task: test → fail → implement → pass → commit.

Final commits:
```bash
git commit -m "feat: add bitmap FontLoader with CP437 glyph extraction"
git commit -m "feat: add ASCII Renderer with dirty-cell optimization at 60 FPS"
git commit -m "feat: add Zustand UI and settings stores"
git commit -m "feat: add Tailwind AppShell with panel layout"
git commit -m "feat: add React entry point and renderer HTML"
```

---

## Final Verification (Task 39)

**Step 1: Type check all code**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

**Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (target: 150+ tests).

**Step 3: Build with electron-vite**

```bash
npx electron-vite build
```

Expected: Builds main, preload, and renderer without errors.

**Step 4: Manual smoke test**

```bash
npx electron-vite dev
```

Expected: Electron window opens, shows Tailwind AppShell with title and dark theme.

**Step 5: Commit any fixes and tag**

```bash
git tag v0.1.0-phase1
```
