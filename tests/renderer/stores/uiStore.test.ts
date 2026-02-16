import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@renderer/stores/uiStore";

describe("uiStore", () => {
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

  describe("initial state", () => {
    it("should have correct default values", () => {
      const state = useUIStore.getState();
      expect(state.activeTab).toBe("character");
      expect(state.selectedCharacterId).toBeNull();
      expect(state.isMenuOpen).toBe(false);
      expect(state.modal).toBeNull();
      expect(state.sidebarWidth).toBe(300);
      expect(state.combatLogVisible).toBe(true);
    });
  });

  describe("setActiveTab", () => {
    it("should change active tab", () => {
      const { setActiveTab } = useUIStore.getState();
      setActiveTab("inventory");
      expect(useUIStore.getState().activeTab).toBe("inventory");
    });

    it("should accept all valid tab types", () => {
      const { setActiveTab } = useUIStore.getState();
      const validTabs = [
        "character",
        "inventory",
        "talents",
        "quests",
        "combat_log",
        "world_map",
        "professions",
        "achievements",
        "settings",
      ] as const;

      validTabs.forEach((tab) => {
        setActiveTab(tab);
        expect(useUIStore.getState().activeTab).toBe(tab);
      });
    });
  });

  describe("selectCharacter", () => {
    it("should set character id", () => {
      const { selectCharacter } = useUIStore.getState();
      selectCharacter(42);
      expect(useUIStore.getState().selectedCharacterId).toBe(42);
    });

    it("should accept null to deselect", () => {
      const { selectCharacter } = useUIStore.getState();
      selectCharacter(42);
      selectCharacter(null);
      expect(useUIStore.getState().selectedCharacterId).toBeNull();
    });
  });

  describe("toggleMenu", () => {
    it("should toggle menu from false to true", () => {
      const { toggleMenu } = useUIStore.getState();
      expect(useUIStore.getState().isMenuOpen).toBe(false);
      toggleMenu();
      expect(useUIStore.getState().isMenuOpen).toBe(true);
    });

    it("should toggle menu from true to false", () => {
      useUIStore.setState({ isMenuOpen: true });
      const { toggleMenu } = useUIStore.getState();
      toggleMenu();
      expect(useUIStore.getState().isMenuOpen).toBe(false);
    });
  });

  describe("modal management", () => {
    it("should open modal with type only", () => {
      const { openModal } = useUIStore.getState();
      openModal("character_create");
      const { modal } = useUIStore.getState();
      expect(modal).toEqual({ type: "character_create", data: undefined });
    });

    it("should open modal with type and data", () => {
      const { openModal } = useUIStore.getState();
      const modalData = { itemId: 123, quantity: 5 };
      openModal("item_details", modalData);
      const { modal } = useUIStore.getState();
      expect(modal).toEqual({ type: "item_details", data: modalData });
    });

    it("should close modal", () => {
      const { openModal, closeModal } = useUIStore.getState();
      openModal("test_modal", { foo: "bar" });
      closeModal();
      expect(useUIStore.getState().modal).toBeNull();
    });
  });

  describe("setSidebarWidth", () => {
    it("should set sidebar width within valid range", () => {
      const { setSidebarWidth } = useUIStore.getState();
      setSidebarWidth(400);
      expect(useUIStore.getState().sidebarWidth).toBe(400);
    });

    it("should clamp width to minimum 200", () => {
      const { setSidebarWidth } = useUIStore.getState();
      setSidebarWidth(150);
      expect(useUIStore.getState().sidebarWidth).toBe(200);
    });

    it("should clamp width to maximum 600", () => {
      const { setSidebarWidth } = useUIStore.getState();
      setSidebarWidth(700);
      expect(useUIStore.getState().sidebarWidth).toBe(600);
    });

    it("should allow exactly 200", () => {
      const { setSidebarWidth } = useUIStore.getState();
      setSidebarWidth(200);
      expect(useUIStore.getState().sidebarWidth).toBe(200);
    });

    it("should allow exactly 600", () => {
      const { setSidebarWidth } = useUIStore.getState();
      setSidebarWidth(600);
      expect(useUIStore.getState().sidebarWidth).toBe(600);
    });
  });

  describe("toggleCombatLog", () => {
    it("should toggle combat log from true to false", () => {
      const { toggleCombatLog } = useUIStore.getState();
      expect(useUIStore.getState().combatLogVisible).toBe(true);
      toggleCombatLog();
      expect(useUIStore.getState().combatLogVisible).toBe(false);
    });

    it("should toggle combat log from false to true", () => {
      useUIStore.setState({ combatLogVisible: false });
      const { toggleCombatLog } = useUIStore.getState();
      toggleCombatLog();
      expect(useUIStore.getState().combatLogVisible).toBe(true);
    });
  });
});
