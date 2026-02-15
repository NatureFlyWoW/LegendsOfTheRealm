# Character System & Combat Engine

> **Role:** Primary reference for combat system subagent. Contains all character data, talent trees, combat formulas, and leveling math.
> **Related files:** `00_overview_and_decisions.md` (design pillars), `01_core_engine_architecture.md` (tick system the combat runs on)

---

## 2.1 COMPLETE CHARACTER SYSTEM

### 2.1.1 Races (Full Stats)

| Race | Primary Bonus | Secondary Bonus | Profession Bonus | Lore |
|------|---------------|-----------------|------------------|------|
| **Human** | +5% XP gain | +2% reputation gain | +5% to all professions | Versatile, adaptable, the realm's backbone |
| **Dwarf** | +5% armor value | +2% melee crit | +10% Mining, +5% Blacksmithing | Stout, resilient, masters of stone and steel |
| **High Elf** | +5% max mana | +2% spell crit | +10% Enchanting, +5% Tailoring | Ancient, graceful, keepers of arcane secrets |
| **Orc** | +5% melee damage | +2% max health | +10% Blacksmithing, +5% Skinning | Fierce, honorable, warriors of the wastes |
| **Darkfolk** | +5% crit chance | +2% dodge | +10% Alchemy, +5% Herbalism | Shadowy, cunning, survivors of the underdark |
| **Halfling** | +5% dodge chance | +2% movement speed | +10% Cooking, +5% Fishing | Nimble, lucky, hearthkeepers of the shires |

**Race Selection Impact:**
- Mostly flavor + minor optimization
- **No bad choices, just different flavors**

### 2.1.2 Base Stats Explained

Every character has 8 core stats:

| Stat | What It Does | Who Wants It |
|------|--------------|--------------|
| **Strength** | Increases melee physical damage & block value | Warriors, Paladins (ret), Shamans (enh) |
| **Agility** | Increases ranged damage, dodge, crit (melee/ranged) | Rogues, Rangers, Feral Druids |
| **Intellect** | Increases mana pool, spell crit | All casters (Mage, Cleric, Necro, etc.) |
| **Stamina** | Increases health pool | Everyone (especially tanks) |
| **Spirit** | Increases health/mana regen out of combat | Healers, leveling characters |
| **Armor** | Reduces physical damage taken | Tanks, melee |
| **Spell Power** | Increases spell damage & healing | Casters, healers |
| **Attack Power** | Increases melee/ranged damage | Physical DPS |

**Secondary Stats** (from gear/talents):

| Stat | Effect | Rating Conversion |
|------|--------|-------------------|
| **Critical Strike Rating** | Chance to deal 200% damage/healing | 22 rating = 1% crit at level 60 |
| **Hit Rating** | Reduces miss chance (9% base vs bosses) | 12.5 rating = 1% hit |
| **Haste Rating** | Reduces cast time & increases attack speed | 15 rating = 1% haste |
| **Defense Rating** | Reduces crit chance taken, increases avoidance | 2.5 rating = 1 defense skill |
| **Dodge Rating** | Chance to avoid melee attacks | 18 rating = 1% dodge |
| **Parry Rating** | Chance to parry melee attacks (tanks) | 20 rating = 1% parry |
| **Block Rating** | Chance to block with shield (shield users) | 5 rating = 1% block |
| **Resilience** | Reduces crit damage taken | 25 rating = 1% crit damage reduction |

**Stat Caps:**
- **Hit:** 9% to never miss bosses (112.5 hit rating at 60)
- **Crit:** No cap, but diminishing returns after ~40%
- **Haste:** No cap, but most valuable 0-30%
- **Defense (tanks):** 350 skill minimum for raids (can't be crit by bosses)

### 2.1.3 Leveling Stat Scaling

**Base Stats at Level 1:**
- Strength: 20 (melee) / 10 (casters)
- Agility: 20 (agile) / 10 (others)
- Intellect: 20 (casters) / 10 (melee)
- Stamina: 25 (everyone starts similar)
- Spirit: 20

**Per-Level Gains (examples):**

Warrior: STR +2.5/lvl (170 at 60), AGI +1, INT +0.5, STA +2 (145 at 60), SPI +1
Mage: STR +0.5, AGI +0.5, INT +3/lvl (200 at 60), STA +1.5 (115 at 60), SPI +2.5 (170 at 60)

**Health/Mana Scaling:**
- Health = (Stamina x 10) + class base
- Mana = (Intellect x 15) + class base

**With Gear at 60:**
- Tank in raid gear: ~12,000 HP
- DPS in raid gear: ~5,500 HP
- Healer in raid gear: ~4,800 HP, 8,500 mana

---

## 2.2 COMPLETE TALENT TREES (24 Specs)

All 8 classes x 3 talent trees. Each tree has 6 tiers with a capstone ability.

### WARRIOR TALENTS

#### Protection (Tank)
```
Tier 1 (Levels 10-14):
├─ Improved Shield Wall (2/2): Shield Wall CD reduced by 2 min
├─ Toughness (3/3): +6% armor from items
└─ Shield Specialization (3/3): +6% block chance

Tier 2 (Levels 15-19):
├─ Anticipation (5/5): +10 defense skill
├─ Last Stand (1/1): Emergency 30% temp HP for 20s, 5min CD
└─ Improved Thunder Clap (3/3): Thunder Clap attack speed slow +6%

Tier 3 (Levels 20-29):
├─ Improved Revenge (3/3): Revenge stun chance +30%
├─ Defiance (5/5): +15% threat generation
├─ Improved Sunder Armor (3/3): Sunder cost -6 rage
└─ Improved Disarm (2/2): Disarm duration +2s

Tier 4 (Levels 30-39):
├─ Improved Taunt (2/2): Taunt CD -2s
├─ Improved Shield Bash (2/2): Shield Bash silence +2s
├─ Concussion Blow (1/1): Stun enemy for 5s, 30s CD
└─ One-Handed Weapon Specialization (5/5): +10% dmg with 1H weapons

Tier 5 (Levels 40-49):
├─ Shield Slam (1/1): Powerful shield attack, dispels magic
├─ Focused Rage (3/3): Costs of all abilities -9 rage
├─ Vitality (5/5): +5% stamina
└─ Devastate Improved (3/3): Devastate damage +30%

Tier 6 (Level 50+) — CAPSTONE:
└─ Sword and Board (1/1): Shield Slam CD -3s, Devastate crits refund 30 rage
```

#### Arms (2H Melee DPS)
```
Tier 1-2:
├─ Improved Heroic Strike, Deflection, Improved Rend
├─ Tactical Mastery (rage retained on stance swap)
├─ Improved Charge (stun duration)

Tier 3-4:
├─ Sweeping Strikes (1/1): Next 5 attacks hit additional target
├─ Mortal Strike (1/1): Massive strike, reduces healing on target 50%
├─ Two-Handed Weapon Specialization (5/5): +10% 2H damage
├─ Impale (2/2): Crit damage +20%

Tier 5-6:
├─ Deep Wounds (3/3): Crits cause bleed DoT
├─ Improved Mortal Strike (3/3): MS cost -10 rage
└─ **Bladestorm (1/1)**: CAPSTONE — Whirlwind for 6s, immune to CC
```

#### Fury (Dual-Wield Frenzy DPS)
```
Tier 1-2:
├─ Cruelty (5/5): +5% crit
├─ Improved Battle Shout, Piercing Howl
├─ Blood Craze (3/3): Being hit gives rage

Tier 3-4:
├─ Dual Wield Specialization (5/5): +10% offhand damage
├─ Bloodthirst (1/1): Instant attack healing you, 6s CD
├─ Enrage (5/5): Crits generate extra rage
├─ Improved Execute (2/2): Execute cost -5 rage

Tier 5-6:
├─ Rampage (1/1): After crit, +20% attack power for 15s
├─ Improved Whirlwind (2/2): Whirlwind hits 2 extra targets
└─ **Titan's Grip (1/1)**: CAPSTONE — Can dual-wield 2H weapons (-10% dmg penalty)
```

---

### MAGE TALENTS

#### Fire (Burst/DoT Caster)
```
Tier 1-2:
├─ Improved Fireball (5/5): Cast time -0.5s
├─ Ignite (5/5): Crits cause DoT = 40% initial damage over 4s
├─ Flame Throwing (2/2): Flamestrike/Blast range +6yds

Tier 3-4:
├─ Pyroblast (1/1): 6s cast, huge fire damage + DoT
├─ Burning Soul (2/2): Fire spell pushback resistance, -10% threat
├─ Improved Scorch (3/3): Scorch increases fire damage taken by target
├─ Master of Elements (3/3): Crits refund 30% mana

Tier 5-6:
├─ Critical Mass (3/3): Fire crits +6%
├─ Combustion (1/1): Guaranteed crit on next cast, stacks crit chance
└─ **Dragons Breath (1/1)**: CAPSTONE — AoE cone disorient + DoT
```

#### Frost (Control/Survivability Caster)
```
Tier 1-2:
├─ Improved Frostbolt (5/5): Cast time -0.5s
├─ Ice Shards (5/5): Crit damage +50%
├─ Piercing Ice (3/3): Frost damage +6%

Tier 3-4:
├─ Shatter (5/5): +50% crit vs frozen targets
├─ Ice Barrier (1/1): Absorb shield, 1min CD
├─ Improved Frost Nova (2/2): CD -2s
├─ Cold Snap (1/1): Reset all Frost CDs, 10min CD

Tier 5-6:
├─ Ice Block (1/1): Immune for 10s, 5min CD
├─ Winter's Chill (5/5): Frost spells stack +10% frost dmg taken
└─ **Deep Freeze (1/1)**: CAPSTONE — Stun frozen target for 5s
```

#### Arcane (Mana Burn/Burst Caster)
```
Tier 1-2:
├─ Arcane Subtlety (2/2): -40% threat, +5% resist to spells
├─ Arcane Focus (5/5): +10% hit chance
├─ Arcane Concentration (5/5): 10% chance spells cost no mana

Tier 3-4:
├─ Presence of Mind (1/1): Next spell instant cast, 3min CD
├─ Arcane Mind (5/5): +10% max mana
├─ Arcane Power (1/1): +30% damage, +30% mana cost for 15s, 3min CD
├─ Empowered Arcane Missiles (3/3): AM damage +15%

Tier 5-6:
├─ Spell Power (2/2): Crit damage +50%
├─ Mind Mastery (5/5): +25% of int → spell power
└─ **Arcane Barrage (1/1)**: CAPSTONE — Instant nuke, costs 4 Arcane Charges
```

---

### CLERIC TALENTS

#### Holy (Direct Healing)
```
Tier 1-2:
├─ Improved Renew (3/3): Duration +3s
├─ Holy Specialization (5/5): +5% crit on Holy spells
├─ Divine Fury (5/5): Cast time on smite/heal -0.5s

Tier 3-4:
├─ Circle of Healing (1/1): Instant AoE heal, 6s CD
├─ Improved Healing (3/3): Mana cost -15% on heals
├─ Spiritual Guidance (5/5): +25% spirit → spell power
├─ Surge of Light (2/2): Smite crits = free instant Flash Heal

Tier 5-6:
├─ Lightwell (1/1): Deploy healing totem, party can click for heals
├─ Divine Providence (5/5): +10% crit on Prayer of Healing
└─ **Guardian Spirit (1/1)**: CAPSTONE — Target can't die for 10s, then healed to 50%
```

#### Discipline (Shields/Atonement)
```
Tier 1-2:
├─ Improved Power Word: Shield (3/3): Mana cost -15%
├─ Twin Disciplines (5/5): Damage/healing +5%
├─ Mental Agility (5/5): Instant spell cost -10%

Tier 3-4:
├─ Power Infusion (1/1): Target +20% spell haste for 15s
├─ Focused Will (3/3): After taking damage, -6% damage taken
├─ Penance (1/1): Channeled heal or damage, 10s CD
├─ Rapture (3/3): Shield absorbs return mana

Tier 5-6:
├─ Borrowed Time (5/5): After shield, next cast +15% haste
├─ Grace (3/3): Your direct heals increase healing taken by target
└─ **Pain Suppression (1/1)**: CAPSTONE — -40% damage taken for 8s, 3min CD
```

#### Retribution (Melee Holy DPS)
```
Tier 1-2:
├─ Benediction (5/5): -10% mana cost, +3% hit on smite
├─ Improved Seal of Righteousness (5/5): Damage +15%
├─ Deflection (5/5): Parry +5%

Tier 3-4:
├─ Sanctity Aura (1/1): Party +10% holy damage
├─ Crusader Strike (1/1): Melee strike, 6s CD
├─ Two-Handed Weapon Specialization (3/3): +6% 2H damage
├─ Sanctified Wrath (2/2): Crit damage +20%

Tier 5-6:
├─ Divine Storm (1/1): AoE melee attack, heals party
├─ Fanaticism (5/5): Crit +5%, threat -10%
└─ **Hammer of Wrath (1/1)**: CAPSTONE — Execute-style holy nuke on targets <20% HP
```

---

### ROGUE TALENTS

#### Assassination (Poison/DoT)
```
Capstone: **Mutilate (1/1)** — Dual-wield strike, +damage vs poisoned targets
Key: Malice +5% crit, Lethality +30% crit damage, Vile Poisons +20%, Cold Blood (guaranteed crit)
```

#### Combat (Sustained DPS)
```
Capstone: **Killing Spree (1/1)** — Teleport between enemies, striking each
Key: Precision +5% hit, Blade Flurry, Sword Specialization, Adrenaline Rush
```

#### Subtlety (Burst/Utility)
```
Capstone: **Shadow Dance (1/1)** — Use stealth abilities while visible for 8s
Key: Master of Deception, Preparation (reset CDs), Shadowstep, Premeditation
```

---

### RANGER TALENTS

#### Marksmanship (Sniper DPS)
```
Capstone: **Chimera Shot (1/1)** — Multi-effect shot based on active sting
Key: Lethal Shots +5% crit, Mortal Shots +30% crit damage, Trueshot Aura, Silencing Shot
```

#### Beast Mastery (Pet DPS)
```
Capstone: **The Beast Within (1/1)** — Bestial Wrath also affects you
Key: Bestial Wrath (+50% pet damage), Exotic Beasts, Serpent's Swiftness (+20% speed)
```

#### Survival (Hybrid/Trap Specialist)
```
Capstone: **Black Arrow (1/1)** — Shadow-damage DoT + summons Dark Minion pet
Key: Lock and Load, Hunter vs Wild, Explosive Shot, Counterattack
```

---

### DRUID TALENTS

#### Restoration (HoT Healer)
```
Capstone: **Tree of Life (1/1)** — Transform, +healing, aura heals party
Key: Omen of Clarity, Nature's Swiftness, Swiftmend, Living Spirit
```

#### Feral (Tank/Melee DPS)
```
Capstone: **Berserk (1/1)** — Bear: no cost on abilities. Cat: Energy costs halved
Key: Mangle, Leader of the Pack (+5% party crit), Predatory Strikes
```

#### Balance (Caster DPS)
```
Capstone: **Typhoon (1/1)** — AoE knockback + nature damage
Key: Eclipse, Moonkin Form, Nature's Grace, Force of Nature (summon treants)
```

---

### NECROMANCER TALENTS

#### Affliction (DoT/Drain)
```
Capstone: **Haunt (1/1)** — DoT that increases your damage to target
Key: Improved Corruption, Siphon Life, Nightfall, Unstable Affliction
```

#### Demonology (Pet/Undead Summoner)
```
Capstone: **Metamorphosis (1/1)** — Transform into demon, new abilities
Key: Soul Link, Demonic Sacrifice, Master Demonologist, Summon Felguard
```

#### Destruction (Burst Shadow/Fire)
```
Capstone: **Chaos Bolt (1/1)** — Cannot be resisted, huge chaos damage
Key: Ruin (+100% crit damage), Conflagrate, Shadowburn, Fire and Brimstone
```

---

### SHAMAN TALENTS

#### Elemental (Lightning/Fire Caster)
```
Capstone: **Thunderstorm (1/1)** — AoE knockback + mana restore
Key: Lava Burst (guaranteed crit vs Flame Shocked), Elemental Focus, Totem of Wrath
```

#### Enhancement (Melee Windfury)
```
Capstone: **Feral Spirit (1/1)** — Summon 2 spirit wolves
Key: Stormstrike, Dual Wield, Flurry, Lava Lash, Shamanistic Rage
```

#### Restoration (Chain Heal / Totem Healer)
```
Capstone: **Riptide (1/1)** — Instant HoT + boosts Chain Heal on target
Key: Mana Tide Totem, Earth Shield, Nature's Swiftness, Tidal Waves
```

---

## 2.3 COMBAT SYSTEM — FULL FORMULAS

### 2.3.1 Combat Tick System

**Core Loop:**
- Game runs at **1 tick = 1 second** real-time
- During idle, ticks are simulated retroactively based on timestamp delta
- Combat simulation is deterministic (same inputs = same outputs)

**Combat Flow:**
```
1. Character engages enemy
2. Each tick:
   a. Calculate initiative (who acts first)
   b. Process auto-attacks (if timer ready)
   c. Process ability usage (priority system)
   d. Calculate damage/healing
   e. Update HP/resources
   f. Check for death/victory
3. Loot distribution
4. Next enemy or end combat
```

### 2.3.2 Damage Calculation

**Physical Melee Damage:**
```
Base Damage = Weapon Damage (random range)
Attack Power Bonus = (Attack Power / 14) * Weapon Speed
Raw Damage = Base + AP Bonus
Modified = Raw x Ability Coefficient x (1 + Damage Modifiers)
After Armor = Modified x Armor Reduction Multiplier
Final = After Armor x (Crit Multiplier if crit) x (Random 0.95-1.05)
```

**Armor Formula:**
```
Damage Reduction % = Armor / (Armor + 400 + (85 x Attacker Level))

At level 60:
DR = Armor / (Armor + 5500)

0 armor = 0% reduction
2750 armor = 33% reduction
5500 armor = 50% reduction
11000 armor = 66% reduction (tank in full raid gear)
```

**Spell Damage:**
```
Base = Spell Base Damage
SP Bonus = Spell Power x Coefficient
Raw = Base + SP Bonus
Modified = Raw x (1 + Damage Mods) x (1 + Crit if crit)
Resisted = Modified x (1 - Target Resistance %)
Final = Resisted x Variance (0.95-1.05)
```

**Spell Coefficients:**
- Fast spells (1.5s cast): 0.428
- Medium (2.5s cast): 0.714
- Slow (3.5s cast): 1.0
- DoTs: (Duration / 15) x 1.0
- AoE: Reduced by sqrt(targets hit)

### 2.3.3 Healing Calculation

```
Base Heal = Spell Base Healing
SP Bonus = Spell Power x Coefficient
Raw = Base + SP Bonus
Modified = Raw x (1 + Healing Mods) x (1 + Crit if crit)
Final = min(Modified, Target Missing HP)
Overheal = Modified - Final (tracked for meters)
```

**Crit Healing:** Base 150% (not 200%), talents can increase to 200%

### 2.3.4 Hit/Miss/Crit/Avoidance

**Attack Table (order matters):**
1. Miss → 2. Dodge → 3. Parry → 4. Block → 5. Critical Hit → 6. Normal Hit

**Miss Chance:**
- Base vs same-level: 5%
- Base vs boss (+3 levels): 9%
- Dual-wield penalty: +19% miss (total 28% vs boss)
- Hit rating reduces miss (12.5 rating = 1% at level 60)

**Spell Hit:**
- Base vs boss: 16% resist chance
- Spell hit rating: 12.5 rating = 1%
- Cap: 16% vs bosses (200 rating)

**Crit Chance:**
```
Base Crit = Class Base + (Agility or Int / 20) + Crit Rating / 22 + Talents
Boss Crit Suppression: -4.8% crit chance vs bosses
```

**Dodge:** `Dodge % = Base (class) + (Agility / 15) + Dodge Rating / 18 + Talents` (diminishing returns at ~20%)
**Parry:** `Parry % = 5% base + Parry Rating / 20 + Talents`
**Block:** `Block Chance = 5% base + Block Rating / 5 + Talents`, `Block Value = (Str / 20) + Shield Block Value + Talents`

### 2.3.5 Threat/Aggro System

```
Threat = Damage x Stance Modifier x Talents x Abilities

Stance Modifiers:
- DPS specs: 100% (1 damage = 1 threat)
- Tank specs: 150-200% (1 damage = 1.5-2 threat)
- Healer: Healing x 0.5 = threat

Aggro Rules:
- Enemy attacks highest threat target
- Melee range: Need 110% threat to pull aggro
- Ranged: Need 130% threat to pull aggro
- Tanks start combat with Taunt to establish threat
```

---

## 2.4 EXPERIENCE & LEVELING SYSTEM

### 2.4.1 XP Curve (1-60)

**Formula:**
```
XP_Required(level) = round(1000 x (level ^ 2.4))

Total 1→60: 4,827,000 XP
```

Sample: Level 1→2: 400 XP | Level 10→11: 7,900 XP | Level 30→31: 48,200 XP | Level 50→51: 162,800 XP | Level 59→60: 220,000 XP

### 2.4.2 XP Sources

**Mob Grinding:**
```
Base XP = Mob Level x 45 + 100

Modifiers:
Same level: 100% | -1: 90% | -2: 75% | -3: 50% | -5+: 10% (grey)
+1: 110% | +2: 120% | +3: 130% | +4+: 140% (risky!)

Stacking: Rested (200%) x Human (+5%) x Heirlooms (+50%) x Guild Hall (+15%) = 361% max
```

**Quest XP:** `Quest Level x 100 + Bonus` (manual turn-in for deliberate dopamine hit)
**Dungeon XP:** Trash x1.5, Boss = quest-equivalent, Completion bonus +10%. Full dungeon ~20% of a level.

### 2.4.3 Leveling Time Estimates

| Character | Active | Semi-Active | Idle |
|-----------|--------|-------------|------|
| First (no bonuses) | 40 hours | 60 hours | 100 hours |
| Second (+10% XP) | 35 hours | 55 hours | 90 hours |
| Fifth (+50% heirlooms) | 20 hours | 30 hours | 50 hours |

Real-time first char: 1-2 weeks casual play.

### 2.4.4 Rested XP System

- Accumulation: 5% of level's XP per 8 hours while inactive
- Max: 150% of level's XP requirement
- Usage: Doubles XP gain until depleted
- Strategy: Rotate alts, "inn" characters in guild hall for faster accumulation
