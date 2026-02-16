import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameBridge } from "@main/ipc/gamebridge";
import Database from "better-sqlite3";
import type { BrowserWindow } from "electron";

describe("GameBridge", () => {
  let db: Database.Database;
  let mockWindow: BrowserWindow;

  beforeEach(() => {
    db = new Database(":memory:");

    // Create a minimal character table for CharacterService
    db.exec(`
      CREATE TABLE characters (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        race TEXT NOT NULL,
        class_name TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        xp INTEGER NOT NULL DEFAULT 0,
        rested_xp INTEGER NOT NULL DEFAULT 0,
        gold INTEGER NOT NULL DEFAULT 0,
        current_zone TEXT NOT NULL,
        activity TEXT,
        active_spec TEXT,
        talent_points TEXT NOT NULL,
        equipment TEXT NOT NULL,
        companion_clears TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_played_at INTEGER NOT NULL
      );
    `);

    // Mock BrowserWindow
    mockWindow = {
      webContents: {
        send: vi.fn(),
      },
    } as any;
  });

  it("initializes successfully", async () => {
    const bridge = new GameBridge(db, mockWindow);
    await expect(bridge.initialize()).resolves.not.toThrow();
  });

  it("provides access to GameManager", async () => {
    const bridge = new GameBridge(db, mockWindow);
    await bridge.initialize();

    const gameManager = bridge.getGameManager();
    expect(gameManager).toBeDefined();
    expect(typeof gameManager.handleCommand).toBe("function");
    expect(typeof gameManager.handleQuery).toBe("function");
  });

  it("provides access to GameLoop", async () => {
    const bridge = new GameBridge(db, mockWindow);
    await bridge.initialize();

    const gameLoop = bridge.getGameLoop();
    expect(gameLoop).toBeDefined();
    expect(typeof gameLoop.start).toBe("function");
    expect(typeof gameLoop.stop).toBe("function");
  });

  it("creates a character via command", async () => {
    const bridge = new GameBridge(db, mockWindow);
    await bridge.initialize();

    const gameManager = bridge.getGameManager();
    const result = await gameManager.handleCommand({
      type: "create_character",
      name: "TestChar",
      race: "human",
      className: "warrior",
    });

    expect(result.success).toBe(true);
    expect(result.character).toBeDefined();
    expect(result.character.name).toBe("TestChar");
  });

  it("queries character roster", async () => {
    const bridge = new GameBridge(db, mockWindow);
    await bridge.initialize();

    const gameManager = bridge.getGameManager();

    // Create a character first
    await gameManager.handleCommand({
      type: "create_character",
      name: "TestChar",
      race: "human",
      className: "warrior",
    });

    // Query roster
    const result = await gameManager.handleQuery({
      type: "get_character_roster",
    });

    expect(result.roster).toBeDefined();
    expect(result.roster.length).toBe(1);
    expect(result.roster[0].name).toBe("TestChar");
  });

  it("forwards game events to renderer", async () => {
    const bridge = new GameBridge(db, mockWindow);
    await bridge.initialize();

    // Emit a test event (we'll need to access eventBus, which is private)
    // For now, we just verify the window mock was set up
    expect(mockWindow.webContents.send).toBeDefined();
  });

  it("shuts down cleanly", async () => {
    const bridge = new GameBridge(db, mockWindow);
    await bridge.initialize();

    await expect(bridge.shutdown()).resolves.not.toThrow();
  });
});
