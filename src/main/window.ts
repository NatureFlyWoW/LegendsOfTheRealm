import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
}

const DEFAULT_STATE: WindowState = {
  width: 1280,
  height: 720,
  isMaximized: false,
};

export function loadWindowState(configPath: string): WindowState {
  try {
    if (existsSync(configPath)) {
      const data = JSON.parse(readFileSync(configPath, "utf-8"));
      return { ...DEFAULT_STATE, ...data };
    }
  } catch {
    /* ignore corrupt config */
  }
  return { ...DEFAULT_STATE };
}

export function saveWindowState(configPath: string, state: WindowState): void {
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(state, null, 2));
}
