# Legends of the Shattered Realm — Overview & Design Decisions

> **Role:** Shared reference document. All subagents should read this file first.
> **Related files:** All other project plan files reference this.

---

# EXECUTIVE SUMMARY

**Elevator Pitch:** A single-player, offline idle MMORPG where you build a roster of classic fantasy heroes, grind them through the leveling journey of a sprawling old-school MMO world, and eventually field raid teams of your own alts against endgame bosses — all through satisfying incremental progression loops.

**Core Fantasy:** Relive the feeling of being a wide-eyed adventurer in a 2004-era MMO. The sense of danger in pulling one too many mobs. The thrill of a rare drop in a dungeon. The progression from a nobody in cloth scraps to a raid-geared legend. But this time, you're building an entire guild of characters — and the grind is the game.

**Key Differentiators:**
- Fully offline, no server dependency
- No monetization — pure passion project
- Alt-centric endgame: manage 10-20 characters
- Authentic classic MMO systems: talent trees, gear treadmill, weekly lockouts
- High-fidelity ASCII/ANSI art style (Caves of Qud inspired)

---

# PART 1: OPEN QUESTIONS — RESOLVED

## 1.1 ART STYLE: ASCII/ANSI vs PIXEL ART

### DECISION: HIGH-FIDELITY ASCII/ANSI ART (Caves of Qud Style)

**Rationale:**

For a solo or small team developing an offline idle MMORPG, ASCII/ANSI art is the superior choice for the following reasons:

**PROS of ASCII/ANSI:**
1. **Rapid Content Creation:** Can create zones, items, characters, and enemies 10x faster than pixel art
2. **Scalability:** With a consistent character set, procedural generation and variation become trivial
3. **Nostalgia Factor:** ASCII/ANSI evokes MUDs and classic roguelikes — the actual precursors to MMOs
4. **UI Integration:** Text-based art integrates seamlessly with tooltip-heavy MMO UIs
5. **File Size:** Entire game assets measured in kilobytes, not megabytes
6. **Accessibility:** Clear, readable, works at any resolution
7. **Technical Simplicity:** No sprite animation system needed, no texture atlasing
8. **Character Customization:** Can represent different gear on characters through color/symbol changes
9. **Modding Potential:** Players can easily create custom tilesets

**CONS of ASCII/ANSI:**
1. Niche aesthetic appeal (but our target audience appreciates this)
2. Limited visual spectacle (mitigated by particle effects using Unicode box-drawing characters)
3. Harder to market visually (less "screenshot-friendly")

**Technical Implementation:**
- **Display:** Use CP437 extended ASCII + ANSI color codes (16 foreground + 16 background colors)
- **Tile System:** Each game tile is a character + foreground color + background color
- **Unicode Support:** Supplement with Unicode box-drawing (U+2500-U+257F) for borders and effects
- **Font:** Use a crisp bitmap font (e.g., "Px437 IBM VGA8" or "Terminus") at 16x16 pixel character size
- **Effects:** Particle systems using characters like: *.·°¤x+÷±~≈ for magical effects
- **Animation:** Subtle color cycling and character substitution (e.g., fire: @&%$ cycling with orange/red/yellow)

**Art Style Reference:**
- Caves of Qud (high-fidelity ASCII with excellent UI)
- Dwarf Fortress (complex world, simple representation)
- ADOM (classic roguelike clarity)
- CDDA (detailed item/character representation)

**UI Design Philosophy:**
- Heavy use of box-drawing characters for windows and panels
- Color-coding for item quality (grey/green/blue/purple/orange text)
- Tooltip-heavy: hovering over any element shows detailed info
- Multiple simultaneous windows (character sheet, inventory, combat log, map)
- Inspired by classic MUD clients and modern roguelike UIs

---

## 1.2 CAPTURING 90s HIGH FANTASY FEELING

### Core Pillars of 90s MMO Feel:

1. **Reverent Worldbuilding**
2. **Earned Power Fantasy**
3. **Information Density**
4. **Community Ritual (Simulated)**
5. **Friction as Feature**

### 1.2.1 Reverent Worldbuilding

**Quest Text that Takes Itself Seriously:**

Bad (modern): "Hey! Go kill 10 rats. They're annoying!"

Good (classic): Farmer Theldric gives you a multi-paragraph speech about vermin overrunning his cellars, his lost hounds, and his wife who dares not venture below.

**Proper Fantasy Nomenclature:**
- Never "forest" — always "Thornwood Forest" or "The Whispering Glades"
- Never "bandits" — always "Blackthorn Renegades" or "the Dustwatch Outlaws"
- Items have lore: "Sword of the Fallen Knight" not "Iron Sword +2"

**Zone Lore Codex:**
Every zone has a lore entry the player can read with full backstory.

### 1.2.2 Earned Power Fantasy

**The Journey from Weak to Godlike:**
- Level 1: You fight one rat at a time and can die to two.
- Level 60 in raid gear: You AoE farm 20 mobs simultaneously while reading quest text.

**Visual Power Progression:**
- Level 1: `@` in grey (cloth scraps)
- Level 30: `@` in blue (dungeon gear, glowing weapon)
- Level 60 (raid): `☼` in purple/orange (legendary effect aura)

### 1.2.3 Information Density

Modern games hide complexity. Classic MMOs celebrated it.

Every stat, every ability, every mechanic should have a detailed tooltip accessible on hover with full damage formulas, coefficients, and related talent interactions.

Scrolling combat log showing every damage/healing event with timestamps.

### 1.2.4 Community Ritual (Simulated)

**Weekly Raid Reset:**
- Real-world Tuesday 3:00 AM (configurable) = raid lockouts reset
- Creates the ritual of "raid night"

**NPC Guild Chat:**
Simulated guild members (your alts + NPCs) have personalities and comment on your progress.

**Auction House Activity Feed** and **"Link Gear" Culture** (auto-announces major upgrades).

### 1.2.5 Friction as Feature

**Don't Streamline Everything:**
1. **Bag Space Management:** Limited inventory (16-slot bags, up to 5 bags)
2. **Reagents:** Some abilities consume items
3. **Repair Costs:** Gear takes durability damage, death = 10% durability loss
4. **Quest Item Drops:** Not every mob drops the quest item (40% drop rate)
5. **Travel Time:** No instant teleports early game, mounts at 20/40
6. **Rest XP:** Inactive characters accumulate rest XP (200% gain until depleted)

---

## 1.3 ACTIVE ENGAGEMENT IN AN IDLE GAME

> **See also:** `08_meta_systems.md` for detailed engagement systems.

**The Core Tension:**
- Idle games work while you're away
- But we want players to WANT to play actively
- Solution: Active play is more FUN and EFFICIENT, but idle play still progresses

**Design for 3 play patterns:**

**Pattern 1: The Check-In (5 minutes)** — Collect idle progress, claim dailies, start new tasks
**Pattern 2: The Session (30-60 minutes)** — Run dailies, clear dungeons, manage alts
**Pattern 3: The Deep Dive (2-4 hours)** — Attempt raids, hunt chase items, theorycraft builds

**All three are valid. All three make progress. Active play is rewarded with efficiency and fun, not gated content.**

---

## 1.4 TECHNOLOGY STACK

### Recommendation: Electron + TypeScript + SQLite

> **See also:** `01_core_engine_architecture.md` for full technical details.

**Frontend:**
- **Framework:** Electron (wraps web tech in desktop app)
- **Language:** TypeScript (type safety for complex game systems)
- **UI Library:** React (component-based UI)
- **ASCII Rendering:** Custom canvas renderer using HTML5 Canvas API
- **Styling:** Tailwind CSS (for UI panels) + custom ASCII window system
- **State Management:** Zustand (lightweight, simple)

**Backend/Game Logic:**
- **Language:** TypeScript (shared codebase with frontend)
- **Game Loop:** Custom tick system (1 tick = 1 second game time)
- **Combat Simulation:** Pure functions, deterministic
- **Random Number Generation:** Seedable RNG for deterministic replay

**Data Layer:**
- **Database:** SQLite (embedded, no server needed)
- **ORM:** Kysely (type-safe SQL query builder for TypeScript)
- **Save Files:** Single SQLite file per save (portable, shareable)

**Build Tools:**
- **Bundler:** Vite (fast, modern)
- **Packager:** Electron Builder (creates installers for all platforms)
- **Testing:** Vitest (unit tests for game logic)

**Performance Targets:**
- Load time: < 3 seconds
- Save file size: < 50 MB
- Memory usage: < 300 MB RAM
- CPU usage (idle): < 2%
- Build size: ~120 MB
- Tick rate: 1 tick/second

---

## 1.5 OFFLINE DESIGN & NO MONETIZATION

**Removing monetization changes:**

1. **No Artificial Scarcity** — No premium currency, no wait timers
2. **Free Respecs** — Unlimited, no escalating gold cost
3. **Unlimited Alt Slots** — Alts are the game, don't gate them
4. **Tuned for Fun XP Rates** — First char to 60: 1-2 weeks semi-active
5. **Large Bags Earnable** — 20-slot from professions, 24-slot from raids
6. **All Cosmetics In-Game** — Rare mounts from bosses, transmog from achievements
7. **No Energy System** — Play as much or little as you want
8. **Portable Save Files** — No account lock-in, can backup/share
9. **Free Updates** — Passion project, all updates free
10. **Design for Fun** — No A/B testing for monetization, no daily login bribes

**What We Gain:** Pure game design, passionate community, creative freedom, portfolio piece
**What We Lose:** Revenue (acceptable — passion project, ASCII art keeps costs near-zero)
