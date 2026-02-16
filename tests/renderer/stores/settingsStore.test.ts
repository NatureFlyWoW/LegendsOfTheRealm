import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@renderer/stores/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    // Reset to defaults before each test
    useSettingsStore.getState().resetToDefaults();
  });

  describe("default values", () => {
    it("should have correct default values", () => {
      const state = useSettingsStore.getState();
      expect(state.fontSize).toBe(16);
      expect(state.fontFamily).toBe("Px437 IBM VGA8");
      expect(state.showFPS).toBe(false);
      expect(state.autoSaveIntervalSeconds).toBe(60);
      expect(state.combatLogMaxLines).toBe(500);
      expect(state.tooltipDelay).toBe(300);
      expect(state.masterVolume).toBe(0.8);
    });
  });

  describe("setFontSize", () => {
    it("should set font size within valid range", () => {
      const { setFontSize } = useSettingsStore.getState();
      setFontSize(20);
      expect(useSettingsStore.getState().fontSize).toBe(20);
    });

    it("should clamp font size to minimum 8", () => {
      const { setFontSize } = useSettingsStore.getState();
      setFontSize(5);
      expect(useSettingsStore.getState().fontSize).toBe(8);
    });

    it("should clamp font size to maximum 32", () => {
      const { setFontSize } = useSettingsStore.getState();
      setFontSize(50);
      expect(useSettingsStore.getState().fontSize).toBe(32);
    });

    it("should allow exactly 8", () => {
      const { setFontSize } = useSettingsStore.getState();
      setFontSize(8);
      expect(useSettingsStore.getState().fontSize).toBe(8);
    });

    it("should allow exactly 32", () => {
      const { setFontSize } = useSettingsStore.getState();
      setFontSize(32);
      expect(useSettingsStore.getState().fontSize).toBe(32);
    });
  });

  describe("setFontFamily", () => {
    it("should set font family", () => {
      const { setFontFamily } = useSettingsStore.getState();
      setFontFamily("Courier New");
      expect(useSettingsStore.getState().fontFamily).toBe("Courier New");
    });

    it("should accept any string value", () => {
      const { setFontFamily } = useSettingsStore.getState();
      const fonts = ["Arial", "Comic Sans MS", "Custom Font"];
      fonts.forEach((font) => {
        setFontFamily(font);
        expect(useSettingsStore.getState().fontFamily).toBe(font);
      });
    });
  });

  describe("toggleShowFPS", () => {
    it("should toggle show FPS from false to true", () => {
      const { toggleShowFPS } = useSettingsStore.getState();
      expect(useSettingsStore.getState().showFPS).toBe(false);
      toggleShowFPS();
      expect(useSettingsStore.getState().showFPS).toBe(true);
    });

    it("should toggle show FPS from true to false", () => {
      useSettingsStore.setState({ showFPS: true });
      const { toggleShowFPS } = useSettingsStore.getState();
      toggleShowFPS();
      expect(useSettingsStore.getState().showFPS).toBe(false);
    });
  });

  describe("setAutoSaveInterval", () => {
    it("should set auto save interval above minimum", () => {
      const { setAutoSaveInterval } = useSettingsStore.getState();
      setAutoSaveInterval(120);
      expect(useSettingsStore.getState().autoSaveIntervalSeconds).toBe(120);
    });

    it("should enforce minimum of 10 seconds", () => {
      const { setAutoSaveInterval } = useSettingsStore.getState();
      setAutoSaveInterval(5);
      expect(useSettingsStore.getState().autoSaveIntervalSeconds).toBe(10);
    });

    it("should allow exactly 10 seconds", () => {
      const { setAutoSaveInterval } = useSettingsStore.getState();
      setAutoSaveInterval(10);
      expect(useSettingsStore.getState().autoSaveIntervalSeconds).toBe(10);
    });

    it("should allow large values", () => {
      const { setAutoSaveInterval } = useSettingsStore.getState();
      setAutoSaveInterval(3600);
      expect(useSettingsStore.getState().autoSaveIntervalSeconds).toBe(3600);
    });
  });

  describe("setCombatLogMaxLines", () => {
    it("should set combat log max lines within valid range", () => {
      const { setCombatLogMaxLines } = useSettingsStore.getState();
      setCombatLogMaxLines(1000);
      expect(useSettingsStore.getState().combatLogMaxLines).toBe(1000);
    });

    it("should clamp to minimum 100", () => {
      const { setCombatLogMaxLines } = useSettingsStore.getState();
      setCombatLogMaxLines(50);
      expect(useSettingsStore.getState().combatLogMaxLines).toBe(100);
    });

    it("should clamp to maximum 2000", () => {
      const { setCombatLogMaxLines } = useSettingsStore.getState();
      setCombatLogMaxLines(3000);
      expect(useSettingsStore.getState().combatLogMaxLines).toBe(2000);
    });

    it("should allow exactly 100", () => {
      const { setCombatLogMaxLines } = useSettingsStore.getState();
      setCombatLogMaxLines(100);
      expect(useSettingsStore.getState().combatLogMaxLines).toBe(100);
    });

    it("should allow exactly 2000", () => {
      const { setCombatLogMaxLines } = useSettingsStore.getState();
      setCombatLogMaxLines(2000);
      expect(useSettingsStore.getState().combatLogMaxLines).toBe(2000);
    });
  });

  describe("setTooltipDelay", () => {
    it("should set tooltip delay within valid range", () => {
      const { setTooltipDelay } = useSettingsStore.getState();
      setTooltipDelay(500);
      expect(useSettingsStore.getState().tooltipDelay).toBe(500);
    });

    it("should clamp to minimum 0", () => {
      const { setTooltipDelay } = useSettingsStore.getState();
      setTooltipDelay(-100);
      expect(useSettingsStore.getState().tooltipDelay).toBe(0);
    });

    it("should clamp to maximum 1000", () => {
      const { setTooltipDelay } = useSettingsStore.getState();
      setTooltipDelay(1500);
      expect(useSettingsStore.getState().tooltipDelay).toBe(1000);
    });

    it("should allow exactly 0 (instant)", () => {
      const { setTooltipDelay } = useSettingsStore.getState();
      setTooltipDelay(0);
      expect(useSettingsStore.getState().tooltipDelay).toBe(0);
    });

    it("should allow exactly 1000", () => {
      const { setTooltipDelay } = useSettingsStore.getState();
      setTooltipDelay(1000);
      expect(useSettingsStore.getState().tooltipDelay).toBe(1000);
    });
  });

  describe("setMasterVolume", () => {
    it("should set master volume within valid range", () => {
      const { setMasterVolume } = useSettingsStore.getState();
      setMasterVolume(0.5);
      expect(useSettingsStore.getState().masterVolume).toBe(0.5);
    });

    it("should clamp to minimum 0", () => {
      const { setMasterVolume } = useSettingsStore.getState();
      setMasterVolume(-0.5);
      expect(useSettingsStore.getState().masterVolume).toBe(0);
    });

    it("should clamp to maximum 1", () => {
      const { setMasterVolume } = useSettingsStore.getState();
      setMasterVolume(1.5);
      expect(useSettingsStore.getState().masterVolume).toBe(1);
    });

    it("should allow exactly 0 (muted)", () => {
      const { setMasterVolume } = useSettingsStore.getState();
      setMasterVolume(0);
      expect(useSettingsStore.getState().masterVolume).toBe(0);
    });

    it("should allow exactly 1 (max volume)", () => {
      const { setMasterVolume } = useSettingsStore.getState();
      setMasterVolume(1);
      expect(useSettingsStore.getState().masterVolume).toBe(1);
    });
  });

  describe("resetToDefaults", () => {
    it("should reset all settings to default values", () => {
      const { setFontSize, setFontFamily, toggleShowFPS, resetToDefaults } =
        useSettingsStore.getState();

      // Change multiple settings
      setFontSize(24);
      setFontFamily("Arial");
      toggleShowFPS();

      // Verify they changed
      let state = useSettingsStore.getState();
      expect(state.fontSize).toBe(24);
      expect(state.fontFamily).toBe("Arial");
      expect(state.showFPS).toBe(true);

      // Reset to defaults
      resetToDefaults();

      // Verify all back to defaults
      state = useSettingsStore.getState();
      expect(state.fontSize).toBe(16);
      expect(state.fontFamily).toBe("Px437 IBM VGA8");
      expect(state.showFPS).toBe(false);
      expect(state.autoSaveIntervalSeconds).toBe(60);
      expect(state.combatLogMaxLines).toBe(500);
      expect(state.tooltipDelay).toBe(300);
      expect(state.masterVolume).toBe(0.8);
    });

    it("should reset all settings even after multiple changes", () => {
      const {
        setFontSize,
        setAutoSaveInterval,
        setCombatLogMaxLines,
        setMasterVolume,
        resetToDefaults,
      } = useSettingsStore.getState();

      // Change all settings
      setFontSize(32);
      setAutoSaveInterval(300);
      setCombatLogMaxLines(2000);
      setMasterVolume(0.1);

      // Reset
      resetToDefaults();

      // Verify
      const state = useSettingsStore.getState();
      expect(state.fontSize).toBe(16);
      expect(state.autoSaveIntervalSeconds).toBe(60);
      expect(state.combatLogMaxLines).toBe(500);
      expect(state.masterVolume).toBe(0.8);
    });
  });
});
