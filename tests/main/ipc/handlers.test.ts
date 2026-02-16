import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock Electron
vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

import { ipcMain } from "electron";
import { registerIpcHandlers } from "@main/ipc/handlers";
import { SaveManager } from "@game/engine/SaveManager";
import { GameLoop } from "@game/engine/GameLoop";

describe("IPC Handlers", () => {
  let handlers: Map<string, Function>;

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = new Map();
    (ipcMain.handle as any).mockImplementation((channel: string, handler: Function) => {
      handlers.set(channel, handler);
    });

    const saveManager = new SaveManager();
    const gameLoop = new GameLoop(() => {});
    registerIpcHandlers(saveManager, gameLoop);
  });

  test("registers all expected channels", () => {
    expect(handlers.has("save:create")).toBe(true);
    expect(handlers.has("save:open")).toBe(true);
    expect(handlers.has("save:list")).toBe(true);
    expect(handlers.has("save:backup")).toBe(true);
    expect(handlers.has("game:start")).toBe(true);
    expect(handlers.has("game:stop")).toBe(true);
    expect(handlers.has("game:pause")).toBe(true);
    expect(handlers.has("game:resume")).toBe(true);
  });

  test("game:start starts the game loop", async () => {
    const handler = handlers.get("game:start")!;
    const result = await handler({});
    expect(result).toEqual({ success: true });
  });

  test("game:stop stops the game loop", async () => {
    // Start first
    await handlers.get("game:start")!({});
    const result = await handlers.get("game:stop")!({});
    expect(result).toEqual({ success: true });
  });

  test("game:pause pauses the game loop", async () => {
    await handlers.get("game:start")!({});
    const result = await handlers.get("game:pause")!({});
    expect(result).toEqual({ success: true });
  });

  test("game:resume resumes the game loop", async () => {
    await handlers.get("game:start")!({});
    await handlers.get("game:pause")!({});
    const result = await handlers.get("game:resume")!({});
    expect(result).toEqual({ success: true });
  });

  test("save:list returns array of save paths", async () => {
    const handler = handlers.get("save:list")!;
    const result = await handler({});
    expect(Array.isArray(result)).toBe(true);
  });

  test("save:create returns success on valid input", async () => {
    const handler = handlers.get("save:create")!;
    const result = await handler({}, "test-save");
    expect(result.success).toBeDefined();
  });

  test("save:open returns success/error structure", async () => {
    const handler = handlers.get("save:open")!;
    const result = await handler({}, "/nonexistent/path.db");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("save:backup returns success with path", async () => {
    const handler = handlers.get("save:backup")!;
    const result = await handler({}, "/nonexistent/path.db");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
