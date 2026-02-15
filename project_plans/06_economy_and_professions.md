# Economy, Loot & Professions

> **Role:** Economic systems reference. Contains loot tables, gold economy, and all profession specs.
> **Related files:** `00_overview_and_decisions.md` (no-monetization impact), `02_character_and_combat.md` (item stat budgets tie to combat)

---

## LOOT SYSTEM

### Drop Rates

```
Common (white): 60% of drops
Uncommon (green): 30%
Rare (blue): 8%
Epic (purple): 1.8%
Legendary (orange): 0.2%

Special cases:
- Dungeon bosses: 100% blue+ guaranteed
- Raid bosses: 100% epic+, 20% legendary chance
- World bosses: Guaranteed epic, 10% legendary
```

### Item Budget

```
Item Level = Content Level + Quality Modifier

Quality Modifiers:
Common: +0 | Uncommon: +5 | Rare: +10 | Epic: +20 | Legendary: +30

Total Stat Points = iLvl x 2

iLvl 70: 140 stat points
iLvl 80: 160 stat points
iLvl 115: 230 stat points

Distribution by type:
- Plate DPS: 40% Str, 30% Sta, 20% Crit, 10% Hit
- Cloth Caster: 40% Int, 30% Sta, 20% Spell Power, 10% Haste
- Leather Tank: 40% Agi, 40% Sta, 10% Dodge, 10% Armor
```

### Loot Distribution (Dungeons/Raids)

**Automatic Smart Loot:**
- System knows which characters can use which items
- Prioritizes actual upgrades (iLvl increase)
- Shows loot window at end of content
- Player assigns loot manually

### Special Loot

**Tier Sets:**
- Raid bosses drop Tier Tokens → exchanged for class-specific set pieces
- Set bonuses: 2-piece (minor), 4-piece (moderate), 6-piece (major, build-defining)

**Example:** Warrior Tier 3 Dreadnaught: 2pc Shield Wall CD -30s, 4pc Devastate 30% free Shield Slam, 6pc Last Stand gives party 10% DR

**Disenchanting:** Unwanted blues/purples → enchanting materials (more valuable than vendor price)

---

## GOLD ECONOMY

### Gold Sources

| Source | Amount |
|--------|--------|
| Level 1 mob | 1-3 copper |
| Level 30 mob | 8-25 silver |
| Level 60 mob | 40-80 silver |
| Vendor trash | +30% to mob income |
| Level 10 quest | 20 silver |
| Level 30 quest | 2 gold |
| Level 60 daily | 15-50 gold |
| Dungeon (leveling) | 50-100 gold |
| Dungeon (level 60) | 150-300 gold |
| BoE epic (AH) | 500-5,000 gold |
| Daily hub (5 dailies) | 75-150 gold/day |
| Profession dailies | 20-50 gold |

### Gold Sinks

| Sink | Cost |
|------|------|
| Level 20 mount | 100 gold |
| Level 40 epic mount | 1,000 gold |
| Rare vendor mounts | 5,000-10,000 gold |
| Full repair (greens) | 5 gold |
| Full repair (epics) | 50-100 gold |
| Death penalty (raid gear) | 5-10 gold |
| Respecs | FREE (no monetization) |
| Raid consumables per night | ~300 gold/character |
| Guild Hall (full) | 500,000+ gold |
| AH listing fee | 5% of bid |
| AH cut | 10% of sale |

### Expected Gold Accumulation

**Leveling 1-60:** Earns ~1,500g, spends ~300g, net ~1,200g at 60
**Level 60 Casual:** +400g/day net (500 earned - 100 spent)
**Level 60 Hardcore:** +500g/day net (1,000 earned - 500 spent)

**Long-term goals:** Epic mounts for all alts (20,000g), Full guild hall (500,000g), Legendary crafts (50,000g each)

---

## PROFESSIONS — COMPLETE SYSTEM

### Overview

| Type | Profession | Products |
|------|-----------|----------|
| Gathering | Mining | Ore, gems, crystals |
| Gathering | Herbalism | Herbs for alchemy |
| Gathering | Skinning | Leather, dragonscale |
| Crafting | Blacksmithing | Plate armor, weapons, keys |
| Crafting | Leatherworking | Leather/mail armor, kits |
| Crafting | Tailoring | Cloth armor, bags |
| Crafting | Alchemy | Potions, flasks, transmutes |
| Crafting | Enchanting | Enchants, disenchanting |
| Crafting | Jewelcrafting | Gems, rings, trinkets |
| Secondary | Cooking | Food buffs (30min) |
| Secondary | First Aid | Bandages, anti-venoms |
| Secondary | Fishing | Fish, rare items, mounts |

Characters get 2 primary professions + all 3 secondary.

### Gathering Professions

**MINING (1-300)**
```
1-50:   Copper Ore (Greenhollow Vale, Thornwood Forest)
50-100: Tin Ore (Dustwatch Plains, Irondeep Mines)
100-150: Iron Ore (Mistral Coast, Blighted Moor)
150-200: Mithril Ore (Emberpeak Mountains, Whispering Wastes)
200-250: Thorium Ore (Starfall Highlands, Shadowfen Depths)
250-300: Fel Iron Ore (Frozen Reach, Shattered Realm)
```
Special: Gem nodes (100+), Dark Iron (230+), Arcane Crystal (250+, ultra-rare)

**HERBALISM (1-300)**
```
1-50:   Silverleaf, Peacebloom
50-100: Earthroot, Mageroyal
100-150: Kingsblood, Liferoot
150-200: Fadeleaf, Goldthorn
200-250: Sungrass, Dreamfoil
250-300: Icethorn, Lichbloom
```
Special: Black Lotus (300, ultra-rare, best flasks)

**SKINNING (1-300)**
```
1-50:   Light Leather → 250-300: Dragonscale (dragons, rare)
```
Special: Devilsaur Leather (rare spawns, best pre-raid leather gear)

### Crafting Professions

**BLACKSMITHING (1-300)**
- Products: Plate armor, weapons, skeleton keys, armor spikes
- Specializations (200): Armorsmith / Weaponsmith
- Key recipes: Lionheart Helm (300, BiS DPS), Titanic Leggings (300, BiS tank), Sulfuron Hammer (300, legendary)
- Daily: Smelt Hardened Elementium (300, legendary crafts)

**LEATHERWORKING (1-300)**
- Products: Leather/mail armor, armor kits, cloaks
- Specializations: Tribal / Elemental / Dragonscale
- Key recipes: Devilsaur Set (300, BiS leather DPS), Chromatic Cloaks (285), Core Armor Kits (300)

**TAILORING (1-300)**
- Products: Cloth armor, bags, threads
- Specializations: Shadoweave / Spellfire / Mooncloth
- Key recipes: Robe of the Archmage (300, BiS mage), Bottomless Bag (300, 24-slot), Mooncloth (250, daily)

**ALCHEMY (1-300)**
- Products: Health/mana potions, flasks (2hr, persist through death), elixirs, transmutes
- Specializations: Potion Master / Flask Master / Transmute Master (proc extra)
- Key recipes: Flask of the Titans (300, +1,200 HP), Flask of Supreme Power (300, +150 SP), Arcanite Transmute (275, daily)
- **Why valuable:** Raiders need flasks nightly, transmute CDs = steady gold

**ENCHANTING (1-300)**
- Products: Gear enchants, disenchanting
- No specialization
- Key enchants: Crusader (300, heal+STR proc), Greater Stats (300, +4 all), Superior Strength (300, +9 STR)
- Disenchanting: Green → Strange Dust/Lesser Essences, Blue → Soul Dust/Greater Essences, Purple → Large Shards/Void Crystals

**JEWELCRAFTING (1-300)**
- Products: Cut gems (socket into gear), trinkets, rings/necklaces
- Specializations (150): Gemcutter / Jewelsmith
- Gem Sockets: Epic/Legendary gear has 1-3 sockets, gems add 10-30 stats

### Secondary Professions

**COOKING (1-300):** Food buffs (+Sta, +Spirit, +SP, etc.) 30min duration, stacks with flasks
**FIRST AID (1-300):** Bandages (instant heal, 8s channel), anti-venoms. Useful while leveling.
**FISHING (1-300):** Fish for cooking, rare items (lockboxes, epics), cosmetic pets. Idle-friendly. Ultra-rare Sea Turtle Mount (0.01%).

### Profession Synergies

```
Mining + Blacksmithing: Self-sufficient plate crafter
Herbalism + Alchemy: Self-sufficient potions, gold-maker
Skinning + Leatherworking: Self-sufficient leather crafter
Tailoring + Enchanting: No gathering needed (cloth + disenchant)
Jewelcrafting + Mining: Self-sufficient gem cutting
```

**Full coverage requires 6 characters** (1 per combo + all have Cooking/First Aid/Fishing).

### Profession Progression Time

- Gathering 1-300: Active 8-12 hours, Idle 20-30 hours
- Crafting 1-300: 10-15 hours, costs 500-2,000g in materials, profitable at 300
- Daily cooldowns create routine: Transmute → Craft Mooncloth → Post on AH
