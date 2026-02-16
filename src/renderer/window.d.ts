// src/renderer/window.d.ts
import type { GameAPI } from "@main/preload";

declare global {
  interface Window {
    api: GameAPI;
  }
}

export {};
