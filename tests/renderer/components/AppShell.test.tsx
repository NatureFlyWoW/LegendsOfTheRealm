// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useUIStore } from "@renderer/stores/uiStore";

beforeAll(() => {
  Object.defineProperty(globalThis, "window", {
    value: {
      ...globalThis.window,
      api: {
        ping: () => "pong",
        createSave: vi.fn(),
        openSave: vi.fn(),
        listSaves: vi.fn(),
        backupSave: vi.fn(),
        startGame: vi.fn(),
        stopGame: vi.fn(),
        pauseGame: vi.fn(),
        resumeGame: vi.fn(),
        getGameState: vi.fn(),
        onTick: vi.fn(() => () => {}),
        onGameEvent: vi.fn(() => () => {}),
        sendCommand: vi.fn(),
        sendQuery: vi.fn(),
        character: {
          list: vi.fn(async () => []),
          create: vi.fn(async () => ({ success: true, characterId: 1 })),
          setActivity: vi.fn(async () => ({ success: true })),
          equipItem: vi.fn(async () => ({ success: true })),
          unequipItem: vi.fn(async () => ({ success: true })),
        },
      },
    },
    writable: true,
  });
});

// Lazy import so the module loads after window.api is mocked
let AppShell: React.ComponentType;

beforeAll(async () => {
  const mod = await import("@renderer/components/AppShell");
  AppShell = mod.AppShell;
});

describe("AppShell", () => {
  beforeEach(async () => {
    // Reset store state before each test
    useUIStore.setState({
      activeTab: "character",
      selectedCharacterId: null,
      isMenuOpen: false,
      modal: null,
      sidebarWidth: 300,
      combatLogVisible: true,
    });

    const { useGameStore } = await import("@renderer/stores/gameStore");
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

  it("renders the title 'Legends of the Shattered Realm'", () => {
    render(<AppShell />);
    expect(
      screen.getByText("Legends of the Shattered Realm"),
    ).toBeDefined();
  });

  it("renders navigation tabs", () => {
    render(<AppShell />);
    const expectedTabs = [
      "Character",
      "Inventory",
      "Talents",
      "Quests",
      "Combat Log",
      "World Map",
      "Professions",
      "Achievements",
      "Settings",
    ];
    for (const tab of expectedTabs) {
      expect(screen.getByText(tab)).toBeDefined();
    }
  });

  it("renders main content area", () => {
    render(<AppShell />);
    expect(screen.getByTestId("main-content")).toBeDefined();
  });

  it("renders window control buttons", () => {
    render(<AppShell />);
    expect(screen.getByTestId("btn-minimize")).toBeDefined();
    expect(screen.getByTestId("btn-maximize")).toBeDefined();
    expect(screen.getByTestId("btn-close")).toBeDefined();
  });

  it("clicking a tab updates aria-selected", () => {
    render(<AppShell />);

    const inventoryTab = screen.getByText("Inventory");
    const characterTab = screen.getByText("Character");

    // Initially, Character tab is selected
    expect(characterTab.getAttribute("aria-selected")).toBe("true");
    expect(inventoryTab.getAttribute("aria-selected")).toBe("false");

    // Click Inventory tab
    fireEvent.click(inventoryTab);

    // Now Inventory should be selected, Character should not
    expect(inventoryTab.getAttribute("aria-selected")).toBe("true");
    expect(characterTab.getAttribute("aria-selected")).toBe("false");
  });

  it("shows CharacterCreate when no characters exist", async () => {
    const { useGameStore } = await import("@renderer/stores/gameStore");
    useGameStore.setState({ characters: [] });

    render(<AppShell />);

    // Should show character creation UI
    expect(screen.getByText("Create New Character")).toBeDefined();
  });

  it("shows CharacterSheet on Character tab when characters exist", async () => {
    const { useGameStore } = await import("@renderer/stores/gameStore");
    useGameStore.setState({
      characters: [
        {
          id: 1,
          name: "TestChar",
          race: "human" as any,
          className: "warrior" as any,
          level: 1,
          xp: 0,
          stats: {
            strength: 10,
            agility: 10,
            intellect: 10,
            stamina: 10,
            spirit: 10,
            maxHp: 100,
            maxMana: 100,
            attackPower: 10,
            spellPower: 0,
            critChance: 5,
            armor: 0,
          },
          equipment: {},
          currentZone: "elwynn_forest",
        } as any,
      ],
      activeCharacterId: 1,
    });

    render(<AppShell />);

    // Should show character sheet with character name
    expect(screen.getByText("TestChar")).toBeDefined();
  });

  it("shows CombatLog on Combat Log tab", async () => {
    const { useGameStore } = await import("@renderer/stores/gameStore");
    useGameStore.setState({
      characters: [
        {
          id: 1,
          name: "TestChar",
          race: "human" as any,
          className: "warrior" as any,
          level: 1,
          xp: 0,
          stats: {
            strength: 10,
            agility: 10,
            intellect: 10,
            stamina: 10,
            spirit: 10,
            maxHp: 100,
            maxMana: 100,
            attackPower: 10,
            spellPower: 0,
            critChance: 5,
            armor: 0,
          },
          equipment: {},
          currentZone: "elwynn_forest",
        } as any,
      ],
      activeCharacterId: 1,
    });

    render(<AppShell />);

    // Click Combat Log tab
    const combatLogTab = screen.getByText("Combat Log");
    fireEvent.click(combatLogTab);

    // Should show combat log
    expect(screen.getByTestId("combat-log-container")).toBeDefined();
  });

  it('shows "Coming in Phase 3" for unimplemented tabs', async () => {
    const { useGameStore } = await import("@renderer/stores/gameStore");
    useGameStore.setState({
      characters: [
        {
          id: 1,
          name: "TestChar",
          race: "human" as any,
          className: "warrior" as any,
          level: 1,
          xp: 0,
          stats: {
            strength: 10,
            agility: 10,
            intellect: 10,
            stamina: 10,
            spirit: 10,
            maxHp: 100,
            maxMana: 100,
            attackPower: 10,
            spellPower: 0,
            critChance: 5,
            armor: 0,
          },
          equipment: {},
          currentZone: "elwynn_forest",
        } as any,
      ],
      activeCharacterId: 1,
    });

    render(<AppShell />);

    // Click Inventory tab
    const inventoryTab = screen.getByText("Inventory");
    fireEvent.click(inventoryTab);

    // Should show placeholder
    expect(screen.getByText("Coming in Phase 3")).toBeDefined();
  });
});
