import React, { useEffect } from "react";
import { useUIStore, type ActiveTab } from "../stores/uiStore";
import { useGameStore } from "../stores/gameStore";
import { CharacterCreate } from "./CharacterCreate";
import { CharacterSheet } from "./CharacterSheet";
import { CombatLog } from "./CombatLog";
import { ZoneView } from "./ZoneView";

interface TabDef {
  id: ActiveTab;
  label: string;
}

const TABS: TabDef[] = [
  { id: "character", label: "Character" },
  { id: "inventory", label: "Inventory" },
  { id: "talents", label: "Talents" },
  { id: "quests", label: "Quests" },
  { id: "combat_log", label: "Combat Log" },
  { id: "world_map", label: "World Map" },
  { id: "professions", label: "Professions" },
  { id: "achievements", label: "Achievements" },
  { id: "settings", label: "Settings" },
];

export function AppShell() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const characters = useGameStore((s) => s.characters);
  const activeCharacterId = useGameStore((s) => s.activeCharacterId);
  const zoneState = useGameStore((s) => s.zoneState);
  const loadRoster = useGameStore((s) => s.loadRoster);

  // Load character roster on mount
  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  // Determine what to render
  const hasCharacters = characters.length > 0;
  const showCharacterCreate = !hasCharacters;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono">
      {/* Title Bar */}
      <header
        className="flex items-center justify-between bg-gray-900 border-b border-gray-700 px-3 py-1"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-amber-400 font-mono text-sm select-none">
          Legends of the Shattered Realm
        </span>
        <div
          className="flex gap-1"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            data-testid="btn-minimize"
            className="px-2 py-0.5 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded text-xs"
            aria-label="Minimize"
          >
            &#x2500;
          </button>
          <button
            data-testid="btn-maximize"
            className="px-2 py-0.5 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded text-xs"
            aria-label="Maximize"
          >
            &#x25A1;
          </button>
          <button
            data-testid="btn-close"
            className="px-2 py-0.5 text-gray-400 hover:text-gray-100 hover:bg-red-700 rounded text-xs"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>
      </header>

      {/* Menu Bar / Tab Navigation */}
      <nav className="flex bg-gray-900 border-b border-gray-700 px-1" role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? "bg-gray-700 text-amber-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Content Area */}
      <main data-testid="main-content" className="flex-1 overflow-hidden flex flex-col">
        {showCharacterCreate ? (
          <CharacterCreate />
        ) : (
          <>
            <div className="flex-1 overflow-hidden">
              {activeTab === "character" && <CharacterSheet />}
              {activeTab === "combat_log" && <CombatLog />}
              {activeTab === "inventory" && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Coming in Phase 3
                </div>
              )}
              {activeTab === "talents" && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Coming in Phase 3
                </div>
              )}
              {activeTab === "quests" && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Coming in Phase 3
                </div>
              )}
              {activeTab === "world_map" && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Coming in Phase 3
                </div>
              )}
              {activeTab === "professions" && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Coming in Phase 3
                </div>
              )}
              {activeTab === "achievements" && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Coming in Phase 3
                </div>
              )}
              {activeTab === "settings" && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Coming in Phase 3
                </div>
              )}
            </div>

            {/* Zone View - persistent bottom panel when grinding */}
            {activeCharacterId !== null && zoneState && zoneState.grinding && (
              <div className="h-64 border-t border-gray-700">
                <ZoneView />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
