# Dungeon Design

> **Role:** Complete dungeon content reference. Contains all 6 dungeons with every boss mechanic, ability, strategy, and loot table.
> **Related files:** `00_overview_and_decisions.md` (design pillars), `02_character_and_combat.md` (combat formulas used by bosses)

---

## DUNGEON OVERVIEW

**Total Dungeons:** 6 (leveling progression)
**Party Composition:** 1 tank, 1 healer, 3 DPS (NPC companions auto-generated based on your spec)
**Lockout:** Daily lockout per dungeon (resets at 3:00 AM local)
**Difficulty Philosophy:** One difficulty — challenging by default. Finishing a dungeon is an accomplishment, not a stepping stone to harder modes.

| # | Dungeon | Level Range | Location | Bosses | Length |
|---|---------|-------------|----------|--------|--------|
| 1 | The Deadhollow Crypt | 15-18 | Thornwood Forest | 3 | 25-35 min |
| 2 | Irondeep Forge | 22-25 | Irondeep Mines | 4 | 35-45 min |
| 3 | Tide's End Grotto | 28-32 | Mistral Coast | 4 | 40-50 min |
| 4 | Emberpeak Caldera | 35-40 | Emberpeak Mountains | 4 | 45-55 min |
| 5 | The Dreamspire | 48-52 | Starfall Highlands | 5 | 50-60 min |
| 6 | Hall of the Frost King | 55-60 | The Frozen Reach | 5 | 60-75 min |

**Scaling at Level 60:**
Once you reach level 60, all dungeons scale to level 60 with increased HP/damage to remain challenging. These become your primary source of pre-raid gear.

---

## SIMULATED PARTY SYSTEM

**Core Philosophy:** Each character is fully independent. When you enter a dungeon, the game generates NPC companions to fill your party based on your spec.

### How It Works

**1. Spec Detection:**
The game analyzes your talent spec and determines your role:
- Tank-specced (Protection Warrior, Feral Druid in bear, etc.) → You tank, get 1 healer + 3 DPS companions
- Healer-specced (Holy Cleric, Resto Druid, etc.) → You heal, get 1 tank + 3 DPS companions
- DPS-specced (all others) → You DPS, get 1 tank + 1 healer + 2 DPS companions
- Hybrid builds → Smart detection based on highest talent tree investment

**2. NPC Companion Generation:**
- Companions are appropriately geared for the content (within ~5 iLvl of the dungeon)
- Class distribution is balanced (melee/ranged/caster mix)
- Companions have appropriate abilities and use them intelligently
- They follow basic MMO AI: tanks hold aggro, healers heal, DPS does damage

**3. NPC Companion Quality Tiers:**

| Quality | iLvl Relative to Content | Performance | Unlock Condition |
|---------|--------------------------|-------------|------------------|
| Recruit | -10 iLvl | 70% efficiency | Default |
| Veteran | Content-level | 85% efficiency | Complete dungeon once |
| Elite | +5 iLvl | 100% efficiency | Complete 10 times |
| Champion | +10 iLvl | 115% efficiency | Complete 25 times |

**Performance** means DPS output, healing throughput, and tank survivability relative to a perfectly-played player character.

**4. Dungeon Runs:**
- You control your character directly during active play
- During idle simulation, the party functions at reduced efficiency (see `01_core_engine_architecture.md`)
- Success rate depends on: your gear, companion quality, and content difficulty

**5. Raid Scaling:**
For 10-man raids: You + 9 companions
For 20-man raids: You + 19 companions (or bring multiple of your own characters + fill remaining slots with companions)

If you bring multiple of your own characters to a raid, they each act independently with their own control during active play, or are simulated during idle.

---

## DUNGEON 1: THE DEADHOLLOW CRYPT

**Level Range:** 15-18 (leveling) / 60 (scaled)
**Location:** Beneath the Thornwood Chapel, Thornwood Forest
**Theme:** Undead catacombs, corrupted burial grounds
**Trash Count:** 12 packs (3-5 mobs each)

### Boss 1: Gravedigger Morten
**Role:** Introductory boss, teaches interrupts
**HP:** 15,000 (leveling) / 220,000 (level 60)

**Abilities:**
1. **Grave Bolt** (3s cast, every 8s) — Shadow damage to random: 800 (leveling) / 4,500 (60). Interruptible. If not interrupted: applies DoT 500/tick for 6s
2. **Summon Skeletal Adds** (at 75%, 50%, 25%) — 2 Skeletal Warriors (5,000 HP each at leveling / 35,000 at 60). Must AoE down.
3. **Corpse Explosion** (targets dead adds) — Explodes dead skeletons within 10yds: 1,200 AoE (leveling) / 5,500 (60). Counter: kill adds away from party.

**Strategy:** Interrupt Grave Bolt. Kill adds quickly with AoE. Move away from dead adds before Corpse Explosion. DPS check: moderate.

**Loot (Level 60):** Gravedigger's Spaulders (Str/Sta plate, iLvl 70), Crypt Walker Boots (Agi/Sta leather, iLvl 70), Morten's Cursed Staff (Int/SP staff, iLvl 72)

### Boss 2: The Risen Twins (Elara & Theron)
**Role:** Mechanics check, cleave damage, target switching
**HP:** 12,000 each (leveling) / 190,000 each (level 60)

**Elara (Shadow Caster):**
1. **Shadow Bolt Volley** (every 6s) — Hits all: 600 (leveling) / 2,800 (60)
2. **Dark Binding** (every 20s) — Roots random DPS for 8s

**Theron (Melee Bruiser):**
1. **Cleave** (frontal cone, every 5s) — 1,400 (leveling) / 6,500 (60). Tank faces away.
2. **Charge** (every 15s) — Charges random, stuns 3s, 800 damage (leveling) / 3,200 (60)

**Linked Health:** If one twin >10% HP ahead, both gain Enraged (+50% dmg, +25% speed). Must DPS both evenly.

**Phase 2 (30%):** Twins merge into The Amalgamation. Necrotic Burst every 10s: 1,000 (leveling) / 4,500 (60) party-wide.

**Loot (Level 60):** Twin Soul Blade (Agi/Crit dagger, iLvl 75), Elara's Shadow Cowl (Int/Sta cloth, iLvl 75), Amalgamation Chain (necklace, iLvl 72)

### Boss 3: Archbishop Severus (Final Boss)
**Role:** Multi-phase, heal check, movement
**HP:** 22,000 (leveling) / 310,000 (level 60)

**Phase 1 (100%-60%):**
1. **Holy Fire** (instant, every 7s) — Random: 900 + 200/tick DoT (6s). Dispellable.
2. **Consecration** (ground AoE, every 15s) — 300/tick standing in it (leveling) / 1,500/tick (60). 10s duration.
3. **Renew** (self-heal, 3s cast, every 20s) — Heals 3,000 over 9s (leveling) / 15,000 over 9s (60). Interruptible/dispellable.

**Phase 2 (60%-30%):** Becomes Corrupted.
- Shadow Bolt replaces Holy Fire (higher damage, not dispellable)
- Summons 3 Corrupted Acolytes (8,000 HP leveling / 50,000 HP at 60) — channel Dark Ritual: if not killed in 15s = wipe

**Phase 3 (30%-0%):** Channels Final Requiem — 500/tick increasing by 100/tick (leveling) / 2,500/tick +500 (60). Pure DPS race (~30s max).

**Loot (Level 60):** Severus's Redemption (mace, iLvl 78), Corrupted Archbishop Robes (cloth, iLvl 78), Ring of the Fallen Faith (SP/Crit, iLvl 76), Pattern: Blessed Mantle (Tailoring, rare)

---

## DUNGEON 2: IRONDEEP FORGE

**Level Range:** 22-25 (leveling) / 60 (scaled)
**Location:** Deep beneath Irondeep Mines
**Theme:** Dwarven foundry overrun by Dark Iron rebels

### Boss 1: Foreman Grimstone
**HP:** 28,000 (leveling) / 280,000 (60)

1. **Molten Strike** (every 5s) — Tank buster: 2,000 (leveling) / 8,500 (60). Applies Molten Armor (-10% armor/stack, max 5).
2. **Slag Bomb** (every 12s) — Random location, 3s fuse, 1,500 AoE (leveling) / 6,800 (60). Leaves Slag Pool (500/tick, 30s).
3. **Bellowing Orders** (50%) — Summons 4 Dark Iron Workers (random target, not tankable).

**Loot:** Grimstone's Sledge (2H mace, iLvl 76), Flame-Proof Leggings (plate, iLvl 74)

### Boss 2: The Molten Construct
**HP:** 35,000 (leveling) / 350,000 (60)

1. **Magma Pulse** (every 8s) — Party-wide 700 (leveling) / 3,500 (60)
2. **Molten Armor** (passive) — 50% reduced damage. Removed when Doused.
3. **Core Overload** (every 30s) — 5s channel then wipe. Counter: click Water Valve to douse (interrupts + removes armor for 15s burn window).

**Loot:** Hydraulic Grips (leather, iLvl 76), Molten Core Shard (trinket: +150 SP on use, iLvl 74)

### Boss 3: Overseer Malkorath
**HP:** 32,000 (leveling) / 330,000 (60)

1. **Whip Crack** (every 6s) — Tank: 1,800 (leveling) / 7,800 (60)
2. **Summon Slag Hounds** (at 80/60/40/20%) — 3 hounds (12,000 HP leveling / 80,000 HP at 60). Apply Burning Wounds DoT.
3. **Enrage** — If all 3 hounds alive >10s, boss enrages +100% damage (wipe). Kill hounds fast.
4. **Chain Whip** (every 20s) — Party-wide 600 (leveling) / 3,000 (60)

**Loot:** Overseer's Barbed Whip (1H weapon, iLvl 76), Houndmaster's Striders (leather boots, iLvl 74)

### Boss 4: General Ironbeard (Final Boss)
**HP:** 45,000 (leveling) / 420,000 (60)

**Phase 1 (100%-40%):**
1. **Shield Slam** (every 8s) — Tank: 2,200 (leveling) / 9,500 (60)
2. **Whirlwind** (every 15s) — 4s duration, 800/tick (leveling) / 3,800/tick (60), melee flee (>10 yds)
3. **Reinforcements** (every 30s) — 2 Dark Iron Soldiers (15,000 HP leveling / 95,000 at 60). +10% boss damage per active soldier.

**Phase 2 (40%-0%):** Drops shield, dual-wields.
- Loses armor (+25% damage taken), gains Reckless Fury (+50% speed, +30% dmg)
- Execute on targets <25%: one-shot unless full HP
- Soldiers summon faster (every 20s)

**Loot:** Ironbeard's Bulwark (shield, iLvl 82, BiS tank pre-raid), General's Waraxe (1H axe, iLvl 82), Emberforged Breastplate (plate, iLvl 82)

---

## DUNGEON 3: TIDE'S END GROTTO

**Level Range:** 28-32 (leveling) / 60 (scaled)
**Location:** Coastal sea caves, Mistral Coast
**Theme:** Naga invasion, underwater chambers

### Boss 1: Tidehunter Captain
**HP:** 42,000 (leveling) / 380,000 (60)

1. **Trident Strike** (tank, every 5s): 2,400 (leveling) / 9,200 (60)
2. **Tidal Wave** (every 20s): Party-wide knockback + 1,800 (leveling) / 7,200 (60)
3. **Summon Murlocs** (at 70%, 40%): 6 murlocs (8,000 HP leveling / 55,000 at 60), AoE them down

**Loot:** Tidehunter's Trident (polearm, iLvl 78), Waterlogged Boots (mail, iLvl 76)

### Boss 2: Lady Szera the Sea Witch
**HP:** 38,000 (leveling) / 360,000 (60)

1. **Frost Bolt** (every 6s): Random target, 1,600 + slow (leveling) / 6,500 + slow (60)
2. **Frost Nova** (every 15s): Roots all within 10yds, 8s duration
3. **Summon Water Elemental** (50%): 25,000 HP (leveling) / 140,000 (60), must kill or heals boss
4. **Ice Tomb** (every 30s): Traps random player in ice, 8s or 15,000 damage to break

**Loot:** Szera's Coral Staff (staff, iLvl 80), Sea Witch Robes (cloth, iLvl 78)

### Boss 3: The Drowned Horror
**HP:** 45,000 (leveling) / 400,000 (60)

1. **Crushing Tentacle** (tank, every 7s): 2,800 (leveling) / 10,500 (60)
2. **Ink Cloud** (every 25s): Blinds all, -90% hit chance for 6s, dispellable
3. **Summon Tentacles** (at 75%, 50%, 25%): 4 tentacles (12,000 HP leveling / 70,000 at 60), kill to continue DPS on boss
4. **Enrage** (5 minutes): Soft enrage, stacking damage over time

**Loot:** Tentacle Strangler (leather gloves, iLvl 78), Horror's Eye (trinket, iLvl 76)

### Boss 4: Leviathan Deepmaw (Final Boss)
**HP:** 58,000 (leveling) / 480,000 (60)

**Phase 1 (100%-40%):**
1. **Bite** (tank, every 6s): 3,200 (leveling) / 12,000 (60) + bleed DoT
2. **Tail Swipe** (rear cone, every 12s): 2,500 (leveling) / 9,500 (60) + knockback
3. **Whirlpool** (every 30s): Creates vortex, pulls all toward center, 800/tick (leveling) / 3,500/tick (60)

**Phase 2 (40%-0%):** Submerges
- 8 Deepmaw Hatchlings spawn (15,000 HP leveling / 85,000 at 60)
- Kill all within 45s or boss returns at full HP
- After hatchlings dead, boss emerges at 40% HP, continues Phase 1 abilities + Frenzy (+50% attack speed)

**Loot:** Deepmaw's Fang (dagger, iLvl 84), Leviathan Scale Armor (mail chest, iLvl 84), Tidebreaker Ring (iLvl 80)

---

## DUNGEON 4: EMBERPEAK CALDERA

**Level Range:** 35-40 (leveling) / 60 (scaled)
**Location:** Volcanic caldera, Emberpeak Mountains
**Theme:** Fire elementals, dark iron cultists

### Boss 1: Flamecaller Embris
**HP:** 52,000 (leveling) / 440,000 (60)

1. **Fireball** (every 5s): Random target, 2,200 (leveling) / 8,800 (60)
2. **Fire Shield** (every 20s): Reflects 50% damage for 10s, dispellable
3. **Pyroblast** (every 30s): 6s cast, 8,000 (leveling) / 28,000 (60), interruptible
4. **Summon Fire Imps** (at 60%, 30%): 5 imps (10,000 HP leveling / 65,000 at 60)

**Loot:** Embris's Flamestave (staff, iLvl 82), Flamecaller Mantle (cloth shoulders, iLvl 80)

### Boss 2: Molten Giant Gorthak
**HP:** 68,000 (leveling) / 520,000 (60)

1. **Molten Fist** (tank, every 7s): 3,500 (leveling) / 13,500 (60)
2. **Lava Eruption** (every 15s): Ground AoE, 2s warning, 3,500 (leveling) / 13,000 (60)
3. **Petrify** (every 25s): Stuns random player 8s, takes 50% extra damage
4. **Hardened Magma** (passive): +100% armor, removed by frost damage for 10s

**Loot:** Gorthak's Slab (shield, iLvl 84), Molten Core (trinket, iLvl 80)

### Boss 3: The Ember Twins (Fire & Ash)
**HP:** 35,000 each (leveling) / 310,000 each (60)

**Fire Twin:**
1. **Flame Burst** (AoE, every 10s): 1,800 (leveling) / 7,200 (60)
2. **Ignite** (debuff): Stacking fire DoT

**Ash Twin:**
1. **Ash Cloud** (AoE, every 10s): -50% healing for 8s
2. **Smother** (tank): -25% damage output for 10s

**Linked:** If >15% HP apart, both enrage. Must kill within 10s of each other.

**Loot:** Twin Emberblades (matched daggers, iLvl 84), Ashweave Robes (cloth, iLvl 82)

### Boss 4: Ignathar the Eternal Flame (Final Boss)
**HP:** 75,000 (leveling) / 580,000 (60)

**Phase 1 (100%-60%):**
1. **Flame Strike** (tank, every 6s): 3,800 (leveling) / 14,500 (60)
2. **Ring of Fire** (every 20s): Creates expanding ring, 4,000 (leveling) / 15,000 (60) if hit
3. **Summon Fire Elemental** (every 25s): 28,000 HP (leveling) / 150,000 (60)

**Phase 2 (60%-30%):**
- All Phase 1 abilities
- **Meteor** (every 15s): Targets random location, 5s warning, 6,000 AoE (leveling) / 22,000 (60)

**Phase 3 (30%-0%):**
- All previous abilities
- **Inferno** (at 30%, 15%, 5%): 5s channel, 10,000 party-wide (leveling) / 35,000 (60), MUST interrupt

**Loot:** Ignathar's Flamebrand (2H sword, iLvl 88), Eternal Ember (trinket, iLvl 86), Flame-Touched Legplates (plate, iLvl 88)

---

## DUNGEON 5: THE DREAMSPIRE

**Level Range:** 48-52 (leveling) / 60 (scaled)
**Location:** Floating arcane tower, Starfall Highlands
**Theme:** Reality-bending magic, arcane anomalies, mad mage

### Boss 1: Arcane Sentinel MK-VII
**HP:** 68,000 (leveling) / 520,000 (60)

1. **Arcane Barrage** (2s cast, every 7s) — 5 missiles at random: 800 each (leveling) / 3,800 (60). Interruptible.
2. **Overcharge** (self-buff, every 20s) — +50% damage 10s. Dispellable. Stacks if not removed.
3. **Arcane Explosion** (at 75/50/25%) — Party-wide 1,400 (leveling) / 6,800 (60)
4. **Repair Drones** (40%) — 3 drones (10,000 HP leveling / 70,000 at 60), heal boss 5%/3s. Kill fast.

**Loot:** Sentinel's Arcane Core (trinket, iLvl 86), MK-VII Plating (bracers, iLvl 84)

### Boss 2: Illusionist Vexara
**HP:** 62,000 (leveling) / 480,000 (60)

1. **Arcane Missiles** (channeled, every 10s) — 1,200 over 3s (leveling) / 5,500 (60). Interruptible.
2. **Mirror Image** (at 80/60/40/20%) — Creates 3 copies. Only real boss casts spells. Illusions take 1% damage, hitting them applies Arcane Backlash (500 to attacker).
3. **Polymorph** (every 25s) — Random DPS → sheep 8s. Dispellable.
4. **Prismatic Burst** (every 15s) — All 4 bosses cast simultaneously. Confusion.

**Loot:** Vexara's Staff (Int/SP, iLvl 88), Prismatic Spellthread (cloth belt, iLvl 86)

### Boss 3: Timewarden Kaelthor
**HP:** 70,000 (leveling) / 510,000 (60)

1. **Temporal Bolt** (every 6s) — Tank: 2,600 (leveling) / 11,500 (60)
2. **Slow Time** (AoE, every 20s) — -50% attack/cast speed 10s. Dispellable. Critical to remove.
3. **Haste Time** (self-buff, every 30s) — +100% speed 8s. Tank CDs.
4. **Time Loop** (50%, once) — Rewinds fight 10s. All HP/mana/CDs restored to 10s ago.
5. **Summon Past Self** (30%) — Spawns 30% HP copy. Both must die within 20s.

**Loot:** Timewarden's Hourglass (trinket, iLvl 88), Chronoshifted Robes (cloth, iLvl 88)

### Boss 4: The Dreaming Amalgam
**HP:** 85,000 (leveling) / 590,000 (60)

1. **Nightmare Strike** (every 5s) — Tank: 2,800 shadow (leveling) / 12,500 (60) + Waking Nightmare DoT
2. **Sanity Drain** (passive) — Lose 1 Sanity/sec (start at 100). At 0: Mind Break (feared 15s, attack party).
3. **Nightmare Add** (every 12s) — 1 Horror (15,000 HP leveling / 95,000 at 60). Kill to restore 20 Sanity to killer.
4. **Dream Collapse** (25%) — Sanity drain increases to 3/sec. Soft enrage.

**UI Element:** Sanity bar per party member with warnings at 30/20/10.

**Loot:** Nightmare's Grasp (shadow trinket, iLvl 88), Amalgam Bindings (cloth bracers, iLvl 86)

### Boss 5: Archmage Thalyssian the Mad (Final Boss)
**HP:** 95,000 (leveling) / 650,000 (60)

**Phase 1: Fire (100%-66%):**
- Fireball (every 5s), Living Bomb (every 15s, run away), Summon Fire Elemental (every 20s, explodes on death)

**Phase 2: Frost (66%-33%):**
- Frostbolt + slow, Blizzard ground AoE, Ice Tomb (every 25s, DPS ice block 20,000 HP leveling / 125,000 at 60 to free, 10s or die)

**Phase 3: Arcane (33%-0%):**
- Arcane Blast (tank, stacks +10% boss damage permanently), Arcane Missiles barrage, Dimension Rift (teleports player to Void Realm, click Escape Portal), Evocation at 10% (8s channel restoring 50% HP, MUST interrupt)

**Loot:** Thalyssian's Spellblade (1H sword, iLvl 92, BiS caster pre-raid), Madness Incarnate (trinket, iLvl 92), Archmage's Dreamweave Mantle (cloth shoulders, iLvl 92), Codex of Infinite Mysteries (Mage tome)

---

## DUNGEON 6: HALL OF THE FROST KING

**Level Range:** 55-60 (leveling) / 60 (scaled)
**Location:** Ice citadel, The Frozen Reach
**Theme:** Frost giants, undead armies, frozen throne room

### Boss 1: Frostbound Juggernaut
**HP:** 95,000 (leveling) / 680,000 (60)

1. **Glacial Slam** (every 6s) — Tank: 3,500 (leveling) / 14,800 (60). Frostbite stacking slow (-10% speed/stack).
2. **Permafrost Armor** (passive) — 50% physical resist. Removed by fire damage for 8s.
3. **Ice Spike** (every 15s) — Ground spike under random player: 2,000 (leveling) / 9,200 (60) + knockup. 1.5s telegraph.
4. **Frozen Tomb** (50%) — Self-encases. Spawns 4 Frost Elementals (22,000 HP leveling / 135,000 at 60). Kill all to continue.

**Loot:** Juggernaut's Icy Bulwark (shield, iLvl 90), Permafrost Sabatons (boots, iLvl 88)

### Boss 2: Warlord Grimmfang & Frostmaw
**HP:** Grimmfang 80,000 (leveling) / 580,000 (60) | Frostmaw 65,000 (leveling) / 480,000 (60)

**Phase 1 (Mounted):** Charge (tramples, 2,500 leveling / 11,500 at 60), Frost Breath (cone, 1,800 leveling / 8,200 at 60), Spear Throw (ranged, 1,600 leveling / 7,200 at 60)
**Phase 2 (Frostmaw dead):** Whirlwind, Enrage (+30% dmg), Ground Slam (party-wide)
**Kill Order:** Frostmaw first.

**Loot:** Frostforged Spear (polearm, iLvl 92), Frostmaw's Pelt (leather chest, iLvl 90)

### Boss 3: High Priestess Ysindra
**HP:** 88,000 (leveling) / 640,000 (60)

1. Shadow Bolt (every 5s), 2. Raise Dead (every 20s, 3 corpses 25,000 HP leveling / 155,000 at 60), 3. Death and Decay (ground), 4. Army of the Dead (30%, 10 skeletons 15,000 HP leveling / 95,000 at 60, AoE check in 30s)

**Loot:** Ysindra's Deathchill Orb (off-hand, iLvl 92), Necromancer's Frozen Wraps (cloth gloves, iLvl 90)

### Boss 4: The Icebound Twins
**HP:** 70,000 each (leveling) / 520,000 each (60)

**Frostbite** (melee): Glacial Strike tank buster. **Chillfrost** (caster): Ice Lance, Frost Nova.
**Frozen Bond:** Within 10yds = +100% damage. Tank apart.
**Permafrost Convergence** (every 40s): Both channel. Interrupt at least ONE or wipe.
**Kill evenly** (within 15% or survivor enrages).

**Loot:** Icebound Gauntlets (plate, iLvl 92), Frostforged Chain (necklace, iLvl 90)

### Boss 5: Bjornskar the Frost King (Final Boss)
**HP:** 120,000 (leveling) / 820,000 (60)

**Phase 1 (100%-75%):** Frostbrand Strike (tank DoT), Frozen Orb (bounces between players), Summon Ice Elemental (28,000 HP leveling / 175,000 at 60)
**Phase 2 (75%-50%):** Enrages. Frost Cleave (frontal), Blizzard (entire room 300 leveling / 1,500 at 60 /tick), Summon Frozen Champion (60,000 HP leveling / 380,000 at 60)
**Phase 3 (50%-25%):** Sits on throne, immune. Frozen Chains on 3 players (break chains 30,000 HP leveling / 185,000 at 60 each). 4 Frost Guards (40,000 HP leveling / 250,000 at 60). Kill all + break chains.
**Phase 4 (25%-0%):** All Phase 1 abilities + Frozen Tomb (every 30s, 25,000 HP leveling / 155,000 at 60 ice block) + Absolute Zero at 10% (6s channel = wipe, interrupt or kill)

**Loot:** Bjornskar's Icebreaker (2H axe, iLvl 98, BiS pre-raid), Frost King's Crown (helm, iLvl 98), Frozen Throne Legguards (legs, iLvl 98), Cloak of Eternal Winter (cloak, iLvl 95), Pattern: Glacial Armor Kit (LW recipe)

---

## DUNGEON REWARDS & PROGRESSION

**Loot Philosophy:**
- Each boss drops 2-3 items appropriate for a 5-player party
- Smart loot system prioritizes upgrades for your character and spec
- Level 60 versions of dungeons are your primary pre-raid gearing path
- Daily lockout encourages running different dungeons each day

**Expected Clears for Full Gear:**
- 15-25 dungeon runs to get a full set of pre-raid Best-in-Slot (BiS) gear
- Some items are BiS until raids (e.g., Ironbeard's Bulwark, Bjornskar's Icebreaker)

**Progression Path:**
1. Level through dungeons (15-60), getting upgrades along the way
2. At 60, farm dungeons daily for iLvl 70-98 gear
3. Once geared (~iLvl 85 average), attempt raids
4. Raid gear (iLvl 95-135) eventually replaces dungeon gear

**No Artificial Scaling:**
Dungeons are hard. Beating them feels like an accomplishment. Once you can farm them, you farm them for loot. No timers, no affixes, no leaderboards — just challenging content and rewarding loot.
