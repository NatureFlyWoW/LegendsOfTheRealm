import { create } from "zustand";

export type ActiveTab =
  | "character"
  | "inventory"
  | "talents"
  | "quests"
  | "combat_log"
  | "world_map"
  | "professions"
  | "achievements"
  | "settings";

export interface ModalState {
  type: string;
  data?: unknown;
}

export interface UIState {
  activeTab: ActiveTab;
  selectedCharacterId: number | null;
  isMenuOpen: boolean;
  modal: ModalState | null;
  sidebarWidth: number;
  combatLogVisible: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  selectCharacter: (id: number | null) => void;
  toggleMenu: () => void;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
  setSidebarWidth: (width: number) => void;
  toggleCombatLog: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "character",
  selectedCharacterId: null,
  isMenuOpen: false,
  modal: null,
  sidebarWidth: 300,
  combatLogVisible: true,

  setActiveTab: (tab) => set({ activeTab: tab }),
  selectCharacter: (id) => set({ selectedCharacterId: id }),
  toggleMenu: () => set((s) => ({ isMenuOpen: !s.isMenuOpen })),
  openModal: (type, data) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: null }),
  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.max(200, Math.min(600, width)) }),
  toggleCombatLog: () => set((s) => ({ combatLogVisible: !s.combatLogVisible })),
}));
