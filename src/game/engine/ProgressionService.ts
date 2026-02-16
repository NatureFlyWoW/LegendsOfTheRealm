// src/game/engine/ProgressionService.ts
import type { CharacterState } from "@shared/types";
import type { GameEvent } from "@shared/events";
import { EventBus } from "./EventBus";
import { getXpForLevel, getClass } from "@game/data";

export interface LevelUpResult {
  levelsGained: number;
  oldLevel: number;
  newLevel: number;
  events: GameEvent[];
}

export class ProgressionService {
  constructor(private eventBus: EventBus) {}

  awardXp(character: CharacterState, amount: number): LevelUpResult {
    const oldLevel = character.level;
    let levelsGained = 0;
    const events: GameEvent[] = [];

    character.xp += amount;

    while (character.xp >= getXpForLevel(character.level)) {
      const threshold = getXpForLevel(character.level);
      character.xp -= threshold;
      character.level += 1;
      levelsGained += 1;

      this.applyLevelGains(character);

      const event: GameEvent = {
        type: "CHARACTER_LEVELED",
        characterId: character.id,
        newLevel: character.level,
        timestamp: Date.now(),
      };
      events.push(event);
      this.eventBus.emit(event);
    }

    return {
      levelsGained,
      oldLevel,
      newLevel: character.level,
      events,
    };
  }

  private applyLevelGains(character: CharacterState): void {
    const classDef = getClass(character.className);
    if (!classDef) {
      throw new Error(`Class definition not found: ${character.className}`);
    }

    const gains = classDef.perLevelGains;
    character.stats.strength += gains.strength;
    character.stats.agility += gains.agility;
    character.stats.intellect += gains.intellect;
    character.stats.stamina += gains.stamina;
    character.stats.spirit += gains.spirit;
  }
}
