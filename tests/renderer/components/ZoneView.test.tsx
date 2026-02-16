// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useGameStore } from "@renderer/stores/gameStore";
import type { CharacterState, QuestState } from "@renderer/stores/gameStore";
import type { EffectiveStats } from "@shared/types";
import { ClassName, RaceName, ActivityType } from "@shared/enums";

beforeAll(() => {
  Object.defineProperty(globalThis, "window", {
    value: {
      ...globalThis.window,
      api: {
        ping: () => "pong",
        character: {
          list: vi.fn(),
          create: vi.fn(),
          setActivity: vi.fn(),
        },
      },
    },
    writable: true,
  });
});

// Lazy import so the module loads after window.api is mocked
let ZoneView: React.ComponentType;

beforeAll(async () => {
  const mod = await import("@renderer/components/ZoneView");
  ZoneView = mod.ZoneView;
});

const mockStats: EffectiveStats = {
  strength: 10,
  agility: 10,
  intellect: 10,
  stamina: 10,
  spirit: 10,
  maxHp: 100,
  maxMana: 50,
  attackPower: 20,
  spellPower: 15,
  armor: 30,
  critChance: 5,
  hitChance: 95,
  hastePercent: 0,
  dodgeChance: 5,
  parryChance: 5,
  blockChance: 5,
  blockValue: 10,
  defenseSkill: 0,
  resilience: 0,
  mp5: 5,
  weaponDamageMin: 5,
  weaponDamageMax: 10,
  weaponSpeed: 2.0,
};

const mockCharacter: CharacterState = {
  id: 1,
  name: "TestHero",
  race: RaceName.Human,
  className: ClassName.Warrior,
  level: 3,
  xp: 100,
  restedXp: 0,
  gold: 1000,
  currentZone: "zone_greenhollow_vale" as any,
  activity: ActivityType.Idle,
  activeSpec: "arms",
  talentPoints: {},
  equipment: {
    head: null,
    shoulder: null,
    back: null,
    chest: null,
    wrist: null,
    hands: null,
    waist: null,
    legs: null,
    feet: null,
    neck: null,
    ring1: null,
    ring2: null,
    trinket1: null,
    trinket2: null,
    main_hand: null,
    off_hand: null,
  },
  stats: mockStats,
  companionClears: {},
  createdAt: Date.now(),
  lastPlayedAt: Date.now(),
};

describe("ZoneView", () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      characters: [],
      activeCharacterId: null,
      combatEvents: [],
      zoneState: null,
      questProgress: [],
      welcomeBack: null,
      isLoading: false,
    });
  });

  it("renders zone name", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
    });

    render(<ZoneView />);

    expect(screen.getByText("Greenhollow Vale")).toBeDefined();
    expect(screen.getByText("Level 1-5")).toBeDefined();
  });

  it("shows 'Start Grinding' button when not grinding", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      zoneState: null,
    });

    render(<ZoneView />);

    const startBtn = screen.getByTestId("start-grinding-btn");
    expect(startBtn).toBeDefined();
    expect(startBtn.textContent).toBe("Start Grinding");
  });

  it("calls gameStore.startGrinding when Start button clicked", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      zoneState: null,
    });

    const startGrindingSpy = vi.spyOn(useGameStore.getState(), "startGrinding");

    render(<ZoneView />);

    const startBtn = screen.getByTestId("start-grinding-btn");
    fireEvent.click(startBtn);

    expect(startGrindingSpy).toHaveBeenCalledWith("zone_greenhollow_vale");
  });

  it("shows mob info when grinding with a mob", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      zoneState: {
        grinding: true,
        zoneId: "zone_greenhollow_vale",
        currentMob: "mob_cellar_rat",
      },
    });

    render(<ZoneView />);

    expect(screen.getByText("Cellar Rat")).toBeDefined();
    expect(screen.getByText("Level 1")).toBeDefined();
  });

  it("shows Stop button when grinding", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      zoneState: {
        grinding: true,
        zoneId: "zone_greenhollow_vale",
        currentMob: "mob_cellar_rat",
      },
    });

    render(<ZoneView />);

    const stopBtn = screen.getByTestId("stop-grinding-btn");
    expect(stopBtn).toBeDefined();
    expect(stopBtn.textContent).toBe("Stop Grinding");
  });

  it("calls gameStore.stopGrinding when Stop button clicked", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      zoneState: {
        grinding: true,
        zoneId: "zone_greenhollow_vale",
        currentMob: "mob_cellar_rat",
      },
    });

    const stopGrindingSpy = vi.spyOn(useGameStore.getState(), "stopGrinding");

    render(<ZoneView />);

    const stopBtn = screen.getByTestId("stop-grinding-btn");
    fireEvent.click(stopBtn);

    expect(stopGrindingSpy).toHaveBeenCalled();
  });

  it("displays quest progress correctly", () => {
    const questState: QuestState = {
      questId: "quest_rat_problem",
      objectives: {
        mob_cellar_rat: 7,
      },
      status: "active",
    };

    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      questProgress: [questState],
    });

    render(<ZoneView />);

    expect(screen.getByText("The Rat Problem")).toBeDefined();
    expect(screen.getByText(/Kill Cellar Rats: 7 \/ 10/)).toBeDefined();
  });

  it("shows 'No active quests' when no quests in progress", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      questProgress: [],
    });

    render(<ZoneView />);

    expect(screen.getByText("No active quests in this zone.")).toBeDefined();
  });

  it("shows message when no character selected", () => {
    useGameStore.setState({
      characters: [],
      activeCharacterId: null,
    });

    render(<ZoneView />);

    expect(
      screen.getByText("No character selected. Select a character to explore zones.")
    ).toBeDefined();
  });

  it("shows 'Searching for enemies' when grinding but no mob loaded", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      zoneState: {
        grinding: true,
        zoneId: "zone_greenhollow_vale",
        currentMob: null,
      },
    });

    render(<ZoneView />);

    expect(screen.getByText("Searching for enemies...")).toBeDefined();
  });

  it("shows ELITE badge for elite mobs", () => {
    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      zoneState: {
        grinding: true,
        zoneId: "zone_greenhollow_vale",
        currentMob: "mob_kragg",
      },
    });

    render(<ZoneView />);

    expect(screen.getByText("ELITE")).toBeDefined();
    expect(screen.getByText("BOSS")).toBeDefined();
  });

  it("renders multiple active quests", () => {
    const quest1: QuestState = {
      questId: "quest_rat_problem",
      objectives: { mob_cellar_rat: 7 },
      status: "active",
    };

    const quest2: QuestState = {
      questId: "quest_wolf_menace",
      objectives: { mob_dire_wolf: 3 },
      status: "active",
    };

    useGameStore.setState({
      characters: [mockCharacter],
      activeCharacterId: 1,
      questProgress: [quest1, quest2],
    });

    render(<ZoneView />);

    expect(screen.getByText("The Rat Problem")).toBeDefined();
    expect(screen.getByText("Wolf Menace")).toBeDefined();
  });
});
