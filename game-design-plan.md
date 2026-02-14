# Legends of the Shattered Realm — Game Design Plan

## An Idle/Incremental MMORPG inspired by Classic MMOs

---

## 1. VISION & CORE FANTASY

**Elevator Pitch:** A single-player idle MMORPG where you build a roster of classic fantasy heroes, grind them through the leveling journey of a sprawling old-school MMO world, and eventually field raid teams of your own alts against endgame bosses — all through satisfying incremental progression loops.

**Core Fantasy:** Relive the feeling of being a wide-eyed adventurer in a 2004-era MMO. The sense of danger in pulling one too many mobs. The thrill of a rare drop in a dungeon. The progression from a nobody in cloth scraps to a raid-geared legend. But this time, you're building an entire guild of characters — and the grind *is* the game.

**Tone & Aesthetic:** Reverent and slightly nostalgic. Tooltip-heavy UI, WoW-style character paper dolls, quest text that takes itself seriously but has personality. Think: reading quest logs in Stranglethorn Vale, checking the auction house, linking gear in guild chat. The *texture* of classic MMO life, compressed into idle gameplay.

---

## 2. CHARACTER SYSTEM

### 2.1 Character Creation

Each character the player creates has:

- **Name** (player-chosen)
- **Race** (cosmetic/minor passive bonuses — 6 races, split across 2 factions or simply neutral)
- **Class** (core gameplay identity — 8 classes)
- **Active Talent Tree** (chosen specialization within the class)

#### Races (6)

| Race | Passive Bonus |
|------|--------------|
| **Human** | +5% XP gain from all sources |
| **Dwarf** | +5% armor value, +5% mining yield |
| **High Elf** | +5% mana pool, +5% enchanting skill |
| **Orc** | +5% melee damage, +5% smithing yield |
| **Darkfolk** (dark elf/drow) | +5% crit chance, +5% alchemy yield |
| **Halfling** | +5% dodge chance, +5% cooking yield |

Races are intentionally understated — they add flavor and slight optimization without gatekeeping builds.

### 2.2 The 8 Classes

Each class has **3 Talent Trees** (specializations). One tree is typically tank, healer, or support-oriented; the others are DPS flavors. This mirrors classic MMO design where hybrids could respec for different roles.

---

#### ⚔️ WARRIOR
*The archetypal plate-wearing frontliner.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Protection** | Tank | Sword-and-board, shield wall, damage mitigation |
| **Arms** | Melee DPS | Slow, devastating two-handed weapon strikes |
| **Fury** | Melee DPS | Dual-wield frenzy, berserker rage, attack speed |

**Class Mechanic — Rage:** Builds during combat, spent on powerful abilities. Starts each fight at 0.

---

#### 🔥 MAGE
*Master of elemental destruction and arcane power.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Fire** | Ranged DPS | High burst damage, DoTs, combustion |
| **Frost** | Ranged DPS / Control | Slows, freezes, shatter combos, survivability |
| **Arcane** | Ranged DPS | Mana management risk/reward, raw spell power |

**Class Mechanic — Mana:** Finite resource that regenerates. Arcane spec plays a risky burn/conserve game.

---

#### 🙏 CLERIC
*Holy warrior and divine healer.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Holy** | Healer | Direct heals, damage prevention, party sustain |
| **Discipline** | Healer / Support | Shields, atonement (healing through damage) |
| **Retribution** | Melee DPS | Holy-empowered melee strikes, self-sustain |

**Class Mechanic — Divine Favor:** Resource that accumulates from healing or holy damage, enabling powerful burst abilities.

---

#### 🗡️ ROGUE
*Shadow-dwelling assassin and opportunist.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Assassination** | Melee DPS | Poisons, bleeds, damage-over-time stacking |
| **Combat** | Melee DPS | Swashbuckling, consistent DPS, blade flurry |
| **Subtlety** | Melee DPS / Utility | Openers, ambush, high burst from stealth, utility |

**Class Mechanic — Combo Points:** Built by basic attacks, spent on finishing moves. More points = stronger finisher.

---

#### 🏹 RANGER
*Master of the wilds, ranged combat, and beast companions.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Marksmanship** | Ranged DPS | Precise shots, long-range superiority, aimed attacks |
| **Beast Mastery** | Ranged DPS / Pet | Pet does heavy lifting, pet synergy, exotic beasts |
| **Survival** | Melee/Hybrid DPS | Traps, close-range fighting, DoTs, self-reliance |

**Class Mechanic — Focus:** Regenerating resource spent on shots/abilities. Pet management as secondary system.

---

#### 🌿 DRUID
*Shapeshifter and nature's champion.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Restoration** | Healer | HoTs (heal over time), nature magic, group sustain |
| **Feral** | Tank / Melee DPS | Bear form (tank), cat form (DPS), shapeshifting |
| **Balance** | Ranged DPS | Moonfire, starfire, eclipse mechanic, nature/arcane |

**Class Mechanic — Shapeshifting:** Feral spec toggles between bear (tanking) and cat (DPS) forms, each with their own ability set. Balance uses an Eclipse bar.

---

#### 💀 NECROMANCER
*Commander of undead forces and dark magic.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Affliction** | Ranged DPS | Curses, DoTs, life drain, slow inevitable death |
| **Demonology** | Ranged DPS / Pet | Summon powerful undead minions, empower them |
| **Destruction** | Ranged DPS | Shadow and fire burst damage, chaos bolts |

**Class Mechanic — Soul Shards:** Finite consumable resource generated by kills and drain effects, spent on powerful summons and abilities.

---

#### ⚡ SHAMAN
*Elemental caller and spiritual guide.*

| Tree | Role | Fantasy |
|------|------|---------|
| **Elemental** | Ranged DPS | Lightning bolts, lava bursts, chain lightning |
| **Enhancement** | Melee DPS | Weapon imbues, windfury procs, melee-caster hybrid |
| **Restoration** | Healer | Totems, chain heal, earth shield, group healing |

**Class Mechanic — Totems:** Place persistent buffs/effects that augment the party. Maelstrom resource for Elemental/Enhancement.

---

### 2.3 Talent Trees

Each tree has **~20-25 talent nodes** arranged in tiers. Points are earned on level-up (1 per level, 60 points total at max level). Talents are a mix of:

- **Passive stat boosts** (+2% crit, +5% fire damage)
- **Ability unlocks** (new active abilities for the combat rotation)
- **Ability modifiers** (your Fireball now has a 15% chance to leave a DoT)
- **Capstone talent** (tier 6, powerful build-defining passive or active)

**Players can respec freely** (perhaps with a small gold cost, increasing per respec — another classic MMO nod).

---

## 3. PROGRESSION SYSTEMS

### 3.1 Leveling (1–60)

The core journey. Each character levels from 1 to 60 across a series of **zones** that scale in difficulty and thematic identity.

**Leveling Activities:**

| Activity | Description | Idle Behavior |
|----------|-------------|---------------|
| **Grinding** | Fight mobs in a zone. Simple, reliable XP. | Auto-attacks and uses rotation. Loot drops passively. |
| **Questing** | Accept zone quests (kill X, collect Y, escort NPC). Bonus XP + gold + gear rewards. | Character works on quest objectives automatically. Quest turn-in is manual (satisfying click). |
| **Dungeons** | 5-character group content (see §4). Higher XP/hr if successful. Risk of failure/wipe. | Party auto-fights through dungeon. Success/failure based on gear + comp + level. |

**Zone Structure (example progression):**

| Level Range | Zone Name | Theme |
|------------|-----------|-------|
| 1–5 | Greenhollow Vale | Tutorial. Pastoral starter zone, wolves and bandits. |
| 5–10 | Thornwood Forest | Corrupted forest, spiders, treants, goblin camps. |
| 10–15 | Dustwatch Plains | Open savanna, centaurs, ancient ruins, desert edge. |
| 15–20 | Irondeep Mines | Underground, kobolds, dark iron dwarves, cave-ins. |
| 20–25 | Mistral Coast | Coastal cliffs, pirates, murloc-equivalents, sea caves. |
| 25–30 | The Blighted Moor | Undead-infested swampland, plague, necromancer towers. |
| 30–35 | Emberpeak Mountains | Volcanic highlands, fire elementals, dark iron forges. |
| 35–40 | The Whispering Wastes | Haunted desert, djinn, ancient tombs, sandstorms. |
| 40–45 | Starfall Highlands | High-altitude magic zone, arcane anomalies, dragon sightings. |
| 45–50 | Shadowfen Depths | Deep jungle/underground transition. Troll ruins, fungal horrors. |
| 50–55 | The Frozen Reach | Icy tundra, frost giants, undead armies massing. |
| 55–60 | The Shattered Realm | Endgame zone. Reality fractures, planar invasions, world bosses. |

**Leveling Pace:** First character to 60 should take roughly **1–2 weeks of semi-active play** (faster if actively managing, slower if fully idle). Subsequent alts benefit from heirloom gear and XP bonuses (see §6).

### 3.2 Max Level: The Endgame Loop

Once a character hits 60, the game shifts focus:

```
Get Gear → Clear Harder Content → Get Better Gear → Clear Even Harder Content → ...
```

**Endgame Activities:**

- **Heroic Dungeons** — Harder versions of leveling dungeons with better loot tables
- **Raids** — 10-character (or 20-character) group content, the pinnacle of PvE (see §4)
- **Daily Quests / Reputation Grinds** — Faction rep unlocks special vendors, recipes, enchants
- **World Bosses** — Timed spawns, require strong characters, unique loot
- **Professions / Crafting** — Endgame recipes rival dungeon drops (see §5)

### 3.3 Gear & Item Level

Gear is the primary power vector at max level. Each piece has an **Item Level (iLvl)** that summarizes its power.

**Gear Slots (12):**
Head, Shoulders, Chest, Wrists, Hands, Waist, Legs, Feet, Necklace, Ring 1, Ring 2, Weapon (+ Off-hand/Shield for some)

**Gear Quality Tiers:**

| Quality | Color | Source |
|---------|-------|--------|
| Common | White/Grey | Vendor trash, early quest rewards |
| Uncommon | Green | Quest rewards, normal dungeon drops |
| Rare | Blue | Dungeon boss drops, crafted gear |
| Epic | Purple | Raid drops, heroic dungeon, rare crafts |
| Legendary | Orange | Raid final bosses, long quest chains, extremely rare |

**Stat Budget:** Higher iLvl = more stats. Stats include Strength, Agility, Intellect, Stamina, Spirit, plus secondary stats (Crit, Haste, Hit Rating, Defense Rating, etc.). Classes scale with specific primary stats, adding a layer of "is this item actually for me?" — a beloved MMO moment.

**Gear Progression Tiers at 60:**

| Tier | iLvl Range | Source | Content Required |
|------|-----------|--------|------------------|
| Fresh 60 | 40–55 | Quests, normal dungeons | Solo/easy group |
| Dungeon Geared | 55–70 | Heroic dungeons | Competent 5-man party |
| Raid Tier 1 | 70–85 | Molten Sanctum (first raid) | 10-man raid party |
| Raid Tier 2 | 85–100 | Tomb of the Ancients | 10-man, tighter checks |
| Raid Tier 3 | 100–115 | The Shattered Citadel | 20-man raid |
| Raid Tier 4 | 115–130 | Throne of the Void King | 20-man, final tier |

---

## 4. COMBAT & CONTENT STRUCTURE

### 4.1 Combat Model

Combat is **auto-battler style** (like Melvor Idle / Shakes & Fidget) but with more depth:

- Characters have an **ability rotation** defined by their talent tree. The player doesn't control individual actions — the character executes its rotation automatically.
- **Speed** is determined by attack speed, haste, and cast times.
- **Damage** is calculated from weapon damage, stats, ability coefficients, buffs, and debuffs.
- Combat plays out in a **tick-based simulation** (e.g., 1 tick per second) with a combat log the player can review.

**Player Agency in Combat:**
- **Choose what content to attempt** (which zone, dungeon, raid)
- **Build the character** (talent spec, gear, consumables)
- **Compose the party** (for group content — which of your characters to bring)
- **Set ability priority** (optional: reorder the ability priority list to optimize DPS/HPS/TPS)

### 4.2 Solo Content (Leveling & Grinding)

- Character fights a sequence of mobs in the current zone.
- Mobs have HP, damage, and occasionally mechanics (some mobs heal, some enrage at low HP, some are casters).
- Death sends the character back to a "graveyard" with a short recovery timer (idle penalty — time lost).
- **Loot** drops from mobs: gold, vendor trash, crafting materials, and occasionally green/blue gear.

### 4.3 Dungeons (5-Character Party)

The player assembles a party of **5 of their own characters** (or fewer, early on, with NPC mercenaries filling slots — see §6.3).

**Dungeon Structure:**
1. **Trash Packs** — Groups of mobs between bosses. Require AoE, crowd control, tank survivability.
2. **Bosses** — 3–5 per dungeon. Have mechanics (enrage timers, adds, cleaves, "don't stand in fire" DPS checks).
3. **Loot** — Boss drops are distributed at dungeon end. Player chooses who gets upgrades.

**Dungeon Difficulty:**
- **Normal** — Leveling difficulty. Tuned for on-level characters in quest gear.
- **Heroic** — Level 60 only. Requires dungeon-tier gear. Better loot.
- **Mythic** — Scaling difficulty (+1, +2, +3…). Increasingly harder, increasingly better loot, leaderboard.

**Example Dungeons:**

| Dungeon | Level | Theme | Bosses |
|---------|-------|-------|--------|
| The Deadhollow Crypt | 15–18 | Undead catacombs beneath a ruined chapel | 3 |
| Irondeep Forge | 22–25 | Dwarven forge overrun by dark iron rebels | 4 |
| Tide's End Grotto | 30–33 | Underwater sea cave, naga queen | 3 |
| Emberpeak Caldera | 38–42 | Volcanic dungeon, fire lord | 4 |
| The Dreamspire | 48–52 | Arcane tower with reality-bending bosses | 5 |
| Hall of the Frost King | 55–60 | Ice citadel, frost giant warlord | 5 |

### 4.4 Raids (10- or 20-Character Party)

The pinnacle of content. Raids require the player to have leveled and geared **multiple characters** across multiple roles.

**Raid Design:**
- 10-character raids require ~2 tanks, 2–3 healers, 5–6 DPS
- 20-character raids require ~3–4 tanks, 5–6 healers, 10–12 DPS
- Bosses have complex multi-phase mechanics simulated via the combat engine
- **Wipes are expected.** Tuning is tight. Gear checks are real. This is the long game.

**Raid Lockouts:** Each raid can be cleared once per week (real-time). This creates the classic weekly cadence of "raid night" — log in, run your raids, hope for drops. The weekly reset is a key retention/engagement beat.

**Raid Tiers:**

| Raid | Size | Bosses | Final Boss | Key Drops |
|------|------|--------|------------|-----------|
| **Molten Sanctum** | 10 | 6 | Ignaroth, the Bound Flame | Tier 1 set pieces, fire resist gear |
| **Tomb of the Ancients** | 10 | 8 | Pharathos, the Undying | Tier 2 sets, legendary quest start |
| **The Shattered Citadel** | 20 | 10 | Malachar, the Realm Breaker | Tier 3 sets, rare mounts |
| **Throne of the Void King** | 20 | 12 | Xal'vothis, the Void King | Tier 4 (final), legendary completions |

### 4.5 Boss Mechanics (Simulated)

Boss fights are the core puzzle. Even though combat is automated, the *preparation* is the gameplay. Boss mechanics are expressed as stat/composition checks:

- **Enrage Timer** — Boss must die within X ticks or raid wipes. This is a DPS check.
- **Tank Buster** — Boss does massive single-target hits. Tank needs sufficient HP/armor/mitigation.
- **Raid Damage (AoE)** — Periodic party-wide damage. Healers must keep up.
- **Add Phase** — Boss spawns additional enemies. Need AoE DPS and off-tank.
- **Elemental Resistance** — Some bosses deal heavy fire/frost/shadow damage. Resistance gear matters.
- **Dispel Check** — Boss applies debuffs that must be cleansed. Need a healer with dispel.
- **Positioning Mechanic (abstracted)** — Characters with higher "awareness" stat (from talents/gear) handle spread/stack mechanics better, reducing avoidable damage taken.

The player's job: bring the right comp, gear for the fight, and have enough raw power to beat the checks.

---

## 5. PROFESSIONS & CRAFTING

Each character can learn **2 primary professions** and **all secondary professions**.

### Primary Professions (choose 2 per character)

**Gathering:**
- **Mining** — Ore, gems, stone
- **Herbalism** — Herbs, reagents
- **Skinning** — Leather, hides, scales

**Crafting:**
- **Blacksmithing** — Plate armor, weapons, keys
- **Leatherworking** — Leather/mail armor, armor kits
- **Tailoring** — Cloth armor, bags, enchanted threads
- **Alchemy** — Potions, flasks, transmutes (huge endgame value)
- **Enchanting** — Disenchant gear into materials, enchant gear with stat bonuses
- **Jewelcrafting** — Cut gems to socket into gear, trinkets

### Secondary Professions (all characters)

- **Cooking** — Food buffs (stat boosts for dungeons/raids)
- **First Aid** — Bandages (minor self-healing, useful while leveling)
- **Fishing** — Relaxing idle minigame, provides cooking ingredients and rare items

### Profession Depth

- Professions level 1–300 through crafting/gathering.
- Recipes are learned from trainers, drops, and reputation vendors.
- **Endgame crafting** can produce Rare and Epic gear that rivals early raid drops, but requires raid-drop materials (creating interdependency).
- **Cooldowns** on powerful crafts (1 Arcanite Transmute per day, etc.) — classic.
- Professions across your alt roster synergize: your Miner/Blacksmith feeds materials to your Enchanter/Tailor.

---

## 6. THE ALT SYSTEM (Alternate Progression)

This is the game's answer to "what do I do after max level?" beyond gear. **Alts are not optional — they ARE the endgame.**

### 6.1 Why Alts Matter

- **Raids require 10–20 characters.** You need to level and gear multiple characters to raid.
- **Role coverage.** You need tanks, healers, and DPS across multiple classes.
- **Profession coverage.** Each character only gets 2 professions. Full crafting coverage requires many alts.
- **Weekly lockouts.** After a character clears a raid, they're locked for the week. More alts = more chances at loot.

### 6.2 Alt Progression Bonuses

To prevent alt-leveling from feeling like a slog, the game provides **account-wide progression bonuses:**

| Unlock | Condition | Effect |
|--------|-----------|--------|
| **Heirloom Gear** | First character reaches level 20/40/60 | Bind-on-account gear that scales with level and grants bonus XP |
| **XP Bonus** | Each max-level character | +10% XP gain for all characters (stacking, up to +50%) |
| **Mount Unlock** | First character buys a mount | All characters can mount at the appropriate level |
| **Reputation Carry** | Hit Exalted with a faction | All characters gain rep 25% faster with that faction |
| **Gold is Account-Wide** | Always | Gold is shared across all characters in a unified wallet |
| **Shared Bank** | Unlocked early | Transfer items between characters |

### 6.3 Mercenaries (Early Game Party Fill)

Before the player has enough alts to fill a 5-character dungeon party, they can hire **NPC mercenaries**:

- Mercenaries are generic (e.g., "Hired Sword," "Traveling Priest") and weaker than player characters (~70% effectiveness).
- They cost gold per dungeon run.
- They do not benefit from gear progression.
- **They are a crutch, not a solution.** The game is designed to make you want to replace them with real alts.

### 6.4 Alt Milestones & Long-Term Goals

| Milestone | Characters Required | Unlocks |
|-----------|-------------------|---------|
| First dungeon clear | 1 + mercenaries | Dungeon system, mercenary vendor |
| Full dungeon party | 5 leveled characters | Heroic dungeons, no merc penalty |
| First raid | 10 geared characters | Raid tier 1, guild hall |
| Full raid roster | 20 geared characters | 20-man raids, legendary questlines |
| All classes at 60 | 8 max-level characters | Achievement, cosmetic title: "The Altoholic" |
| All specs cleared endgame | 24 specs played | Mastery system unlock (prestige) |

---

## 7. SOCIAL & META-SYSTEMS

### 7.1 Guild Hall

At 10 characters, the player unlocks a **Guild Hall** — a persistent base that grows over time.

- **Upgrades:** Barracks (alt leveling speed), Vault (extra storage), War Room (raid buff), Library (profession recipe chance), Tavern (generates passive gold and random quests).
- Guild Hall upgrades cost gold and materials, providing another resource sink.

### 7.2 Auction House (Simulated Economy)

A simulated marketplace where the player can buy/sell items at fluctuating NPC prices. Not a real multiplayer economy, but it:

- Provides a way to sell excess crafting materials
- Offers occasional rare finds (recipes, gear) at high prices
- Prices fluctuate based on supply/demand simulation (e.g., fire resist potions spike in price when Molten Sanctum is the current tier)

### 7.3 Achievements & Titles

Hundreds of achievements tracking milestones across all systems. Titles earned from achievements can be equipped to any character for flavor:

- "Dragonslayer" — Clear all raid content
- "The Explorer" — Visit every zone
- "Master Crafter" — Max all professions across your roster
- "Undying" — Clear a raid tier with zero character deaths

### 7.4 Cosmetic Progression

- **Transmog / Appearance System** — Collect gear appearances across all characters. Apply them freely.
- **Mounts** — Rare drops, achievement rewards, reputation rewards. Cosmetic but collectible.
- **Tabards / Guild Crests** — Customizable guild identity.

---

## 8. IDLE vs. ACTIVE GAMEPLAY BALANCE

| Aspect | Idle (Offline/Background) | Active (Playing) |
|--------|--------------------------|-------------------|
| **Grinding** | Character fights mobs, gains XP and loot at ~80% efficiency | 100% efficiency, can swap zones, manage loot |
| **Questing** | Character works on current quest auto | Turn in quests manually, pick new quests, bonus objectives |
| **Dungeons** | Party runs dungeon on repeat | Choose dungeon, manage party comp, optimize |
| **Raids** | NOT idleable — must be manually initiated | Set up raid, choose comp, assign roles, review results |
| **Professions** | Gathering runs passively, crafting queues process | Manage crafting queues, check AH prices, optimize |
| **Gold/Resources** | Accumulate passively | Spend optimally, manage AH, buy upgrades |

**Key Design Principle:** The game respects your time whether you have 5 minutes or 5 hours. Short sessions = collect rewards, start new tasks, raid. Long sessions = optimize builds, theorycraft, push mythic dungeons, plan alt progression.

---

## 9. MONETIZATION (if applicable)

Designed as a **premium or cosmetic-only model** — no pay-to-win.

- **Premium Purchase** — One-time buy or modest subscription for full access.
- **Cosmetic Shop** — Transmog sets, mounts, character slots beyond the base, visual effects.
- **No XP boosts for sale.** No gear for sale. No skipping content.
- The grind *is* the game. Selling shortcuts undermines the core loop.

---

## 10. CONTENT ROADMAP (Post-Launch)

| Update | Content | Theme |
|--------|---------|-------|
| **1.1** | New raid tier (Tier 5), 2 new dungeons | Planar Invasion storyline |
| **1.2** | New class: Monk (3 specs: Tank/DPS/Healer) | Eastern-inspired monastery zone |
| **1.3** | PvP Arena system (auto-battler vs other players' teams) | Competitive leaderboards |
| **1.4** | Level cap increase to 70, new zone tier | Expansion: "The Burning Frontier" |
| **2.0** | Major expansion — new continent, races, systems | Full expansion cycle |

---

## 11. SUMMARY: THE CORE LOOPS

### The Micro Loop (Minutes)
```
Assign character to activity → Idle → Collect rewards → Assign again
```

### The Session Loop (Daily)
```
Check all characters → Collect idle progress → Run daily dungeons →
Attempt weekly raid → Manage professions/AH → Set up overnight idles
```

### The Progression Loop (Weeks)
```
Level new alt → Gear at 60 → Add to raid roster →
Clear next raid tier → Get gear → Push harder content
```

### The Meta Loop (Months)
```
Build full 20-character raid roster → Clear all raid tiers →
Push mythic dungeons → Complete all achievements →
Master all professions → Collect all cosmetics → Await new content
```

---

*This document is a living design plan. All numbers, names, and specifics are subject to iteration and playtesting.*
