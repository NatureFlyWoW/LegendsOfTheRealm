import React, { useEffect, useRef } from "react";
import { useGameStore } from "@renderer/stores/gameStore";
import { useSettingsStore } from "@renderer/stores/settingsStore";
import type { CombatEvent } from "@shared/combat-interfaces";

export interface CombatLogProps {
  className?: string;
}

export const CombatLog: React.FC<CombatLogProps> = ({ className = "" }) => {
  const combatEvents = useGameStore((state) => state.combatEvents);
  const maxLines = useSettingsStore((state) => state.combatLogMaxLines);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatEvents]);

  const handleClear = () => {
    // Clear events by setting to empty array
    useGameStore.setState({ combatEvents: [] });
  };

  // Enforce max lines from settings
  const displayedEvents = combatEvents.slice(-maxLines);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with clear button */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">Combat Log</h3>
        <button
          onClick={handleClear}
          className="px-2 py-1 text-xs text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          data-testid="clear-log-button"
        >
          Clear
        </button>
      </div>

      {/* Scrollable log */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 bg-gray-900 font-mono text-sm"
        data-testid="combat-log-container"
      >
        {displayedEvents.length === 0 ? (
          <div className="text-gray-500 italic">No combat events</div>
        ) : (
          displayedEvents.map((event, index) => (
            <div key={`${event.tick}-${index}`} className="leading-tight">
              {formatCombatEvent(event)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Format a combat event as a colored text line.
 * Color coding:
 * - damage → red text
 * - heal → green text
 * - miss/dodge/parry → grey text
 * - XP gain → yellow text (resource_change with xp)
 * - loot → cyan text (not in current CombatEvent types, placeholder)
 * - level-up → bright white, bold (not in current CombatEvent types, placeholder)
 * - quest progress → amber text (not in current CombatEvent types, placeholder)
 */
function formatCombatEvent(event: CombatEvent): JSX.Element {
  const baseClass = "whitespace-pre-wrap break-words";

  switch (event.type) {
    case "damage": {
      const critText = event.isCrit ? " *CRIT*" : "";
      const blockText = event.isBlocked ? ` (blocked ${event.blockAmount})` : "";
      const text = `[${event.tick}] ${event.sourceName}'s ${event.abilityName} hits ${event.targetName} for ${event.amount}${critText}${blockText}`;
      return <span className={`${baseClass} text-red-400`}>{text}</span>;
    }

    case "heal": {
      const critText = event.isCrit ? " *CRIT*" : "";
      const overhealText = event.overheal > 0 ? ` (${event.overheal} overheal)` : "";
      const text = `[${event.tick}] ${event.sourceName}'s ${event.abilityName} heals ${event.targetName} for ${event.amount}${critText}${overhealText}`;
      return <span className={`${baseClass} text-green-400`}>{text}</span>;
    }

    case "miss": {
      const text = `[${event.tick}] ${event.sourceName}'s ${event.abilityName} ${event.missType}ed by ${event.targetName}`;
      return <span className={`${baseClass} text-gray-500`}>{text}</span>;
    }

    case "buff_apply": {
      const stackText = event.stacks > 1 ? ` (${event.stacks})` : "";
      const text = `[${event.tick}] ${event.targetName} gains ${event.buffName}${stackText}`;
      return <span className={`${baseClass} text-blue-400`}>{text}</span>;
    }

    case "buff_expire": {
      const text = `[${event.tick}] ${event.buffName} fades from ${event.targetName}`;
      return <span className={`${baseClass} text-gray-400`}>{text}</span>;
    }

    case "death": {
      const text = `[${event.tick}] ${event.targetName} dies to ${event.killingAbility}`;
      return <span className={`${baseClass} text-red-600 font-bold`}>{text}</span>;
    }

    case "ability_cast": {
      const text = `[${event.tick}] ${event.sourceName} begins casting ${event.abilityName}`;
      return <span className={`${baseClass} text-cyan-400`}>{text}</span>;
    }

    case "interrupt": {
      const text = `[${event.tick}] ${event.sourceName}'s ${event.abilityName} interrupts ${event.targetName}'s ${event.interruptedAbility}`;
      return <span className={`${baseClass} text-orange-400`}>{text}</span>;
    }

    case "dispel": {
      const text = `[${event.tick}] ${event.sourceName}'s ${event.abilityName} dispels ${event.dispelledBuff} from ${event.targetName}`;
      return <span className={`${baseClass} text-purple-400`}>{text}</span>;
    }

    case "absorb": {
      const text = `[${event.tick}] ${event.targetName}'s ${event.abilityName} absorbs ${event.amount} damage`;
      return <span className={`${baseClass} text-yellow-300`}>{text}</span>;
    }

    case "phase_change": {
      const text = `[${event.tick}] === PHASE ${event.phase}: ${event.phaseName} ===`;
      return <span className={`${baseClass} text-yellow-200 font-bold`}>{text}</span>;
    }

    case "enrage": {
      const text = `[${event.tick}] ${event.sourceName} ENRAGES!`;
      return <span className={`${baseClass} text-red-500 font-bold`}>{text}</span>;
    }

    case "summon": {
      const text = `[${event.tick}] ${event.sourceName} summons ${event.summonName}`;
      return <span className={`${baseClass} text-indigo-400`}>{text}</span>;
    }

    case "resource_change": {
      const sign = event.amount >= 0 ? "+" : "";
      const text = `[${event.tick}] ${event.targetName} ${sign}${event.amount} ${event.resourceType} (${event.current})`;
      // XP gain → yellow text (treat as yellow for any resource gain for now)
      const color = event.amount > 0 ? "text-yellow-400" : "text-gray-400";
      return <span className={`${baseClass} ${color}`}>{text}</span>;
    }

    default: {
      // Exhaustive check — should never reach here
      const _exhaustive: never = event;
      return <span className={baseClass}>Unknown event type</span>;
    }
  }
}
