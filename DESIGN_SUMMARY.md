# Legends of the Shattered Realm - Design Document Summary

## Document Completed: February 14, 2026

**File:** `game-design-plan-detailed.md`
**Size:** 205 KB / ~47,000 words / 5,951 lines
**Status:** COMPLETE - Ready for Development

---

## ALL OPEN QUESTIONS RESOLVED

### 1. Art Style Decision: ASCII/ANSI (Caves of Qud Style)
- **Rationale:** 10x faster content creation, perfect for solo dev, nostalgic aesthetic
- **Technical Spec:** CP437 extended ASCII + Unicode box-drawing, 16-color ANSI palette
- **Font:** Px437 IBM VGA8 or Terminus at 16x16 pixel character size
- **Visual Examples:** Full character sheets, zone maps, UI panels all designed

### 2. Capturing 90s High Fantasy Feel
- **Reverent Worldbuilding:** Quest text takes itself seriously, proper fantasy nomenclature
- **Earned Power Fantasy:** Clear progression from weak (level 1) to godlike (level 60 raids)
- **Information Density:** Tooltip-heavy, detailed combat logs, stat breakdowns
- **Community Ritual:** Simulated guild chat, auction house feeds, weekly raid resets
- **Friction as Feature:** Bag management, repair costs, travel time, quest drop rates

### 3. Active Engagement While Idle
**10 Engagement Systems:**
- Daily quest hub (10-30 min sessions)
- Weekly raid lockouts (scheduled "raid nights")
- Mythic+ leaderboards (competitive goals)
- Legendary questlines (4-8 week pursuits)
- Achievement hunting (600+ achievements)
- Guild hall upgrades (visible progression)
- Profession mastery (daily cooldowns create routine)
- Transmog collection (fashion endgame)
- Combat log analysis (theorycrafting)
- Check-in loop (3 play patterns: 5min / 30-60min / 2-4hr all valid)

### 4. Technology Stack: Electron + TypeScript + SQLite
**Full Stack:**
- **Frontend:** Electron, React, TypeScript, Tailwind CSS
- **Rendering:** Custom HTML5 Canvas ASCII renderer
- **Backend:** TypeScript game logic, pure functions
- **Database:** SQLite (local saves, fully offline)
- **Build:** Vite, Electron Builder, Vitest for testing
- **Performance:** <3s load, <300 MB RAM, 1 tick/second stable

### 5. Offline & No Monetization Impact
**Design Changes:**
- FREE unlimited respecs (no frustration monetization)
- UNLIMITED character slots (alts are the game)
- XP rates tuned for fun (first char: 1-2 weeks to 60)
- Large bags craftable/earnable (not purchased)
- All cosmetics earnable in-game (no cash shop)
- Save files portable (players can backup/share)
- All updates free (passion project model)

---

## COMPLETE SYSTEM SPECIFICATIONS

### Character System
- **8 Classes:** Warrior, Mage, Cleric, Rogue, Ranger, Druid, Necromancer, Shaman
- **24 Specializations:** All fully designed with talent trees (20-25 nodes each)
- **6 Races:** Human, Dwarf, High Elf, Orc, Darkfolk, Halfling (with bonuses)
- **Stats:** 8 primary + 12 secondary stats with complete formulas
- **Leveling:** 1-60, full XP curve (4,827,000 total XP), rested XP system

### Combat System
- **Tick-based:** 1 tick = 1 second, deterministic simulation
- **Full Damage Formulas:** Physical, spell, healing, threat all specified
- **Hit/Crit/Avoidance:** Complete stat calculations with diminishing returns
- **Attack Table:** Miss → Dodge → Parry → Block → Crit → Hit (order matters)

### Content
- **12 Zones:** Level 1-60 progression, each with theme, quests, lore
- **6 Dungeons:** Normal/Heroic/Mythic+, 3-5 bosses each, all mechanics designed
- **4 Raid Tiers:** 6-12 bosses each, 10 or 20-character, full encounter design
- **Quest Chains:** 200+ quests across all zones with objectives and rewards
- **World Bosses:** 3 elite encounters requiring groups

### Progression Systems
- **Gear:** 12 slots, 5 quality tiers, iLvl 40-135, full stat budgets
- **Professions:** 6 crafting + 3 gathering + 3 secondary, all 1-300 progression
- **Gold Economy:** Sources, sinks, expected accumulation rates all specified
- **Loot System:** Drop rates, loot tables, distribution mechanics
- **Mythic+:** Infinite scaling, affixes, time limits, rewards

### Legendary Weapons (5 Total)
1. **Thunderfury, Blessed Blade of the Windseeker** (1H sword, 8 chapters)
2. **Sulfuras, Hand of Ragnaros** (2H mace, 7 chapters)
3. **Atiesh, Greatstaff of the Guardian** (Staff, 10 chapters)
4. **Shadowmourne** (2H axe, 12 chapters, hardest)
5. **Val'anyr, Hammer of Ancient Kings** (1H healing mace, 9 chapters)

All questlines fully detailed with objectives, materials, time investment.

### Save System
- **Format:** SQLite database, portable .db files
- **Schema:** 10+ tables (characters, items, quests, achievements, etc.)
- **Auto-save:** Every 60s + on major events
- **Corruption Protection:** Backup system, integrity checks
- **Versioning:** Migration system for updates
- **Cloud Support:** Manual (players copy files), no built-in sync

### Idle Calculation
- **Offline Simulation:** Calculates time delta, simulates activities at reduced efficiency
- **Efficiency Penalties:** Grinding -20%, Questing -25%, Dungeons -30%, Gathering -15%
- **Rested XP:** Accumulates while idle, balances penalties (+100% XP gain)
- **Activity Types:** Grinding, questing, dungeons, gathering, crafting all simulated
- **Progress Summary:** Detailed "Welcome Back" screen with all gains

### UI/UX Specifications
- **ASCII-Native:** All UI built with box-drawing characters
- **Panel Layout:** Character list, main view, combat log, quest tracker
- **Tooltips:** Hover on anything for detailed info (stats, formulas, lore)
- **Character Sheet:** Paper doll, stats, talents, professions all displayed
- **Inventory:** 4 bags (16-24 slots), bank storage, smart sorting
- **Zone Map:** ASCII representation with symbols (quests, dungeons, NPCs)
- **Raid Comp:** Visual party builder with role checks and suggestions

### Audio Design
- **Music:** 20-25 MIDI/chiptune tracks (zone, dungeon, raid, menu themes)
- **SFX:** Combat, UI, world sounds (all retro-inspired)
- **Settings:** Independent volume controls, custom playlist support
- **Total Size:** ~50 MB audio budget

### Achievement System
- **600+ Achievements** across 8 categories
- **Titles:** 50+ earnable titles (e.g., "the Undying", "Loremaster")
- **Rewards:** Gold, mounts, cosmetics, titles
- **Tracking:** Progress bars, completion percentages
- **Feats of Strength:** Prestigious achievements (Realm First, Legendaries)

---

## POST-LAUNCH ROADMAP (2+ Years)

### Phase 1: Polish & Balance (Months 1-2)
- Bug fixes, balance passes, QoL improvements

### Phase 2: "Echoes of the Fallen" (Months 3-4)
- Raid Tier 5: Netherstorm Citadel (8 bosses)
- 2 new dungeons
- Engineering profession
- New legendary: Thori'dal

### Phase 3: "Way of the Monk" (Months 5-6)
- 9th Class: Monk (3 specs: Brewmaster, Windwalker, Mistweaver)
- New starter zone
- Retroactive tier sets

### Phase 4: "Clash of Champions" (Months 7-8)
- PvP Arena system (3v3, 5v5, 10v10)
- Ranked seasons, leaderboards
- Exclusive PvP rewards

### Phase 5: "The Burning Frontier" (Months 9-12) - EXPANSION
- Level cap: 60 → 70
- 4 new zones, 3 new dungeons
- Raid Tier 6: The Burning Throne (12 bosses)
- Flying mounts

### Phase 6: "Ascension" (Month 13+)
- Prestige system (reset to level 1, gain permanent bonuses)
- Infinite progression

### Phase 7: Community Features (Month 14+)
- Save sharing, community challenges
- Mod support (official API)
- Seasonal events

---

## DEVELOPMENT READINESS

**All Systems Specified:**
✓ No TBDs or "to be decided"
✓ Every number has a value
✓ Every boss has mechanics
✓ Every formula is complete
✓ Every UI panel is designed

**Next Steps:**
1. Set up Electron + TypeScript project
2. Implement core game loop (tick system)
3. Build ASCII renderer
4. Create character system
5. Implement combat simulation
6. Design first zone + dungeon
7. Iterate and expand

**Estimated Development Time:**
- Solo developer: 12-18 months to v1.0
- Small team (2-3): 6-12 months to v1.0

**Project Scope:** Manageable for solo/small team due to ASCII art choice (10x faster asset creation).

---

## KEY FILES

- `game-design-plan.md` - Original design document
- `game-design-plan-detailed.md` - COMPLETE specification (THIS DOCUMENT)
- `DESIGN_SUMMARY.md` - This summary

**Total Documentation:** 52,000+ words of complete game design specifications.

---

Ready for development. Let's build this game! 🎮

