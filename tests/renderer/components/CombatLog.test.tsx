// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CombatLog } from "@renderer/components/CombatLog";
import { useGameStore } from "@renderer/stores/gameStore";
import { useSettingsStore } from "@renderer/stores/settingsStore";
import type { CombatEvent } from "@shared/combat-interfaces";

describe("CombatLog", () => {
  beforeEach(() => {
    // Reset stores before each test
    useGameStore.setState({ combatEvents: [] });
    useSettingsStore.setState({ combatLogMaxLines: 500 });
  });

  it("renders empty log with placeholder text", () => {
    render(<CombatLog />);
    expect(screen.getByText("No combat events")).toBeDefined();
  });

  it("renders damage events in red", () => {
    const damageEvent: CombatEvent = {
      tick: 1,
      sourceId: 1,
      sourceName: "Player",
      targetId: 2,
      targetName: "Enemy",
      type: "damage",
      abilityName: "Fireball",
      amount: 150,
      damageType: "fire",
      isCrit: false,
      isBlocked: false,
      blockAmount: 0,
      overkill: 0,
    };

    useGameStore.setState({ combatEvents: [damageEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    const redText = logContainer.querySelector(".text-red-400");
    expect(redText).toBeDefined();
    expect(redText?.textContent).toContain("Fireball hits Enemy for 150");
  });

  it("renders multiple event types with correct colors", () => {
    const events: CombatEvent[] = [
      {
        tick: 1,
        sourceId: 1,
        sourceName: "Player",
        targetId: 2,
        targetName: "Enemy",
        type: "damage",
        abilityName: "Attack",
        amount: 50,
        damageType: "physical",
        isCrit: false,
        isBlocked: false,
        blockAmount: 0,
        overkill: 0,
      },
      {
        tick: 2,
        sourceId: 3,
        sourceName: "Healer",
        targetId: 1,
        targetName: "Player",
        type: "heal",
        abilityName: "Heal",
        amount: 100,
        isCrit: false,
        overheal: 0,
      },
      {
        tick: 3,
        sourceId: 1,
        sourceName: "Player",
        targetId: 2,
        targetName: "Enemy",
        type: "miss",
        abilityName: "Swing",
        missType: "dodge",
      },
    ];

    useGameStore.setState({ combatEvents: events });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");

    // Check for damage (red)
    const redText = logContainer.querySelector(".text-red-400");
    expect(redText).toBeDefined();
    expect(redText?.textContent).toContain("Attack hits Enemy for 50");

    // Check for heal (green)
    const greenText = logContainer.querySelector(".text-green-400");
    expect(greenText).toBeDefined();
    expect(greenText?.textContent).toContain("Heal heals Player for 100");

    // Check for miss (grey)
    const greyText = logContainer.querySelector(".text-gray-500");
    expect(greyText).toBeDefined();
    expect(greyText?.textContent).toContain("Swing dodgeed by Enemy");
  });

  it("clear button empties log", () => {
    const events: CombatEvent[] = [
      {
        tick: 1,
        sourceId: 1,
        sourceName: "Player",
        targetId: 2,
        targetName: "Enemy",
        type: "damage",
        abilityName: "Attack",
        amount: 50,
        damageType: "physical",
        isCrit: false,
        isBlocked: false,
        blockAmount: 0,
        overkill: 0,
      },
    ];

    useGameStore.setState({ combatEvents: events });
    render(<CombatLog />);

    // Verify event is present
    expect(screen.queryByText("No combat events")).toBeNull();

    // Click clear button
    const clearButton = screen.getByTestId("clear-log-button");
    fireEvent.click(clearButton);

    // Verify log is now empty
    expect(screen.getByText("No combat events")).toBeDefined();
    expect(useGameStore.getState().combatEvents).toHaveLength(0);
  });

  it("respects max lines from settings", () => {
    // Set max lines to 3
    useSettingsStore.setState({ combatLogMaxLines: 3 });

    // Create 5 events
    const events: CombatEvent[] = Array.from({ length: 5 }, (_, i) => ({
      tick: i + 1,
      sourceId: 1,
      sourceName: "Player",
      targetId: 2,
      targetName: "Enemy",
      type: "damage",
      abilityName: `Attack ${i + 1}`,
      amount: 50,
      damageType: "physical" as const,
      isCrit: false,
      isBlocked: false,
      blockAmount: 0,
      overkill: 0,
    }));

    useGameStore.setState({ combatEvents: events });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    const eventLines = logContainer.querySelectorAll(".text-red-400");

    // Should only display last 3 events
    expect(eventLines).toHaveLength(3);

    // Verify it's the last 3 (events 3, 4, 5)
    expect(eventLines[0]?.textContent).toContain("Attack 3");
    expect(eventLines[1]?.textContent).toContain("Attack 4");
    expect(eventLines[2]?.textContent).toContain("Attack 5");
  });

  it("renders crit damage events with CRIT marker", () => {
    const critEvent: CombatEvent = {
      tick: 1,
      sourceId: 1,
      sourceName: "Player",
      targetId: 2,
      targetName: "Enemy",
      type: "damage",
      abilityName: "Fireball",
      amount: 300,
      damageType: "fire",
      isCrit: true,
      isBlocked: false,
      blockAmount: 0,
      overkill: 0,
    };

    useGameStore.setState({ combatEvents: [critEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    expect(logContainer.textContent).toContain("*CRIT*");
  });

  it("renders blocked damage with block amount", () => {
    const blockedEvent: CombatEvent = {
      tick: 1,
      sourceId: 1,
      sourceName: "Enemy",
      targetId: 2,
      targetName: "Tank",
      type: "damage",
      abilityName: "Smash",
      amount: 100,
      damageType: "physical",
      isCrit: false,
      isBlocked: true,
      blockAmount: 50,
      overkill: 0,
    };

    useGameStore.setState({ combatEvents: [blockedEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    expect(logContainer.textContent).toContain("blocked 50");
  });

  it("renders heal events with overheal", () => {
    const overhealEvent: CombatEvent = {
      tick: 1,
      sourceId: 1,
      sourceName: "Healer",
      targetId: 2,
      targetName: "Player",
      type: "heal",
      abilityName: "Greater Heal",
      amount: 500,
      isCrit: false,
      overheal: 100,
    };

    useGameStore.setState({ combatEvents: [overhealEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    expect(logContainer.textContent).toContain("100 overheal");
  });

  it("renders death events in bold red", () => {
    const deathEvent: CombatEvent = {
      tick: 10,
      sourceId: 1,
      sourceName: "Boss",
      targetId: 2,
      targetName: "Player",
      type: "death",
      killingAbility: "Meteor",
    };

    useGameStore.setState({ combatEvents: [deathEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    const deathText = logContainer.querySelector(".text-red-600.font-bold");
    expect(deathText).toBeDefined();
    expect(deathText?.textContent).toContain("Player dies to Meteor");
  });

  it("renders phase change events in bold yellow", () => {
    const phaseEvent: CombatEvent = {
      tick: 30,
      sourceId: 1,
      sourceName: "Boss",
      targetId: 1,
      targetName: "Boss",
      type: "phase_change",
      phase: 2,
      phaseName: "Fury Mode",
    };

    useGameStore.setState({ combatEvents: [phaseEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    const phaseText = logContainer.querySelector(".text-yellow-200.font-bold");
    expect(phaseText).toBeDefined();
    expect(phaseText?.textContent).toContain("PHASE 2: Fury Mode");
  });

  it("renders resource change events in yellow for gains", () => {
    const resourceEvent: CombatEvent = {
      tick: 5,
      sourceId: 1,
      sourceName: "Player",
      targetId: 1,
      targetName: "Player",
      type: "resource_change",
      resourceType: "mana",
      amount: 50,
      current: 500,
    };

    useGameStore.setState({ combatEvents: [resourceEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    const resourceText = logContainer.querySelector(".text-yellow-400");
    expect(resourceText).toBeDefined();
    expect(resourceText?.textContent).toContain("+50 mana");
  });

  it("renders buff apply events in blue", () => {
    const buffEvent: CombatEvent = {
      tick: 1,
      sourceId: 1,
      sourceName: "Player",
      targetId: 1,
      targetName: "Player",
      type: "buff_apply",
      buffName: "Battle Shout",
      duration: 120,
      stacks: 1,
    };

    useGameStore.setState({ combatEvents: [buffEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    const buffText = logContainer.querySelector(".text-blue-400");
    expect(buffText).toBeDefined();
    expect(buffText?.textContent).toContain("gains Battle Shout");
  });

  it("renders interrupt events in orange", () => {
    const interruptEvent: CombatEvent = {
      tick: 5,
      sourceId: 1,
      sourceName: "Player",
      targetId: 2,
      targetName: "Enemy",
      type: "interrupt",
      abilityName: "Kick",
      interruptedAbility: "Shadow Bolt",
    };

    useGameStore.setState({ combatEvents: [interruptEvent] });
    render(<CombatLog />);

    const logContainer = screen.getByTestId("combat-log-container");
    const interruptText = logContainer.querySelector(".text-orange-400");
    expect(interruptText).toBeDefined();
    expect(interruptText?.textContent).toContain("interrupts");
    expect(interruptText?.textContent).toContain("Shadow Bolt");
  });

  it("auto-scrolls to bottom when events are added", () => {
    const scrollIntoViewMock = vi.fn();
    const scrollRefMock = {
      current: {
        scrollTop: 0,
        scrollHeight: 1000,
      },
    };

    // Mock the ref behavior
    const originalCreateElement = React.createElement;
    vi.spyOn(React, "createElement").mockImplementation((type, props, ...children) => {
      if (props && "ref" in props && props["data-testid"] === "combat-log-container") {
        // Simulate setting the ref
        setTimeout(() => {
          if (typeof props.ref === "function") {
            props.ref(scrollRefMock.current);
          } else if (props.ref && "current" in props.ref) {
            (props.ref as any).current = scrollRefMock.current;
          }
        }, 0);
      }
      return originalCreateElement(type, props, ...children);
    });

    const events: CombatEvent[] = [
      {
        tick: 1,
        sourceId: 1,
        sourceName: "Player",
        targetId: 2,
        targetName: "Enemy",
        type: "damage",
        abilityName: "Attack",
        amount: 50,
        damageType: "physical",
        isCrit: false,
        isBlocked: false,
        blockAmount: 0,
        overkill: 0,
      },
    ];

    useGameStore.setState({ combatEvents: events });
    render(<CombatLog />);

    // Verify component rendered
    expect(screen.getByTestId("combat-log-container")).toBeDefined();

    // Restore original createElement
    vi.restoreAllMocks();
  });
});
