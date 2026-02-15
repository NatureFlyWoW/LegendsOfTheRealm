# Core Engine & Architecture

> **Role:** Technical foundation for all game systems. Engine/architecture subagent primary reference.
> **Related files:** `00_overview_and_decisions.md` (tech stack rationale), `02_character_and_combat.md` (combat runs on tick system)

---

## PROJECT STRUCTURE

```
LegendsOfTheRealm/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── main.ts           # App entry point
│   │   ├── database.ts       # SQLite connection
│   │   └── auto-save.ts      # Background save system
│   ├── renderer/             # Electron renderer (UI)
│   │   ├── App.tsx           # React root
│   │   ├── components/       # UI components
│   │   │   ├── CharacterSheet.tsx
│   │   │   ├── CombatLog.tsx
│   │   │   ├── ZoneMap.tsx
│   │   │   ├── InventoryPanel.tsx
│   │   │   └── ...
│   │   ├── ascii/            # ASCII rendering engine
│   │   │   ├── Renderer.ts   # Canvas-based ASCII renderer
│   │   │   ├── Tileset.ts    # Character/color definitions
│   │   │   └── Effects.ts    # Particle effects
│   │   └── stores/           # Zustand state stores
│   ├── game/                 # Core game logic (engine)
│   │   ├── engine/
│   │   │   ├── GameLoop.ts   # Main game tick loop
│   │   │   ├── TimeManager.ts # Idle time calculation
│   │   │   └── SaveManager.ts
│   │   ├── systems/
│   │   │   ├── CombatSystem.ts
│   │   │   ├── LevelingSystem.ts
│   │   │   ├── LootSystem.ts
│   │   │   ├── ProfessionSystem.ts
│   │   │   └── ...
│   │   ├── entities/
│   │   │   ├── Character.ts
│   │   │   ├── Item.ts
│   │   │   ├── Monster.ts
│   │   │   └── ...
│   │   └── data/             # Static game data
│   │       ├── classes.json
│   │       ├── talents.json
│   │       ├── items.json
│   │       ├── zones.json
│   │       └── ...
│   ├── shared/               # Shared types/utils
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── assets/
│       ├── fonts/
│       ├── audio/
│       └── data/
├── database/
│   ├── schema.sql            # Database schema
│   └── migrations/           # Version migrations
├── tests/
│   ├── combat.test.ts
│   ├── leveling.test.ts
│   └── ...
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json
```

---

## DEVELOPMENT WORKFLOW

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with hot reload
npm run test         # Run unit tests
npm run build        # Build production app
npm run package      # Create installers (Windows/Mac/Linux)
```

**Save File Locations:**
- Windows: `%APPDATA%/LegendsOfTheRealm/saves/`
- Mac: `~/Library/Application Support/LegendsOfTheRealm/saves/`
- Linux: `~/.config/LegendsOfTheRealm/saves/`

---

## SAVE SYSTEM ARCHITECTURE

### Save File Structure

**Format:** SQLite database (.db file)
**File Naming:** `save_001.db`, `save_002.db`, etc.
**Unlimited Saves:** Players can create unlimited save slots.

### Database Schema

```sql
-- Metadata
CREATE TABLE save_metadata (
    id INTEGER PRIMARY KEY,
    save_name TEXT,
    creation_date INTEGER,  -- Unix timestamp
    last_played INTEGER,
    total_playtime INTEGER, -- seconds
    version TEXT,           -- Game version (for migrations)
    character_count INTEGER
);

-- Characters
CREATE TABLE characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    race TEXT,
    class TEXT,
    level INTEGER,
    xp INTEGER,
    current_zone TEXT,
    position_x REAL,
    position_y REAL,

    -- Stats
    strength INTEGER,
    agility INTEGER,
    intellect INTEGER,
    stamina INTEGER,
    spirit INTEGER,

    -- Resources
    current_hp INTEGER,
    max_hp INTEGER,
    current_mana INTEGER,
    max_mana INTEGER,
    current_resource INTEGER, -- rage/energy/etc

    -- Gear (foreign key to items table)
    head_item_id INTEGER,
    shoulder_item_id INTEGER,
    chest_item_id INTEGER,
    wrist_item_id INTEGER,
    hands_item_id INTEGER,
    waist_item_id INTEGER,
    legs_item_id INTEGER,
    feet_item_id INTEGER,
    neck_item_id INTEGER,
    ring1_item_id INTEGER,
    ring2_item_id INTEGER,
    trinket1_item_id INTEGER,
    trinket2_item_id INTEGER,
    weapon_item_id INTEGER,
    offhand_item_id INTEGER,

    -- Talents
    talent_spec TEXT,        -- "Protection", "Fire", etc.
    talent_points_spent TEXT, -- JSON: {"node_1": 5, "node_2": 3, ...}

    -- Professions
    profession1 TEXT,
    profession1_skill INTEGER,
    profession2 TEXT,
    profession2_skill INTEGER,
    cooking_skill INTEGER,
    fishing_skill INTEGER,
    first_aid_skill INTEGER,

    -- State
    current_activity TEXT,   -- "idle", "grinding", "dungeon", etc.
    activity_data TEXT,      -- JSON with activity-specific data
    last_tick INTEGER,       -- Unix timestamp of last simulation tick

    -- Companion Progress (JSON: {"deadhollow_crypt": 15, "molten_sanctum": 3, ...})
    companion_clears TEXT,   -- Tracks clears per dungeon/raid for companion quality

    -- Flags
    is_rested INTEGER,       -- Boolean (0/1)
    rested_xp INTEGER,
    death_count INTEGER,

    FOREIGN KEY (head_item_id) REFERENCES items(id)
    -- ... (foreign keys for all gear slots)
);

-- Inventory
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    item_template_id INTEGER, -- References game data (items.json)
    quantity INTEGER,
    is_equipped INTEGER,      -- Boolean
    bag_slot INTEGER,
    position INTEGER,
    durability INTEGER,

    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Quest Progress
CREATE TABLE quest_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    quest_id INTEGER,
    status TEXT,             -- "available", "active", "complete", "turned_in"
    progress TEXT,           -- JSON: {"objective_1": 5, "objective_2": 10, ...}

    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Account-Wide Progress
CREATE TABLE account_data (
    id INTEGER PRIMARY KEY,
    gold INTEGER,            -- Shared gold across all characters
    guild_hall_level INTEGER,
    guild_upgrades TEXT,     -- JSON
    heirloom_unlocks TEXT,   -- JSON array of unlocked heirlooms
    mount_unlocks TEXT,      -- JSON array
    title_unlocks TEXT,      -- JSON array
    achievement_progress TEXT, -- JSON
    transmog_unlocks TEXT    -- JSON array of appearance IDs
);

-- Raid Lockouts
CREATE TABLE raid_lockouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    raid_id TEXT,
    reset_timestamp INTEGER, -- When lockout expires
    bosses_killed TEXT,      -- JSON array of boss IDs

    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Auction House (simulated)
CREATE TABLE auction_house (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_template_id INTEGER,
    quantity INTEGER,
    current_bid INTEGER,
    buyout_price INTEGER,
    expires_at INTEGER,      -- Unix timestamp
    seller TEXT              -- "Player" or "NPC_Vendor"
);

-- Combat Log (optional, for debugging/analysis)
CREATE TABLE combat_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    character_id INTEGER,
    event_type TEXT,         -- "damage_dealt", "damage_taken", "heal", etc.
    amount INTEGER,
    target TEXT,
    ability TEXT
);
```

### Save/Load Process

**Auto-Save:**
- Triggers every 60 seconds (configurable)
- Saves on activity completion (quest turn-in, dungeon clear, etc.)
- Saves on app close

**Load Process:**
1. Read save file metadata (show save slots with preview info)
2. Player selects save
3. Load entire database into memory (SQLite is fast, <50 MB files)
4. Hydrate game state from database
5. Calculate idle progress

**Corruption Protection:**
- Before saving, create `.bak` backup of previous save
- If save fails mid-write, restore from backup
- Validate database integrity on load (SQLite PRAGMA checks)
- If corrupted, attempt recovery from backup

### Save Versioning & Migrations

**Version Format:** Semantic versioning (e.g., "1.0.0", "1.1.0", "2.0.0")

```typescript
function migrateSave(db: Database, fromVersion: string, toVersion: string) {
    const migrations = [
        { from: "1.0.0", to: "1.1.0", script: migration_1_0_to_1_1 },
        { from: "1.1.0", to: "1.2.0", script: migration_1_1_to_1_2 },
    ];

    for (const migration of migrations) {
        if (shouldApply(fromVersion, toVersion, migration)) {
            migration.script(db);
        }
    }
}

function migration_1_0_to_1_1(db: Database) {
    db.exec("ALTER TABLE characters ADD COLUMN jewelcrafting_skill INTEGER DEFAULT 0");
}
```

**Backward Compatibility:**
- Game always saves in latest format
- Can load saves from previous versions (auto-migrates)
- Cannot load saves from future versions (show error)

---

## IDLE TIME CALCULATION

### How Offline Progress Works

**Core Concept:**
When player closes game and reopens later, game simulates time passed at reduced efficiency.

**Process:**
1. **On Game Close:** Save current timestamp, activity, and parameters per character
2. **On Game Open:** Calculate `offline_seconds = current_time - last_save_time`, simulate each character's activity, apply efficiency penalties, award loot/XP/progress
3. **Show Summary:** "You were away for 8 hours. Here's what happened..."

### Activity Simulation Code

**1. Grinding (Mob Killing)**
```typescript
function simulateGrinding(character: Character, seconds: number): GrindResult {
    const zone = character.current_zone;
    const mob_level = zone.level_range.max;

    const base_kill_rate = 1 / 30; // 1 mob per 30 seconds (active)
    const idle_penalty = 0.8;      // 80% efficiency while idle
    const kill_rate = base_kill_rate * idle_penalty;

    const total_kills = Math.floor(seconds * kill_rate);

    const xp_per_mob = calculateMobXP(mob_level, character.level);
    const total_xp = total_kills * xp_per_mob * character.xp_modifiers;

    const gold = total_kills * mob_level * randomRange(0.4, 0.8);
    const items = rollLoot(total_kills, zone.loot_table);

    const death_chance = 0.001 * seconds;
    const deaths = Math.floor(Math.random() * death_chance);

    return {
        kills: total_kills,
        xp: total_xp,
        gold: gold,
        items: items,
        deaths: deaths,
        time_lost_to_deaths: deaths * 120
    };
}
```

**2. Questing**
```typescript
function simulateQuesting(character: Character, seconds: number): QuestResult {
    const active_quest = character.active_quest;
    const objective = active_quest.current_objective;

    const base_progress_rate = objective.base_rate;
    const idle_penalty = 0.75;
    const progress_rate = base_progress_rate * idle_penalty;

    const progress_made = (seconds / 3600) * progress_rate;
    const new_progress = Math.min(
        objective.current + progress_made,
        objective.required
    );

    const completed = new_progress >= objective.required;

    return {
        progress: new_progress,
        completed: completed,
        ready_to_turn_in: active_quest.all_objectives_complete
    };
}
```

**3. Dungeon Farming**
```typescript
function simulateDungeonFarming(character: Character, seconds: number): DungeonResult {
    const dungeon = character.current_dungeon;

    // Generate simulated party based on character spec
    const companions = generateCompanions(character, dungeon);

    const base_clear_time = dungeon.average_time;
    const character_power = calculateCharacterPower(character);
    const companion_quality = getCompanionQuality(character, dungeon);
    const party_power = character_power + (companion_quality * 4); // 1 char + 4 companions
    const success_chance = calculateSuccessRate(party_power, dungeon.difficulty);

    const idle_penalty = 0.7;
    const effective_clear_time = base_clear_time / idle_penalty;

    const attempts = Math.floor(seconds / effective_clear_time);
    const successes = Math.floor(attempts * success_chance);
    const failures = attempts - successes;

    const loot = [];
    for (let i = 0; i < successes; i++) {
        loot.push(...rollDungeonLoot(dungeon));
    }

    return {
        attempts, successes, failures, loot,
        xp: successes * dungeon.xp_reward,
        gold: successes * dungeon.gold_reward
    };
}

function generateCompanions(character: Character, content: Dungeon | Raid): Companion[] {
    const charRole = detectRole(character);
    const companions = [];

    if (charRole === 'tank') {
        companions.push(createCompanion('healer', content));
        companions.push(createCompanion('dps', content));
        companions.push(createCompanion('dps', content));
        companions.push(createCompanion('dps', content));
    } else if (charRole === 'healer') {
        companions.push(createCompanion('tank', content));
        companions.push(createCompanion('dps', content));
        companions.push(createCompanion('dps', content));
        companions.push(createCompanion('dps', content));
    } else { // dps
        companions.push(createCompanion('tank', content));
        companions.push(createCompanion('healer', content));
        companions.push(createCompanion('dps', content));
        companions.push(createCompanion('dps', content));
    }

    return companions;
}
```

**4. Profession Gathering**
```typescript
function simulateGathering(character: Character, seconds: number): GatherResult {
    const profession = character.profession1;
    const zone = character.current_zone;

    const base_gather_rate = 1 / 300; // 1 node per 5 minutes
    const idle_penalty = 0.85;
    const gather_rate = base_gather_rate * idle_penalty;

    const total_gathers = Math.floor(seconds * gather_rate);

    const materials = {};
    for (let i = 0; i < total_gathers; i++) {
        const mat = rollGatherLoot(profession, zone, character.skill);
        materials[mat.id] = (materials[mat.id] || 0) + mat.quantity;

        if (Math.random() < 0.3 && character[profession + "_skill"] < 300) {
            character[profession + "_skill"]++;
        }
    }

    return {
        gathers: total_gathers,
        materials: materials,
        skill_ups: character[profession + "_skill"] - initial_skill
    };
}
```

**5. Crafting**
```typescript
function simulateCrafting(character: Character, seconds: number): CraftResult {
    const queue = character.crafting_queue;
    const results = [];
    let remaining_time = seconds;

    for (const craft of queue) {
        const craft_time = craft.recipe.time;
        const craftable = Math.floor(remaining_time / craft_time);
        const count = Math.min(craftable, craft.quantity);

        if (!hasMaterials(character, craft.recipe, count)) break;

        consumeMaterials(character, craft.recipe, count);

        for (let i = 0; i < count; i++) {
            const item = createItem(craft.recipe.result);
            if (Math.random() < 0.1) item.quality = "Rare";
            results.push(item);
        }

        remaining_time -= count * craft_time;
        if (remaining_time <= 0) break;
    }

    return { crafted_items: results, time_spent: seconds - remaining_time };
}
```

**6. Raids (NOT Simulated)**
- Raids CANNOT be simulated while idle — they require manual play

### Efficiency Penalties

| Activity | Active Efficiency | Idle Efficiency | Penalty |
|----------|-------------------|-----------------|---------|
| Grinding | 100% | 80% | -20% |
| Questing | 100% | 75% | -25% |
| Dungeons | 100% | 70% | -30% |
| Gathering | 100% | 85% | -15% |
| Crafting | 100% | 95% | -5% |
| Fishing | 100% | 90% | -10% |
| Raids | 100% | 0% | N/A |

**Rested XP Bonus (Balances Penalty):**
- While idle, characters accumulate Rested XP
- When you return, that Rested XP gives +100% XP gain
- Effectively makes idle XP competitive with active play

### Cloud Save Support (Optional Future Feature)

NOT included in v1.0 (offline-only), but architecture supports it:
- Players can manually upload `.db` file to cloud storage
- Community can share save files for challenges
