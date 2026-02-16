// src/renderer/components/ZoneView.tsx
import React from "react";
import { useGameStore } from "@renderer/stores/gameStore";
import { getZone, getMob, getQuest } from "@game/data";
import type { ZoneId, MobId, QuestId } from "@shared/types";

export function ZoneView() {
  const activeCharacterId = useGameStore((state) => state.activeCharacterId);
  const characters = useGameStore((state) => state.characters);
  const zoneState = useGameStore((state) => state.zoneState);
  const questProgress = useGameStore((state) => state.questProgress);
  const startGrinding = useGameStore((state) => state.startGrinding);
  const stopGrinding = useGameStore((state) => state.stopGrinding);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId);

  if (!activeCharacter) {
    return (
      <div className="p-4 text-gray-400">
        No character selected. Select a character to explore zones.
      </div>
    );
  }

  const currentZoneId = activeCharacter.currentZone;
  const zone = getZone(currentZoneId as ZoneId);

  if (!zone) {
    return (
      <div className="p-4 text-red-400">
        Zone data not found for: {currentZoneId}
      </div>
    );
  }

  const isGrinding = zoneState?.grinding && zoneState?.zoneId === currentZoneId;
  const currentMobId = zoneState?.currentMob;
  const currentMob = currentMobId ? getMob(currentMobId as MobId) : null;

  // Get active quests for this zone
  const activeQuests = questProgress.filter(
    (qp) => qp.status === "active" && zone.questIds.includes(qp.questId as QuestId)
  );

  const handleStartGrinding = () => {
    startGrinding(currentZoneId);
  };

  const handleStopGrinding = () => {
    stopGrinding();
  };

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Zone header */}
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <h2 className="text-xl font-bold text-amber-400">{zone.name}</h2>
          <p className="text-sm text-gray-400">
            Level {zone.levelRange.min}-{zone.levelRange.max}
          </p>
          <p className="text-sm text-gray-300 mt-2">{zone.loreDescription}</p>
        </div>

        {/* Current encounter */}
        <div className="bg-gray-800 border border-gray-700 rounded p-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Current Encounter</h3>

          {!isGrinding && (
            <div className="text-gray-400">
              <p>Not currently grinding.</p>
              <button
                onClick={handleStartGrinding}
                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                data-testid="start-grinding-btn"
              >
                Start Grinding
              </button>
            </div>
          )}

          {isGrinding && !currentMob && (
            <div className="text-gray-400">
              <p>Searching for enemies...</p>
            </div>
          )}

          {isGrinding && currentMob && (
            <div className="space-y-3">
              {/* Mob info */}
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono">{currentMob.icon.char}</span>
                <div>
                  <p className="text-lg font-semibold text-gray-100">
                    {currentMob.name}
                    {currentMob.isElite && (
                      <span className="ml-2 text-xs text-amber-400 font-bold">ELITE</span>
                    )}
                    {currentMob.isBoss && (
                      <span className="ml-2 text-xs text-red-500 font-bold">BOSS</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">Level {currentMob.level}</p>
                </div>
              </div>

              {/* Mob HP bar (placeholder — real HP will come from combat state) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Mob HP</span>
                  <span>{currentMob.health} / {currentMob.health}</span>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              {/* Player status */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Your HP</span>
                  <span>{activeCharacter.stats.maxHp} / {activeCharacter.stats.maxHp}</span>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{ width: "100%" }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>Mana</span>
                  <span>{activeCharacter.stats.maxMana} / {activeCharacter.stats.maxMana}</span>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              {/* Stop button */}
              <button
                onClick={handleStopGrinding}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                data-testid="stop-grinding-btn"
              >
                Stop Grinding
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quest sidebar */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 space-y-3 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
          Active Quests
        </h3>

        {activeQuests.length === 0 && (
          <p className="text-sm text-gray-500">No active quests in this zone.</p>
        )}

        {activeQuests.map((qp) => {
          const quest = getQuest(qp.questId as QuestId);
          if (!quest) return null;

          return (
            <div
              key={qp.questId}
              className="bg-gray-900 border border-gray-700 rounded p-3 space-y-2"
              data-testid={`quest-${qp.questId}`}
            >
              <p className="font-semibold text-amber-400 text-sm">{quest.name}</p>
              <p className="text-xs text-gray-400">{quest.questText}</p>

              {/* Quest objectives */}
              <div className="space-y-1 mt-2">
                {quest.objectives.map((obj, idx) => {
                  const currentProgress = obj.targetId ? (qp.objectives[obj.targetId] || 0) : 0;
                  const isComplete = currentProgress >= obj.requiredCount;

                  return (
                    <div key={idx} className="text-xs">
                      <p className={isComplete ? "text-green-400" : "text-gray-300"}>
                        {obj.description}: {currentProgress} / {obj.requiredCount}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
