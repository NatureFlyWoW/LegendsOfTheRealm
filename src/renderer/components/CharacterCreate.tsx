import React, { useState, useMemo } from "react";
import { getAllRaces, getAllClasses } from "@game/data";
import { useGameStore } from "@renderer/stores/gameStore";
import type { RaceDefinition, ClassDefinition } from "@shared/definitions";
import type { RaceName, ClassName, PrimaryStat } from "@shared/enums";

export function CharacterCreate() {
  const [name, setName] = useState("");
  const [selectedRace, setSelectedRace] = useState<RaceName | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null);

  const createCharacter = useGameStore((s) => s.createCharacter);
  const isLoading = useGameStore((s) => s.isLoading);

  const races = getAllRaces();
  const classes = getAllClasses();

  // Name validation
  const nameValid = name.length >= 2 && name.length <= 16;
  const nameError = name.length > 0 && !nameValid;

  // Can create only if all fields valid
  const canCreate = nameValid && selectedRace !== null && selectedClass !== null;

  // Compute preview stats
  const previewStats = useMemo(() => {
    if (!selectedRace || !selectedClass) return null;

    const raceData = races.find((r) => r.id === selectedRace);
    const classData = classes.find((c) => c.id === selectedClass);

    if (!raceData || !classData) return null;

    // Base stats from class
    const stats: Record<PrimaryStat, number> = { ...classData.baseStats };

    // Apply racial bonuses (for simplicity, we'll only show flat stat bonuses)
    // Racial bonuses like xp_gain, crit_chance, etc. are shown in the race card description

    return {
      race: raceData.name,
      class: classData.name,
      resourceType: classData.resourceType,
      stats,
    };
  }, [selectedRace, selectedClass, races, classes]);

  const handleCreate = async () => {
    if (!canCreate || !selectedRace || !selectedClass) return;
    await createCharacter(name, selectedRace, selectedClass);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700 px-4 py-3">
        <h1 className="text-xl font-bold text-amber-400">Create New Character</h1>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Step 1: Name */}
          <section>
            <h2 className="text-lg font-semibold text-amber-300 mb-2">Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              placeholder="Enter character name (2-16 characters)"
              className={`w-full px-3 py-2 bg-gray-900 border rounded ${
                nameError
                  ? "border-red-500 focus:border-red-400"
                  : "border-gray-600 focus:border-amber-500"
              } focus:outline-none text-gray-100`}
              data-testid="input-name"
            />
            {nameError && (
              <p className="text-red-400 text-sm mt-1">
                Name must be 2-16 characters long
              </p>
            )}
          </section>

          {/* Step 2: Race */}
          <section>
            <h2 className="text-lg font-semibold text-amber-300 mb-2">Race</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {races.map((race) => (
                <RaceCard
                  key={race.id}
                  race={race}
                  selected={selectedRace === race.id}
                  onSelect={() => setSelectedRace(race.id)}
                />
              ))}
            </div>
          </section>

          {/* Step 3: Class */}
          <section>
            <h2 className="text-lg font-semibold text-amber-300 mb-2">Class</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {classes.map((cls) => (
                <ClassCard
                  key={cls.id}
                  classData={cls}
                  selected={selectedClass === cls.id}
                  onSelect={() => setSelectedClass(cls.id)}
                />
              ))}
            </div>
          </section>

          {/* Step 4: Preview */}
          {previewStats && (
            <section>
              <h2 className="text-lg font-semibold text-amber-300 mb-2">Preview</h2>
              <div className="bg-gray-900 border border-gray-700 rounded p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-gray-100 font-semibold">{name || "(none)"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Race</p>
                    <p className="text-gray-100 font-semibold">{previewStats.race}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Class</p>
                    <p className="text-gray-100 font-semibold">{previewStats.class}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Resource</p>
                    <p className="text-gray-100 font-semibold capitalize">
                      {previewStats.resourceType.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Starting Stats (Level 1)</p>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Strength</p>
                      <p className="text-lg text-green-400 font-semibold">
                        {previewStats.stats.strength}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Agility</p>
                      <p className="text-lg text-green-400 font-semibold">
                        {previewStats.stats.agility}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Intellect</p>
                      <p className="text-lg text-green-400 font-semibold">
                        {previewStats.stats.intellect}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stamina</p>
                      <p className="text-lg text-green-400 font-semibold">
                        {previewStats.stats.stamina}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Spirit</p>
                      <p className="text-lg text-green-400 font-semibold">
                        {previewStats.stats.spirit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer with Create Button */}
      <div className="border-t border-gray-700 px-4 py-3 flex justify-end">
        <button
          onClick={handleCreate}
          disabled={!canCreate || isLoading}
          className={`px-6 py-2 rounded font-semibold ${
            canCreate && !isLoading
              ? "bg-amber-600 hover:bg-amber-500 text-gray-100 cursor-pointer"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
          data-testid="btn-create"
        >
          {isLoading ? "Creating..." : "Create Character"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Race Card Component
// ============================================================

interface RaceCardProps {
  race: RaceDefinition;
  selected: boolean;
  onSelect: () => void;
}

function RaceCard({ race, selected, onSelect }: RaceCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-3 rounded border-2 transition-colors ${
        selected
          ? "border-amber-500 bg-amber-900/20"
          : "border-gray-700 bg-gray-900 hover:border-gray-600"
      }`}
      data-testid={`race-${race.id}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-3xl" aria-hidden="true">
          {race.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-100">{race.name}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{race.lore}</p>
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-green-400">
              <span className="text-gray-500">Primary:</span>{" "}
              {formatBonus(race.primaryBonus)}
            </p>
            <p className="text-blue-400">
              <span className="text-gray-500">Secondary:</span>{" "}
              {formatBonus(race.secondaryBonus)}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================================
// Class Card Component
// ============================================================

interface ClassCardProps {
  classData: ClassDefinition;
  selected: boolean;
  onSelect: () => void;
}

function ClassCard({ classData, selected, onSelect }: ClassCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-3 rounded border-2 transition-colors ${
        selected
          ? "border-amber-500 bg-amber-900/20"
          : "border-gray-700 bg-gray-900 hover:border-gray-600"
      }`}
      data-testid={`class-${classData.id}`}
    >
      <h3 className="font-semibold text-gray-100">{classData.name}</h3>
      <p className="text-xs text-gray-400 mt-1 line-clamp-3">
        {classData.description}
      </p>
      <div className="mt-2 space-y-1 text-xs">
        <p className="text-purple-400">
          <span className="text-gray-500">Resource:</span>{" "}
          <span className="capitalize">{classData.resourceType.replace("_", " ")}</span>
        </p>
        <p className="text-gray-500">
          Specs: {classData.specs.map((s) => s.replace("_", " ")).join(", ")}
        </p>
      </div>
    </button>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function formatBonus(bonus: { stat: string; value: number; isPercentage: boolean }) {
  const sign = bonus.value > 0 ? "+" : "";
  const suffix = bonus.isPercentage ? "%" : "";
  return `${sign}${bonus.value}${suffix} ${bonus.stat.replace("_", " ")}`;
}
