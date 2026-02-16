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
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      activeTab: "character",
      selectedCharacterId: null,
      isMenuOpen: false,
      modal: null,
      sidebarWidth: 300,
      combatLogVisible: true,
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
});
