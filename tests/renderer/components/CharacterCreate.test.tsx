// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useGameStore } from "@renderer/stores/gameStore";

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
        character: {
          create: vi.fn(),
          list: vi.fn(),
          setActivity: vi.fn(),
          equipItem: vi.fn(),
        },
      },
    },
    writable: true,
  });
});

// Lazy import so the module loads after window.api is mocked
let CharacterCreate: React.ComponentType;

beforeAll(async () => {
  const mod = await import("@renderer/components/CharacterCreate");
  CharacterCreate = mod.CharacterCreate;
});

describe("CharacterCreate", () => {
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

  it("renders name input", () => {
    render(<CharacterCreate />);
    const input = screen.getByTestId("input-name");
    expect(input).toBeDefined();
    expect(input.getAttribute("placeholder")).toContain("2-16 characters");
  });

  it("shows validation error for short name", () => {
    render(<CharacterCreate />);
    const input = screen.getByTestId("input-name") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "A" } });

    expect(screen.getByText(/Name must be 2-16 characters long/i)).toBeDefined();
  });

  it("race cards show all 6 races", () => {
    render(<CharacterCreate />);

    const expectedRaces = ["human", "dwarf", "elf", "orc", "undead", "troll"];
    for (const race of expectedRaces) {
      expect(screen.getByTestId(`race-${race}`)).toBeDefined();
    }
  });

  it("selecting race updates UI", () => {
    render(<CharacterCreate />);

    const humanCard = screen.getByTestId("race-human");
    fireEvent.click(humanCard);

    // Check that the card has the selected styling (amber border)
    expect(humanCard.className).toContain("border-amber-500");
  });

  it("class cards show all 8 classes", () => {
    render(<CharacterCreate />);

    const expectedClasses = [
      "warrior",
      "mage",
      "cleric",
      "rogue",
      "ranger",
      "druid",
      "necromancer",
      "shaman",
    ];
    for (const cls of expectedClasses) {
      expect(screen.getByTestId(`class-${cls}`)).toBeDefined();
    }
  });

  it("selecting class updates UI", () => {
    render(<CharacterCreate />);

    const warriorCard = screen.getByTestId("class-warrior");
    fireEvent.click(warriorCard);

    // Check that the card has the selected styling (amber border)
    expect(warriorCard.className).toContain("border-amber-500");
  });

  it("create button disabled until all fields valid", () => {
    render(<CharacterCreate />);

    const createBtn = screen.getByTestId("btn-create") as HTMLButtonElement;

    // Initially disabled
    expect(createBtn.disabled).toBe(true);

    // Fill in name
    const nameInput = screen.getByTestId("input-name") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "TestHero" } });

    // Still disabled (need race and class)
    expect(createBtn.disabled).toBe(true);

    // Select race
    fireEvent.click(screen.getByTestId("race-human"));

    // Still disabled (need class)
    expect(createBtn.disabled).toBe(true);

    // Select class
    fireEvent.click(screen.getByTestId("class-warrior"));

    // Now enabled
    expect(createBtn.disabled).toBe(false);
  });

  it("successful creation calls store action", async () => {
    const mockCreate = vi.fn().mockResolvedValue(undefined);

    useGameStore.setState({
      characters: [],
      activeCharacterId: null,
      combatEvents: [],
      zoneState: null,
      questProgress: [],
      welcomeBack: null,
      isLoading: false,
    });

    // Spy on the store's createCharacter method
    const createCharacterSpy = vi
      .spyOn(useGameStore.getState(), "createCharacter")
      .mockImplementation(mockCreate);

    render(<CharacterCreate />);

    // Fill in all fields
    const nameInput = screen.getByTestId("input-name") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "TestHero" } });
    fireEvent.click(screen.getByTestId("race-human"));
    fireEvent.click(screen.getByTestId("class-warrior"));

    // Click create
    const createBtn = screen.getByTestId("btn-create");
    fireEvent.click(createBtn);

    // Wait for async operation
    await vi.waitFor(() => {
      expect(createCharacterSpy).toHaveBeenCalledWith("TestHero", "human", "warrior");
    });

    createCharacterSpy.mockRestore();
  });

  it("displays preview panel when race and class selected", () => {
    render(<CharacterCreate />);

    // Initially no preview
    expect(screen.queryByText("Preview")).toBeNull();

    // Select race and class
    fireEvent.click(screen.getByTestId("race-elf"));
    fireEvent.click(screen.getByTestId("class-mage"));

    // Preview should now appear
    expect(screen.getByText("Preview")).toBeDefined();
    // Check that both Elf and Mage appear (will be multiple instances)
    expect(screen.getAllByText("Elf").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mage").length).toBeGreaterThan(0);
  });

  it("preview shows starting stats", () => {
    render(<CharacterCreate />);

    // Select race and class
    fireEvent.click(screen.getByTestId("race-dwarf"));
    fireEvent.click(screen.getByTestId("class-warrior"));

    // Check that stat labels are present
    expect(screen.getByText("Strength")).toBeDefined();
    expect(screen.getByText("Agility")).toBeDefined();
    expect(screen.getByText("Intellect")).toBeDefined();
    expect(screen.getByText("Stamina")).toBeDefined();
    expect(screen.getByText("Spirit")).toBeDefined();
  });

  it("name input enforces 16 character max", () => {
    render(<CharacterCreate />);

    const input = screen.getByTestId("input-name") as HTMLInputElement;
    expect(input.getAttribute("maxLength")).toBe("16");
  });

  it("shows resource type in preview", () => {
    render(<CharacterCreate />);

    // Select race and class
    fireEvent.click(screen.getByTestId("race-human"));
    fireEvent.click(screen.getByTestId("class-warrior"));

    // Check resource type is shown (Warrior uses Rage)
    const resourceElements = screen.getAllByText("rage");
    expect(resourceElements.length).toBeGreaterThan(0);
  });

  it("shows class description in class card", () => {
    render(<CharacterCreate />);

    // Mage card should contain part of its description
    const mageCard = screen.getByTestId("class-mage");
    expect(mageCard.textContent).toContain("arcane");
  });

  it("shows race lore in race card", () => {
    render(<CharacterCreate />);

    // Human card should contain part of its lore
    const humanCard = screen.getByTestId("race-human");
    expect(humanCard.textContent).toContain("Adaptable");
  });

  it("create button shows loading state", () => {
    useGameStore.setState({
      characters: [],
      activeCharacterId: null,
      combatEvents: [],
      zoneState: null,
      questProgress: [],
      welcomeBack: null,
      isLoading: true,
    });

    render(<CharacterCreate />);

    const createBtn = screen.getByTestId("btn-create");
    expect(createBtn.textContent).toBe("Creating...");
    expect((createBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
