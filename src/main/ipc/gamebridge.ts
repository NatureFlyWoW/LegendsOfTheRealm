// src/main/ipc/gamebridge.ts
import type Database from "better-sqlite3";
import { GameManager } from "@game/engine/GameManager";
import { EventBus } from "@game/engine/EventBus";
import { GameLoop } from "@game/engine/GameLoop";
import type { BrowserWindow } from "electron";

/**
 * GameBridge manages the lifecycle of the GameManager, EventBus, and GameLoop.
 * This is the central hub that connects the IPC layer to the game engine.
 */
export class GameBridge {
  private gameManager: GameManager;
  private eventBus: EventBus;
  private gameLoop: GameLoop;
  private window: BrowserWindow;

  constructor(db: Database.Database, window: BrowserWindow) {
    this.window = window;
    this.eventBus = new EventBus();
    this.gameManager = new GameManager(db, this.eventBus);
    this.gameLoop = new GameLoop((tick) => this.onTick(tick));

    // Forward game events to renderer
    this.eventBus.onAny((event) => {
      this.window.webContents.send("game:event", event);
    });
  }

  /**
   * Initialize the game manager (load character roster, etc.)
   */
  async initialize(): Promise<void> {
    await this.gameManager.initialize();
  }

  /**
   * Get the GameManager instance for command/query handling.
   */
  getGameManager(): GameManager {
    return this.gameManager;
  }

  /**
   * Get the GameLoop instance for start/stop/pause/resume.
   */
  getGameLoop(): GameLoop {
    return this.gameLoop;
  }

  /**
   * Called by the game loop on each tick.
   */
  private onTick(tickNumber: number): void {
    this.gameManager.onTick(tickNumber);

    // Forward combat events from last tick to renderer
    const lastResult = this.gameManager.getLastTickResult();
    if (lastResult && lastResult.events.length > 0) {
      this.window.webContents.send("game:combat-events", lastResult.events);
    }

    // Send tick number to renderer
    this.window.webContents.send("game:tick", tickNumber);
  }

  /**
   * Cleanup resources on shutdown.
   */
  async shutdown(): Promise<void> {
    this.gameLoop.stop();
    await this.gameManager.forceSave();
    this.eventBus.clear();
  }
}
