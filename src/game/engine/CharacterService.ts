import { Kysely, SqliteDialect } from "kysely";
import type { DatabaseSchema } from "@main/database/schema";
import type { CharacterState, EffectiveStats, ItemInstance } from "@shared/types";
import type { RaceName, ClassName, GearSlot, ActivityType } from "@shared/enums";
import { getClass, getRace } from "@game/data";
import { InventoryService } from "./InventoryService";
import type Database from "better-sqlite3";

/**
 * CharacterService — Character CRUD operations with SQLite persistence.
 *
 * Responsibilities:
 * - Create new characters with validated race/class and initial state
 * - Load character state from database
 * - Save character state to database
 * - Delete characters
 *
 * All characters start at level 1, 0 XP, 0 gold, Idle activity, in Greenhollow Vale.
 */
export class CharacterService {
  private kysely: Kysely<DatabaseSchema>;

  constructor(db: Database.Database) {
    this.kysely = new Kysely<DatabaseSchema>({
      dialect: new SqliteDialect({ database: db }),
    });
  }

  /**
   * Create a new character.
   *
   * @param name - Character name (2-16 chars, alphanumeric + spaces)
   * @param race - Race from RaceName enum
   * @param className - Class from ClassName enum
   * @returns CharacterState with initial values
   * @throws Error if validation fails
   */
  async createCharacter(
    name: string,
    race: RaceName,
    className: ClassName
  ): Promise<CharacterState> {
    // Validate name
    if (name.length < 2 || name.length > 16) {
      throw new Error("Character name must be 2-16 characters");
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
      throw new Error("Character name can only contain letters, numbers, and spaces");
    }

    // Validate race
    const raceDefinition = getRace(race);
    if (!raceDefinition) {
      throw new Error(`Invalid race: ${race}`);
    }

    // Validate class
    const classDefinition = getClass(className);
    if (!classDefinition) {
      throw new Error(`Invalid class: ${className}`);
    }

    // Build initial character state
    const now = Math.floor(Date.now() / 1000);
    const initialSpec = classDefinition.specs[0]; // Default to first spec

    // Initialize equipment (all slots empty)
    const equipment: Record<GearSlot, number | null> = {
      head: null,
      shoulder: null,
      back: null,
      chest: null,
      wrist: null,
      hands: null,
      waist: null,
      legs: null,
      feet: null,
      neck: null,
      ring1: null,
      ring2: null,
      trinket1: null,
      trinket2: null,
      main_hand: null,
      off_hand: null,
    };

    // Initialize base stats from class definition
    const baseStats = classDefinition.baseStats;
    const effectiveStats = {
      strength: baseStats.strength,
      agility: baseStats.agility,
      intellect: baseStats.intellect,
      stamina: baseStats.stamina,
      spirit: baseStats.spirit,
      maxHp: classDefinition.classBaseHp,
      maxMana: classDefinition.classBaseMana,
      attackPower: 0,
      spellPower: 0,
      armor: 0,
      critChance: 0,
      hitChance: 1.0, // 100% base hit chance
      hastePercent: 0,
      dodgeChance: 0,
      parryChance: 0,
      blockChance: 0,
      blockValue: 0,
      defenseSkill: 1, // Base defense skill at level 1
      resilience: 0,
      mp5: 0,
      weaponDamageMin: 1,
      weaponDamageMax: 2,
      weaponSpeed: 2.0,
    };

    // Insert into database
    const result = await this.kysely
      .insertInto("characters")
      .values({
        name,
        race,
        class_name: className,
        level: 1,
        xp: 0,
        rested_xp: 0,
        gold: 0,
        current_zone: "greenhollow_vale",
        activity: "idle",
        active_spec: initialSpec,
        talent_points: JSON.stringify({}),
        equipment: JSON.stringify(equipment),
        companion_clears: JSON.stringify({}),
        created_at: now,
        last_played_at: now,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    const characterState: CharacterState = {
      id: result.id,
      name,
      race,
      className,
      level: 1,
      xp: 0,
      restedXp: 0,
      gold: 0,
      currentZone: "greenhollow_vale" as any, // ZoneId
      activity: "idle" as ActivityType,
      activeSpec: initialSpec,
      talentPoints: {},
      equipment,
      stats: effectiveStats,
      bags: [],
      companionClears: {},
      createdAt: now,
      lastPlayedAt: now,
    };

    return characterState;
  }

  /**
   * Load a character by ID.
   *
   * @param id - Character ID
   * @returns CharacterState or null if not found
   */
  async loadCharacter(id: number): Promise<CharacterState | null> {
    const row = await this.kysely
      .selectFrom("characters")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return this.rowToState(row);
  }

  /**
   * Load all characters (including bags from items table).
   *
   * @returns Array of all CharacterState records
   */
  async loadAllCharacters(): Promise<CharacterState[]> {
    const rows = await this.kysely
      .selectFrom("characters")
      .selectAll()
      .execute();

    const characters = rows.map(row => this.rowToState(row));
    for (const char of characters) {
      char.bags = await this.loadBags(char.id);
    }
    return characters;
  }

  /**
   * Save character state to database (including bags to items table).
   *
   * @param state - CharacterState to persist
   */
  async saveCharacter(state: CharacterState): Promise<void> {
    await this.kysely
      .updateTable("characters")
      .set({
        name: state.name,
        race: state.race,
        class_name: state.className,
        level: state.level,
        xp: state.xp,
        rested_xp: state.restedXp,
        gold: state.gold,
        current_zone: state.currentZone,
        activity: state.activity,
        active_spec: state.activeSpec,
        talent_points: JSON.stringify(state.talentPoints),
        equipment: JSON.stringify(state.equipment),
        companion_clears: JSON.stringify(state.companionClears),
        last_played_at: state.lastPlayedAt,
      })
      .where("id", "=", state.id)
      .execute();

    await this.saveBags(state.id, state.bags);
  }

  /**
   * Delete a character by ID.
   *
   * @param id - Character ID
   */
  async deleteCharacter(id: number): Promise<void> {
    await this.kysely
      .deleteFrom("characters")
      .where("id", "=", id)
      .execute();
  }

  /**
   * Load bag items for a character from the items table.
   */
  async loadBags(characterId: number): Promise<ItemInstance[]> {
    const rows = await this.kysely
      .selectFrom("items")
      .selectAll()
      .where("character_id", "=", characterId)
      .execute();

    return rows.map(row => ({
      id: row.id,
      templateId: row.template_id as any,
      characterId: row.character_id,
      bagSlot: row.bag_slot,
      equippedSlot: (row.equipped_slot as GearSlot | null),
      durability: row.durability,
      enchantId: row.enchant_id ?? undefined,
      gemIds: row.gem_ids ? JSON.parse(row.gem_ids) : undefined,
    }));
  }

  /**
   * Save bag items for a character to the items table.
   */
  async saveBags(characterId: number, items: ItemInstance[]): Promise<void> {
    // Delete existing items for this character
    await this.kysely
      .deleteFrom("items")
      .where("character_id", "=", characterId)
      .execute();

    // Insert current items
    for (const item of items) {
      await this.kysely
        .insertInto("items")
        .values({
          template_id: item.templateId as string,
          character_id: characterId,
          bag_slot: item.bagSlot,
          equipped_slot: item.equippedSlot,
          durability: item.durability,
          enchant_id: item.enchantId ?? null,
          gem_ids: item.gemIds ? JSON.stringify(item.gemIds) : null,
        })
        .execute();
    }
  }

  /**
   * Convert database row to CharacterState.
   * Stats are computed at runtime from class definition + level + gear.
   */
  private rowToState(row: any): CharacterState {
    const className = row.class_name as ClassName;
    const classDef = getClass(className);
    const equipment = JSON.parse(row.equipment);

    let stats: EffectiveStats;
    if (classDef) {
      const inventoryService = new InventoryService();
      stats = inventoryService.recalculateStats(
        { level: row.level, equipment } as CharacterState,
        classDef,
        [] // Equipped item definitions loaded separately
      );
    } else {
      stats = {
        strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0,
        maxHp: 100, maxMana: 100, attackPower: 0, spellPower: 0, armor: 0,
        critChance: 0, hitChance: 1.0, hastePercent: 0,
        dodgeChance: 0, parryChance: 0, blockChance: 0, blockValue: 0,
        defenseSkill: row.level, resilience: 0, mp5: 0,
        weaponDamageMin: 1, weaponDamageMax: 2, weaponSpeed: 2.0,
      };
    }

    return {
      id: row.id,
      name: row.name,
      race: row.race as RaceName,
      className,
      level: row.level,
      xp: row.xp,
      restedXp: row.rested_xp,
      gold: row.gold,
      currentZone: row.current_zone as any,
      activity: row.activity as ActivityType,
      activeSpec: row.active_spec,
      talentPoints: JSON.parse(row.talent_points),
      equipment,
      stats,
      bags: [], // Loaded separately via loadBags
      companionClears: JSON.parse(row.companion_clears),
      createdAt: row.created_at,
      lastPlayedAt: row.last_played_at,
    };
  }
}
