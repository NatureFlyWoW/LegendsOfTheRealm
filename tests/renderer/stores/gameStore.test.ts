import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "@renderer/stores/gameStore";
import type { CharacterState } from "@shared/types";
import type { CombatEvent } from "@shared/combat-interfaces";
import { ClassName, RaceName, ActivityType } from "@shared/enums";

// ============================================================
// Mock window.api
// ============================================================

const mockApi = {
  character: {
    list: vi.fn(),
    create: vi.fn(),
    setActivity: vi.fn(),
    equipItem: vi.fn(),
    unequipItem: vi.fn(),
  },
  sendCommand: vi.fn().mockResolvedValue({ success: true }),
};

// @ts-expect-error: Mocking window.api
global.window = {
  api: mockApi,
};

// ============================================================
// Test Helpers
// ============================================================

const createMockCharacter = (id: number, name: string, level: number = 1): CharacterState => ({
  id,
  name,
  race: RaceName.Human,
  className: ClassName.Warrior,
  level,
  xp: 0,
  restedXp: 0,
  gold: 100,
  currentZone: "zone_elwynn" as any,
  activity: ActivityType.Idle,
  activeSpec: "protection",
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
  stats: {
    strength: 20,
    agility: 15,
    intellect: 10,
    stamina: 25,
    spirit: 12,
    maxHp: 250,
    maxMana: 100,
    attackPower: 40,
    spellPower: 0,
    armor: 50,
    critChance: 5,
    hitChance: 95,
    hastePercent: 0,
    dodgeChance: 5,
    parryChance: 5,
    blockChance: 10,
    blockValue: 20,
    defenseSkill: 1,
    resilience: 0,
    mp5: 10,
    weaponDamageMin: 8,
    weaponDamageMax: 15,
    weaponSpeed: 2.0,
  },
  bags: [],
  companionClears: {},
  createdAt: Date.now(),
  lastPlayedAt: Date.now(),
});

const createMockCombatEvent = (tick: number, type: string = "damage"): CombatEvent => ({
  tick,
  sourceId: 1,
  sourceName: "Player",
  targetId: 2,
  targetName: "Enemy",
  type: type as any,
  abilityName: "Attack",
  amount: 50,
  damageType: "physical" as any,
  isCrit: false,
  isBlocked: false,
  blockAmount: 0,
  overkill: 0,
});

// ============================================================
// Tests
// ============================================================

describe("gameStore", () => {
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

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct default values", () => {
      const state = useGameStore.getState();
      expect(state.characters).toEqual([]);
      expect(state.activeCharacterId).toBeNull();
      expect(state.combatEvents).toEqual([]);
      expect(state.zoneState).toBeNull();
      expect(state.questProgress).toEqual([]);
      expect(state.welcomeBack).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("loadRoster", () => {
    it("should load characters from IPC", async () => {
      const mockCharacters = [
        createMockCharacter(1, "Warrior1", 5),
        createMockCharacter(2, "Mage1", 3),
      ];
      mockApi.character.list.mockResolvedValue(mockCharacters);

      const { loadRoster } = useGameStore.getState();
      await loadRoster();

      expect(mockApi.character.list).toHaveBeenCalledOnce();
      const state = useGameStore.getState();
      expect(state.characters).toEqual(mockCharacters);
      expect(state.isLoading).toBe(false);
    });

    it("should set isLoading to true during load", async () => {
      mockApi.character.list.mockImplementation(
        () =>
          new Promise((resolve) => {
            // Check loading state while promise is pending
            const state = useGameStore.getState();
            expect(state.isLoading).toBe(true);
            resolve([]);
          })
      );

      const { loadRoster } = useGameStore.getState();
      await loadRoster();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockApi.character.list.mockRejectedValue(new Error("Network error"));

      const { loadRoster } = useGameStore.getState();
      await loadRoster();

      expect(consoleErrorSpy).toHaveBeenCalled();
      const state = useGameStore.getState();
      expect(state.isLoading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("createCharacter", () => {
    it("should create character and reload roster", async () => {
      const mockCharacter = createMockCharacter(1, "TestWarrior", 1);
      mockApi.character.create.mockResolvedValue({
        success: true,
        characterId: 1,
      });
      mockApi.character.list.mockResolvedValue([mockCharacter]);

      const { createCharacter } = useGameStore.getState();
      await createCharacter("TestWarrior", RaceName.Human, ClassName.Warrior);

      expect(mockApi.character.create).toHaveBeenCalledWith(
        "TestWarrior",
        RaceName.Human,
        ClassName.Warrior
      );
      expect(mockApi.character.list).toHaveBeenCalled();

      const state = useGameStore.getState();
      expect(state.characters).toEqual([mockCharacter]);
      expect(state.activeCharacterId).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it("should not reload roster if creation fails", async () => {
      mockApi.character.create.mockResolvedValue({
        success: false,
        error: "Name already taken",
      });

      const { createCharacter } = useGameStore.getState();
      await createCharacter("Duplicate", RaceName.Orc, ClassName.Mage);

      expect(mockApi.character.list).not.toHaveBeenCalled();
      expect(useGameStore.getState().isLoading).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockApi.character.create.mockRejectedValue(new Error("Database error"));

      const { createCharacter } = useGameStore.getState();
      await createCharacter("Error", RaceName.Elf, ClassName.Rogue);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(useGameStore.getState().isLoading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("selectCharacter", () => {
    it("should set active character ID and notify engine", () => {
      const { selectCharacter } = useGameStore.getState();
      selectCharacter(42);
      expect(useGameStore.getState().activeCharacterId).toBe(42);
      expect(mockApi.sendCommand).toHaveBeenCalledWith({
        type: "select_character",
        characterId: 42,
      });
    });

    it("should allow changing active character", () => {
      const { selectCharacter } = useGameStore.getState();
      selectCharacter(1);
      expect(useGameStore.getState().activeCharacterId).toBe(1);
      selectCharacter(2);
      expect(useGameStore.getState().activeCharacterId).toBe(2);
    });
  });

  describe("startGrinding", () => {
    it("should start grinding in a zone", async () => {
      useGameStore.setState({ activeCharacterId: 1 });
      mockApi.character.setActivity.mockResolvedValue(undefined);

      const { startGrinding } = useGameStore.getState();
      await startGrinding("zone_elwynn");

      expect(mockApi.character.setActivity).toHaveBeenCalledWith(1, "grinding", "zone_elwynn");
      const state = useGameStore.getState();
      expect(state.zoneState).toEqual({
        grinding: true,
        zoneId: "zone_elwynn",
        currentMob: null,
      });
      expect(state.isLoading).toBe(false);
    });

    it("should do nothing if no character is selected", async () => {
      useGameStore.setState({ activeCharacterId: null });

      const { startGrinding } = useGameStore.getState();
      await startGrinding("zone_elwynn");

      expect(mockApi.character.setActivity).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      useGameStore.setState({ activeCharacterId: 1 });
      mockApi.character.setActivity.mockRejectedValue(new Error("Activity error"));

      const { startGrinding } = useGameStore.getState();
      await startGrinding("zone_elwynn");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(useGameStore.getState().isLoading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("stopGrinding", () => {
    it("should stop grinding and clear zone state", async () => {
      useGameStore.setState({
        activeCharacterId: 1,
        zoneState: {
          grinding: true,
          zoneId: "zone_elwynn",
          currentMob: "boar",
        },
      });
      mockApi.character.setActivity.mockResolvedValue(undefined);

      const { stopGrinding } = useGameStore.getState();
      await stopGrinding();

      expect(mockApi.character.setActivity).toHaveBeenCalledWith(1, "idle");
      const state = useGameStore.getState();
      expect(state.zoneState).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it("should do nothing if no character is selected", async () => {
      useGameStore.setState({ activeCharacterId: null });

      const { stopGrinding } = useGameStore.getState();
      await stopGrinding();

      expect(mockApi.character.setActivity).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      useGameStore.setState({ activeCharacterId: 1 });
      mockApi.character.setActivity.mockRejectedValue(new Error("Activity error"));

      const { stopGrinding } = useGameStore.getState();
      await stopGrinding();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(useGameStore.getState().isLoading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("equipItem", () => {
    it("should call IPC to equip item", async () => {
      useGameStore.setState({ activeCharacterId: 1 });
      mockApi.character.equipItem.mockResolvedValue({ success: true });

      const { equipItem } = useGameStore.getState();
      await equipItem(5);

      expect(mockApi.character.equipItem).toHaveBeenCalledWith(1, 5);
      expect(useGameStore.getState().isLoading).toBe(false);
    });

    it("should do nothing if no character is selected", async () => {
      useGameStore.setState({ activeCharacterId: null });

      const { equipItem } = useGameStore.getState();
      await equipItem(5);

      expect(mockApi.character.equipItem).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      useGameStore.setState({ activeCharacterId: 1 });
      mockApi.character.equipItem.mockRejectedValue(new Error("Equip error"));

      const { equipItem } = useGameStore.getState();
      await equipItem(5);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(useGameStore.getState().isLoading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("unequipItem", () => {
    it("should call IPC to unequip item and reload roster", async () => {
      useGameStore.setState({ activeCharacterId: 1 });
      mockApi.character.unequipItem.mockResolvedValue({ success: true });
      mockApi.character.list.mockResolvedValue([]);

      const { unequipItem } = useGameStore.getState();
      await unequipItem("main_hand" as any);

      expect(mockApi.character.unequipItem).toHaveBeenCalledWith(1, "main_hand");
      expect(mockApi.character.list).toHaveBeenCalled();
    });

    it("should do nothing if no character is selected", async () => {
      useGameStore.setState({ activeCharacterId: null });

      const { unequipItem } = useGameStore.getState();
      await unequipItem("main_hand" as any);

      expect(mockApi.character.unequipItem).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      useGameStore.setState({ activeCharacterId: 1 });
      mockApi.character.unequipItem.mockRejectedValue(new Error("Unequip error"));

      const { unequipItem } = useGameStore.getState();
      await unequipItem("main_hand" as any);

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("addCombatEvents", () => {
    it("should add combat events to the log", () => {
      const events: CombatEvent[] = [
        createMockCombatEvent(1),
        createMockCombatEvent(2),
      ];

      const { addCombatEvents } = useGameStore.getState();
      addCombatEvents(events);

      const state = useGameStore.getState();
      expect(state.combatEvents).toEqual(events);
    });

    it("should append to existing events", () => {
      const existingEvents: CombatEvent[] = [createMockCombatEvent(1)];
      const newEvents: CombatEvent[] = [
        createMockCombatEvent(2),
        createMockCombatEvent(3),
      ];

      useGameStore.setState({ combatEvents: existingEvents });

      const { addCombatEvents } = useGameStore.getState();
      addCombatEvents(newEvents);

      const state = useGameStore.getState();
      expect(state.combatEvents).toHaveLength(3);
      expect(state.combatEvents[0]).toEqual(existingEvents[0]);
      expect(state.combatEvents[1]).toEqual(newEvents[0]);
      expect(state.combatEvents[2]).toEqual(newEvents[1]);
    });

    it("should cap combat events at max lines (ring buffer)", () => {
      // Fill buffer to max
      const maxEvents: CombatEvent[] = Array.from({ length: 500 }, (_, i) =>
        createMockCombatEvent(i)
      );
      useGameStore.setState({ combatEvents: maxEvents });

      // Add 10 more events
      const newEvents: CombatEvent[] = Array.from({ length: 10 }, (_, i) =>
        createMockCombatEvent(500 + i)
      );

      const { addCombatEvents } = useGameStore.getState();
      addCombatEvents(newEvents);

      const state = useGameStore.getState();
      expect(state.combatEvents).toHaveLength(500);
      // First 10 should be removed, last 10 should be the new ones
      expect(state.combatEvents[0].tick).toBe(10);
      expect(state.combatEvents[499].tick).toBe(509);
    });

    it("should handle empty array gracefully", () => {
      const { addCombatEvents } = useGameStore.getState();
      addCombatEvents([]);

      const state = useGameStore.getState();
      expect(state.combatEvents).toEqual([]);
    });
  });

  describe("dismissWelcomeBack", () => {
    it("should clear welcome back summary", () => {
      useGameStore.setState({
        welcomeBack: {
          xpGained: 1000,
          goldGained: 50,
          levelsGained: 1,
          mobsKilled: 20,
          elapsedMinutes: 60,
        },
      });

      const { dismissWelcomeBack } = useGameStore.getState();
      dismissWelcomeBack();

      expect(useGameStore.getState().welcomeBack).toBeNull();
    });

    it("should handle null welcome back gracefully", () => {
      useGameStore.setState({ welcomeBack: null });

      const { dismissWelcomeBack } = useGameStore.getState();
      dismissWelcomeBack();

      expect(useGameStore.getState().welcomeBack).toBeNull();
    });
  });
});
