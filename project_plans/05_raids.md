# Raid Design — Complete Specifications

> **Role:** Endgame raid content reference. Contains all 4 raid tiers with every boss encounter.
> **Related files:** `00_overview_and_decisions.md` (design pillars), `02_character_and_combat.md` (combat formulas), `06_economy_and_professions.md` (raid consumables/crafting)

---

## RAID OVERVIEW

**Total Raids:** 4 progressive tiers
**Party Sizes:** 10-character (Tier 1-2) or 20-character (Tier 3-4)
**Party Composition:** You + simulated NPC companions (or bring multiple of your own characters)
**Lockout:** Weekly (resets Tuesday 3:00 AM local)
**Cannot be idled:** Raids require manual activation and oversight
**Difficulty Philosophy:** One difficulty — raids are hard. Clearing a raid is a major accomplishment.

| Tier | Raid | Size | Bosses | Req iLvl | Clear Time | Theme |
|------|------|------|--------|----------|------------|-------|
| 1 | The Molten Sanctum | 10 | 6 | 85+ | 2-3 hrs | Fire temple, elemental prison |
| 2 | Tomb of the Ancients | 10 | 8 | 95+ | 3-4 hrs | Necropolis, undead pharaohs |
| 3 | The Shattered Citadel | 20 | 10 | 105+ | 4-6 hrs | Planar fortress, void incursions |
| 4 | Throne of the Void King | 20 | 12 | 115+ | 5-8 hrs | Void realm, final challenge |

---

## SIMULATED PARTY FOR RAIDS

**10-Man Raids:**
- You control 1 character (or more if you have multiple alts geared)
- Remaining slots filled with NPC companions
- Composition: 2 tanks, 2-3 healers, 5-6 DPS

**20-Man Raids:**
- You control 1+ characters
- Remaining slots filled with NPC companions
- Composition: 3-4 tanks, 5-6 healers, 10-12 DPS

**NPC Companion Quality (Raids):**
Same as dungeons — unlocking higher quality companions through repeated clears makes subsequent attempts easier.

| Quality | Performance | Unlock Condition |
|---------|-------------|------------------|
| Recruit | 70% efficiency | Default |
| Veteran | 85% efficiency | Complete raid once |
| Elite | 100% efficiency | Complete 5 times |
| Champion | 115% efficiency | Complete 15 times |

**Strategy:**
Your first clear of a raid is the hardest — you're learning mechanics with Recruit-tier companions. Each clear improves your companions, making farming easier. This simulates the "guild progression" experience.

---

## RAID TIER 1: THE MOLTEN SANCTUM

**Composition:** 2 Tanks, 2-3 Healers, 5-6 DPS (need 2+ ranged, 1+ AoE)

### Boss 1: Emberwing (Drake Gatekeeper)
**HP:** 850,000 | **Type:** Intro boss, fire resist check

- **Flame Breath** (frontal cone, every 12s): 8,000 fire. Tank faces away.
- **Tail Swipe** (rear, every 15s): 5,000 + knockback. No one behind.
- **Wing Buffet** (raid-wide, every 20s): 3,500 to all.
- **Molten Feathers** (every 25s): 5 ground hazards, 2,000/tick, persist 20s (soft enrage).
- **Phase 2 (40%):** Flight phase. Rain of Fire 1,500/tick. 4 Flamewrought Dragonkin (80,000 HP each). Kill all to bring boss down.

**Loot:** Emberwing's Molten Scale (trinket, iLvl 95), Dragonkin Flameguard (plate, iLvl 98), Wing Talon Dirk (dagger, iLvl 98)

### Boss 2: The Magma Pools (Gauntlet)
Cross 3 pools: Pool 1 (4 Lava Elementals 100k HP), Pool 2 (8 Magma Imps in waves), Pool 3 (2 Flamecaller Champions 200k HP, tank apart).

**Loot:** Molten Waders (boots, iLvl 96), Lavastrider Talisman (trinket, iLvl 95)

### Boss 3: Baron Geddon
**HP:** 1,200,000 | **Type:** Movement, bomb mechanic

- **Inferno** (raid-wide, every 15s): 4,000 fire to all
- **Ignite Armor** (tank, every 20s): -50% armor 20s. **Tank swap mechanic.**
- **Living Bomb** (every 25s): Random player, 8s fuse, 12,000 AoE in 10yds. Run to "bomb corner."
- **Flamewakers** (70%, 40%): 3 adds 120k HP. +10% boss damage per living add.
- **Enrage:** 8 minutes

**Loot:** Geddon's Gauntlets (cloth, iLvl 100), Baron's Bulwark (shield, iLvl 100), Ring of Burning Rage (iLvl 98), **Sulfuron Ingot** (legendary quest, 10% drop)

### Boss 4: Shazzrah the Wicked
**HP:** 980,000 | **Type:** Teleport, interrupts

- **Arcane Explosion** (PB AoE, every 10s): 6,000 in 10yds. Melee run out.
- **Shazzrah's Curse** (every 15s): -50% resists 20s. Dispel immediately.
- **Counterspell** (every 20s): Interrupts + silences random caster 6s.
- **Blink** (every 30s): Teleports randomly, resets threat. Tanks taunt immediately.

**Loot:** Shazzrah's Robes (cloth, iLvl 100), Wicked Spellblade (1H sword, iLvl 100)

### Boss 5: Garr the Firelord (Elite Pack)
**HP:** Garr 1,500,000 + 8 Firesworn (100k each)

- **Magma Shackles** (tank, every 18s): Roots tank 10s.
- **Antimagic Pulse** (raid, every 20s): 3,000 + dispels all buffs.
- **Firesworn Eruption** (on death): 8,000 AoE, heals Garr 20k per player hit. Kill far from raid.
- **Firesworn Immolate** (passive aura): Each living = 400/tick raid damage (8 adds = 3,200/tick).
- **Strategy:** Banish/CC 6 adds, kill 2 at a time far from raid. Slow controlled kills.
- **Hard Mode:** Kill all 8 simultaneously for bonus loot.

**Loot:** Garr's Binding (belt, iLvl 100), Flameguard Gauntlets (tank, iLvl 102), **Bindings of the Windseeker (Left)** (legendary, 5% drop)

### Boss 6: Ignaroth the Bound Flame (Final Boss)
**HP:** 2,000,000 | **Enrage:** 12 minutes

**Phase 1 (100%-75%):** Flame Shock (tank 9,000 + DoT), Lava Burst (random 7,000 + pool), Summon Living Flame (every 20s, 2 fixate adds 60k HP, explode for 15k AoE), Magma Splash (raid 4,500)

**Phase 2 (75%-50%):** Breaks free. +25% damage, +30% speed. All Phase 1 + Knockback (every 25s, resets positioning)

**Phase 3 (50%-25%):** Submerges. 8 Sons of Flame (200k HP each). Split into 2 groups of 4. Kill all within 90s or lava wipe.

**Phase 4 (25%-0%):** All Phase 1+2 mechanics. Cataclysm at 10%, 5% (10s channel, 50,000 raid damage). MUST interrupt with both tanks stunning simultaneously.

**Loot:** **Tier 1 Token** (Head/Shoulder/Chest, iLvl 105), Ignaroth's Fang (2H sword, iLvl 105), Flamebinder's Orb (off-hand, iLvl 105), **Bindings of the Windseeker (Right)** (5% drop), **Eye of Sulfuras** (3% drop)

---

## RAID TIER 2: TOMB OF THE ANCIENTS

**Size:** 10 | **Composition:** 2 Tanks, 2-3 Healers (need dispels), 5-6 DPS

### Boss 1: Guardian Constructs (Four Keepers)
4 bosses (400k HP each, shared health). Kill all within 30s of first death or they resurrect.

**Loot:** Keeper's Stone Heart (trinket, iLvl 102), Ancient Guardian Plate (chest, iLvl 105)

### Boss 2: High Priest An'thos (1,400,000 HP)
Shadow Bolt Volley, Dominate Mind (2 DPS for 15s), Curse of Tongues, Summon Anubisath (250k add at 60%/30%).

**Loot:** An'thos's Shadow Vestments (cloth, iLvl 108), Scepter of the High Priest (1H mace, iLvl 108)

### Boss 3: Plague Wing (Trio, 500k each)
Three plagues spread on contact (Blood/Bile/Rot). All 3 on one player = instant death. Designate plague soakers, stay apart.

**Loot:** Plague-Resistant Boots (mail, iLvl 106), Biohazard Ring (iLvl 104)

### Boss 4: The Undying Twins (1,000,000 each)
Resurrection Bond: dead twin revives at 50% after 10s. Must kill both within 10s.

**Loot:** **Tier 2 Token** (Glove/Belt/Boot, iLvl 110), Twin Scepters (matched set, iLvl 110)

### Boss 5: Embalmer's Chamber (Gauntlet)
Survive 10 waves (90s each): mummies, scarabs, Anubisaths, mini-boss, final mixed wave.

**Loot:** Embalmer's Wraps (cloth bracers, iLvl 108), Scarab Shell (trinket, iLvl 106)

### Boss 6: Vizier Nekh'amon (1,600,000 HP)
Life Drain (interrupt or tank dies + boss heals), Vampiric Embrace (healing also heals boss, stop healing), Shadow Word: Death (executes <30% HP), Shadow Fiend (drains healer mana).

**Loot:** Vizier's Darkweave Mantle (cloth shoulders, iLvl 112), Nekh'amon's Staff (staff, iLvl 112)

### Boss 7: Anubarak the Eternal (1,800,000 HP)
Ground phase (60s): Impale, Locust Swarm, Crypt Guard adds. Burrow phase (30s): 10 Crypt Scarabs fixate and explode. Alternates until dead.

**Loot:** Anubarak's Carapace (plate shoulders, iLvl 112), Chitin Legguards (mail legs, iLvl 110)

### Boss 8: Pharathos the Undying (Final Boss, 2,500,000 HP)
**Phase 1 (100%-66%):** Sand Blast, Sandstorm, Scarabs, Curse of the Pharaoh
**Phase 2 (66%-33%):** Lich Form. Shadow Bolt Volley, Life Drain, Mummies, Army of the Dead (20 skeletons)
**Phase 3 (33%-0%):** Both phases combined. Apocalypse at 10%/5%/1% (8s channel = wipe, interrupt forces boss to take 100k damage).
**Enrage:** 15 minutes

**Loot:** **Tier 2 Token** (Head/Shoulder/Chest/Legs, iLvl 115), Pharathos's Scepter (staff, iLvl 115), Crown of the Undying (helm, iLvl 115), **Phylactery Shard** (legendary quest, 10% drop)

---

## RAID TIER 3: THE SHATTERED CITADEL

**Size:** 20 | **Composition:** 3-4 Tanks, 5-6 Healers, 10-12 DPS

### Boss 1-2: The Rift Sentinels (Twin Gatekeepers, 1,200,000 each)
Raid splits into two 10-player groups in separate rooms. Shared health pool. If one group wipes, both enrage.

**Loot:** Rift Sentinel's Blade (1H sword, iLvl 116), Sentinel's Ward (shield, iLvl 116)

### Boss 3: Voidcaller Xyth'ara (2,800,000 HP)
Void Bolt, Void Zone (expanding), Summon Void Portal (every 45s, 5 players enter sub-realm to fight 500k Aberration).

**Loot:** Voidcaller's Robes (cloth, iLvl 118), Xyth'ara's Tentacle (trinket, iLvl 116)

### Boss 4: The Fractured Council (4 x 800,000 HP)
Strict kill order: Fire → Frost → Nature → Arcane. Wrong order = massive survivor buffs.

**Loot:** Council Member's Regalia (iLvl 118), Elemental Conflux Ring (iLvl 116)

### Boss 5: Planar Rift (Environmental)
Room shifts between 3 planes every 30s (Material/Shadow/Fel). Kill 15 Planar Anomalies (200k HP) across all planes.

**Loot:** Planar-Touched Gloves (iLvl 118), Rift Walker Boots (iLvl 118)

### Boss 6: Thalgrim the Defiler (3,000,000 HP)
Crushing Blow (18k + armor debuff), Defiled Ground, Healer-fixate adds. Tank swap every 3 stacks.

**Loot:** Defiler's Chestplate (plate, iLvl 120), Thalgrim's Crusher (2H mace, iLvl 120)

### Boss 7: Seer Kath'ryn (2,600,000 HP)
Psychic Scream (7k every 8s), Mind Spike (15k instant), Mana Burn. Healer mana management check.

**Loot:** Seer's Mindweave Cowl (cloth helm, iLvl 120), Kath'ryn's Focus (off-hand, iLvl 118)

### Boss 8: The Void Reaver (3,200,000 HP)
Arcane Orb, Pounding (14k every 6s). 10 minute hard enrage. Pure DPS check.

**Loot:** Void Reaver Core (trinket, iLvl 118), Arcane Devastator (2H axe, iLvl 120)

### Boss 9: Archon Malachar (3,500,000 HP)
Phase 1: Tank check. Phase 2: Healer check. Phase 3: DPS check.

**Loot:** **Tier 3 Token** (Gloves/Belt/Boots, iLvl 122), Archon's Regalia (iLvl 122)

### Boss 10: Malachar the Realm Breaker (Final Boss, 4,500,000 HP)
Five phases: Fire → Frost → Shadow → Arcane → All Combined. Reality Tear at 5% (15s channel, interrupt or wipe). **Enrage:** 20 minutes.

**Loot:** **Tier 3 Token** (Head/Shoulder/Chest/Legs, iLvl 128), Malachar's Shattered Blade (legendary 2H, iLvl 130), Realm Breaker's Mantle (cloak, iLvl 128), **Fragment of the Void** (legendary quest, 8% drop)

---

## RAID TIER 4: THRONE OF THE VOID KING

**Size:** 20 | **Bosses:** 12 | **Recommended iLvl:** 115+
**Theme:** Void realm, final boss, ultimate challenge

### Bosses 1-11: Void Court
1. **Void Herald** (2,200,000 HP) — DPS check
   - **Loot:** Herald's Void Crystal (trinket, iLvl 125)
2. **Dimensional Warden** (2,400,000 HP) — Portal mechanics
   - **Loot:** Warden's Dimensional Plate (chest, iLvl 128)
3. **Essence of Suffering** (2,000,000 HP) — DoT fight
   - **Loot:** Suffering's Embrace (cloth robe, iLvl 128)
4. **Essence of Desire** (2,000,000 HP) — Charm mechanics
   - **Loot:** Desire's Caress (leather gloves, iLvl 126)
5. **Essence of Anger** (2,000,000 HP) — Tank survival
   - **Loot:** Anger's Edge (2H sword, iLvl 130)
6. **High Nethermancer** (2,600,000 HP) — Interrupt fight
   - **Loot:** Nethermancer's Spellblade (1H sword, iLvl 130)
7. **Void Dragon Nihilax** (3,000,000 HP) — Flight phases
   - **Loot:** Nihilax's Scale (trinket, iLvl 128), Void Dragon Hide (leather chest, iLvl 130)
8. **The Forgotten One** (2,800,000 HP) — Memory mechanics
   - **Loot:** Memory Shard (trinket, iLvl 128)
9. **Twins of the Void** (1,800,000 each) — Coordinated kill
   - **Loot:** Twin Void Blades (matched daggers, iLvl 130)
10. **Void Council** (5 bosses, 1,000,000 each) — Simultaneous fight
    - **Loot:** **Tier 4 Token** (Gloves/Belt/Boots, iLvl 132)
11. **Harbinger of the End** (3,500,000 HP) — Tests all roles
    - **Loot:** Harbinger's Doomsday Weapon (2H axe, iLvl 132)

### Boss 12: Xal'vothis, the Void King (Final Boss, 6,000,000 HP)
Six phases, 25-30 minute fight.

**Phase 1:** Physical melee | **Phase 2:** Shadow magic | **Phase 3:** Add swarm
**Phase 4:** Void realm (split raid). Reality Anchors: 4 players channel pillars, others fight adds.
**Phase 5:** All previous combined | **Phase 6:** Soft enrage burn (10%-0%)

**Final Burn (10%):** Oblivion — 5,000/sec +500/tick. Must burn 600k HP before overwhelmed.
**Enrage:** 30 minutes

**Loot:**
- **Tier 4 Complete Set** (all slots, iLvl 135-140)
- **Voidscythe of Xal'vothis** (legendary 2H, iLvl 145)
- **Crown of the Void King** (legendary helm, iLvl 145)
- **Mantle of Infinite Darkness** (legendary cloak, iLvl 143)
- **Essence of the Void** (Mount: Voidwing Drake, 100% drop)
- **Codex of Ultimate Power** (teaches Void Form ability)
- **Heart of the Void** (legendary quest, 15% drop)

---

## RAID PROGRESSION & PHILOSOPHY

**One Difficulty, True Challenge:**
Raids are HARD. They're designed to be the pinnacle of PvE content. Your first kill of each raid boss is a genuine achievement.

**Progression Timeline:**
- Week 1-2: Gear up in dungeons (iLvl 85+)
- Week 3-4: Attempt Molten Sanctum, learn mechanics, wipe a lot
- Week 5-8: Clear Molten Sanctum, start farming for gear
- Week 9-12: Move to Tomb of the Ancients
- Month 4-6: Shattered Citadel
- Month 6+: Throne of the Void King

**Weekly Lockouts:**
Each character can loot each raid boss once per week. This creates:
- Scheduled "raid night" feel
- Value for having multiple geared alts
- Meaningful gear upgrades (not instant BiS)

**Companion Progression:**
Your first raid clear is brutal with Recruit companions. By your 15th clear, Champion companions make it feel like a well-oiled machine. This mimics the guild progression experience.

**Hard Modes:**
Some bosses have optional hard modes (like Garr — kill all 8 adds simultaneously). These grant bonus loot and achievements, but are NOT separate difficulty tiers. Same fight, higher risk, better reward.

**No Gear Treadmill Tricks:**
We don't invalidate raid gear with higher difficulties. Tier 4 gear from Void King is THE endgame. Once you have it, you've won. Time to level alts, chase legendaries, collect transmogs, or take a break.

**The Old-School Feel:**
Clearing a raid should feel like defeating a final boss in a single-player RPG. It's the culmination of preparation, learning, and execution. Not a stepping stone to "the real content" — THIS is the real content.
