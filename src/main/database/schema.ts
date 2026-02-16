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
  talent_points: string;
  equipment: string;
  companion_clears: string;
  created_at: number;
  last_played_at: number;
}

interface ItemsTable {
  id: Generated<number>;
  template_id: string;
  character_id: number;
  bag_slot: number | null;
  equipped_slot: string | null;
  durability: number;
  enchant_id: string | null;
  gem_ids: string | null;
}

interface QuestProgressTable {
  id: Generated<number>;
  quest_id: string;
  character_id: number;
  status: string;
  objectives: string;
  accepted_at: number;
}

interface AccountDataTable {
  id: Generated<number>;
  heirloom_unlocks: string;
  transmog_unlocks: string;
  mount_unlocks: string;
  title_unlocks: string;
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
  context_data: string;
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
  upgrades: string;
  upgrade_in_progress: string | null;
  total_gold_invested: number;
}

interface ProfessionCooldownsTable {
  id: Generated<number>;
  character_id: number;
  cooldown_type: string;
  expires_at: number;
}

export type SaveMetadata = Selectable<SaveMetadataTable>;
export type NewSaveMetadata = Insertable<SaveMetadataTable>;
export type CharacterRow = Selectable<CharactersTable>;
export type NewCharacterRow = Insertable<CharactersTable>;
export type ItemRow = Selectable<ItemsTable>;
export type NewItemRow = Insertable<ItemsTable>;
