import React from "react";
import { useGameStore } from "@renderer/stores/gameStore";
import { getXpForLevel } from "@game/data";
import { GearSlot, QualityTier } from "@shared/enums";
import type { ItemInstance } from "@shared/types";

// Quality tier to Tailwind color mapping
const QUALITY_COLORS: Record<QualityTier, string> = {
  [QualityTier.Common]: "text-gray-400",
  [QualityTier.Uncommon]: "text-green-500",
  [QualityTier.Rare]: "text-blue-500",
  [QualityTier.Epic]: "text-purple-500",
  [QualityTier.Legendary]: "text-orange-500",
};

// All 16 gear slots in paper doll order
const GEAR_SLOTS = [
  GearSlot.Head,
  GearSlot.Neck,
  GearSlot.Shoulder,
  GearSlot.Back,
  GearSlot.Chest,
  GearSlot.Wrist,
  GearSlot.Hands,
  GearSlot.Waist,
  GearSlot.Legs,
  GearSlot.Feet,
  GearSlot.Ring1,
  GearSlot.Ring2,
  GearSlot.Trinket1,
  GearSlot.Trinket2,
  GearSlot.MainHand,
  GearSlot.OffHand,
];

// Slot labels for UI
const SLOT_LABELS: Record<GearSlot, string> = {
  [GearSlot.Head]: "Head",
  [GearSlot.Neck]: "Neck",
  [GearSlot.Shoulder]: "Shoulder",
  [GearSlot.Back]: "Back",
  [GearSlot.Chest]: "Chest",
  [GearSlot.Wrist]: "Wrist",
  [GearSlot.Hands]: "Hands",
  [GearSlot.Waist]: "Waist",
  [GearSlot.Legs]: "Legs",
  [GearSlot.Feet]: "Feet",
  [GearSlot.Ring1]: "Ring 1",
  [GearSlot.Ring2]: "Ring 2",
  [GearSlot.Trinket1]: "Trinket 1",
  [GearSlot.Trinket2]: "Trinket 2",
  [GearSlot.MainHand]: "Main Hand",
  [GearSlot.OffHand]: "Off Hand",
};

export function CharacterSheet() {
  const activeCharacterId = useGameStore((s) => s.activeCharacterId);
  const characters = useGameStore((s) => s.characters);
  const equipItem = useGameStore((s) => s.equipItem);

  const character = characters.find((c) => c.id === activeCharacterId);

  if (!character) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No character selected
      </div>
    );
  }

  const xpRequired = getXpForLevel(character.level);
  const xpPercent = xpRequired > 0 ? (character.xp / xpRequired) * 100 : 0;

  // Mock inventory items for now (will be real data from IPC later)
  const inventoryItems: Array<ItemInstance & { quality: QualityTier; name: string }> = [];

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
      {/* Header: Name, Race, Class, Level */}
      <div className="bg-gray-800 border border-gray-700 rounded p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🛡️</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-amber-400">{character.name}</h1>
            <p className="text-sm text-gray-400">
              Level {character.level} {character.race} {character.className}
            </p>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded p-3">
        <div className="text-xs text-gray-400 mb-1">
          Experience: {character.xp} / {xpRequired} ({xpPercent.toFixed(1)}%)
        </div>
        <div className="w-full bg-gray-900 rounded h-4 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all"
            style={{ width: `${Math.min(xpPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Panel */}
      <div className="bg-gray-800 border border-gray-700 rounded p-3">
        <h2 className="text-sm font-bold text-amber-400 mb-2">Stats</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {/* Base Stats */}
          <div>
            <span className="text-gray-400">Strength:</span>{" "}
            <span className="text-white">{character.stats.strength}</span>
          </div>
          <div>
            <span className="text-gray-400">Agility:</span>{" "}
            <span className="text-white">{character.stats.agility}</span>
          </div>
          <div>
            <span className="text-gray-400">Intellect:</span>{" "}
            <span className="text-white">{character.stats.intellect}</span>
          </div>
          <div>
            <span className="text-gray-400">Stamina:</span>{" "}
            <span className="text-white">{character.stats.stamina}</span>
          </div>
          <div>
            <span className="text-gray-400">Spirit:</span>{" "}
            <span className="text-white">{character.stats.spirit}</span>
          </div>

          {/* Derived Stats */}
          <div>
            <span className="text-gray-400">HP:</span>{" "}
            <span className="text-white">{character.stats.maxHp}</span>
          </div>
          <div>
            <span className="text-gray-400">Mana:</span>{" "}
            <span className="text-white">{character.stats.maxMana}</span>
          </div>
          <div>
            <span className="text-gray-400">Attack Power:</span>{" "}
            <span className="text-white">{character.stats.attackPower}</span>
          </div>
          <div>
            <span className="text-gray-400">Spell Power:</span>{" "}
            <span className="text-white">{character.stats.spellPower}</span>
          </div>
          <div>
            <span className="text-gray-400">Crit Chance:</span>{" "}
            <span className="text-white">{character.stats.critChance.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-gray-400">Armor:</span>{" "}
            <span className="text-white">{character.stats.armor}</span>
          </div>
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="bg-gray-800 border border-gray-700 rounded p-3">
        <h2 className="text-sm font-bold text-amber-400 mb-2">Equipment</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {GEAR_SLOTS.map((slot) => {
            const equippedSlot = character.equipment[slot];
            const hasItem = equippedSlot !== null;

            return (
              <div
                key={slot}
                className="bg-gray-900 border border-gray-700 rounded p-2 flex items-center gap-2"
              >
                <span className="text-gray-500 w-20 shrink-0">{SLOT_LABELS[slot]}:</span>
                <span className={hasItem ? "text-gray-300" : "text-gray-600 italic"}>
                  {hasItem ? `Item ${equippedSlot}` : "Empty"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="bg-gray-800 border border-gray-700 rounded p-3">
        <h2 className="text-sm font-bold text-amber-400 mb-2">Inventory (16 slots)</h2>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {Array.from({ length: 16 }).map((_, index) => {
            const item = inventoryItems.find((i) => i.bagSlot === index);
            return (
              <button
                key={index}
                onClick={() => item && equipItem(index)}
                className="bg-gray-900 border border-gray-700 rounded p-2 h-16 flex items-center justify-center hover:bg-gray-800 transition-colors"
                disabled={!item}
              >
                {item ? (
                  <span className={QUALITY_COLORS[item.quality]}>{item.name}</span>
                ) : (
                  <span className="text-gray-700">—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
