import { create } from "zustand";

export interface SettingsState {
  fontSize: number;
  fontFamily: string;
  showFPS: boolean;
  autoSaveIntervalSeconds: number;
  combatLogMaxLines: number;
  tooltipDelay: number;
  masterVolume: number;

  // Actions
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  toggleShowFPS: () => void;
  setAutoSaveInterval: (seconds: number) => void;
  setCombatLogMaxLines: (lines: number) => void;
  setTooltipDelay: (ms: number) => void;
  setMasterVolume: (volume: number) => void;
  resetToDefaults: () => void;
}

const DEFAULTS = {
  fontSize: 16,
  fontFamily: "Px437 IBM VGA8",
  showFPS: false,
  autoSaveIntervalSeconds: 60,
  combatLogMaxLines: 500,
  tooltipDelay: 300,
  masterVolume: 0.8,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULTS,

  setFontSize: (size) => set({ fontSize: Math.max(8, Math.min(32, size)) }),
  setFontFamily: (family) => set({ fontFamily: family }),
  toggleShowFPS: () => set((s) => ({ showFPS: !s.showFPS })),
  setAutoSaveInterval: (seconds) =>
    set({ autoSaveIntervalSeconds: Math.max(10, seconds) }),
  setCombatLogMaxLines: (lines) =>
    set({ combatLogMaxLines: Math.max(100, Math.min(2000, lines)) }),
  setTooltipDelay: (ms) => set({ tooltipDelay: Math.max(0, Math.min(1000, ms)) }),
  setMasterVolume: (volume) =>
    set({ masterVolume: Math.max(0, Math.min(1, volume)) }),
  resetToDefaults: () => set(DEFAULTS),
}));
