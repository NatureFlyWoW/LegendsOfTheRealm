import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { loadWindowState, saveWindowState, type WindowState } from "@main/window";
import { existsSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("Window State Persistence", () => {
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `window-state-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    configPath = join(testDir, "window-state.json");
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("loadWindowState returns defaults when file doesn't exist", () => {
    const state = loadWindowState(configPath);
    expect(state).toEqual({
      width: 1280,
      height: 720,
      isMaximized: false,
    });
  });

  test("loadWindowState reads from file", () => {
    const savedState: WindowState = {
      width: 1600,
      height: 900,
      x: 100,
      y: 200,
      isMaximized: false,
    };
    saveWindowState(configPath, savedState);

    const loaded = loadWindowState(configPath);
    expect(loaded).toEqual(savedState);
  });

  test("saveWindowState creates file and directories", () => {
    const nestedPath = join(testDir, "nested", "deep", "window-state.json");
    const state: WindowState = {
      width: 1920,
      height: 1080,
      isMaximized: true,
    };

    saveWindowState(nestedPath, state);
    expect(existsSync(nestedPath)).toBe(true);

    const loaded = loadWindowState(nestedPath);
    expect(loaded).toEqual(state);
  });

  test("round-trip: save → load → matches", () => {
    const state: WindowState = {
      width: 800,
      height: 600,
      x: 50,
      y: 100,
      isMaximized: false,
    };

    saveWindowState(configPath, state);
    const loaded = loadWindowState(configPath);
    expect(loaded).toEqual(state);
  });

  test("corrupt file returns defaults", () => {
    // Write invalid JSON
    mkdirSync(join(configPath, ".."), { recursive: true });
    require("fs").writeFileSync(configPath, "{ invalid json }");

    const state = loadWindowState(configPath);
    expect(state).toEqual({
      width: 1280,
      height: 720,
      isMaximized: false,
    });
  });

  test("partial state merges with defaults", () => {
    // Save a partial state (missing x, y)
    const partial = {
      width: 1024,
      height: 768,
      isMaximized: true,
    };
    require("fs").writeFileSync(configPath, JSON.stringify(partial));

    const loaded = loadWindowState(configPath);
    expect(loaded).toEqual({
      width: 1024,
      height: 768,
      isMaximized: true,
    });
  });
});
