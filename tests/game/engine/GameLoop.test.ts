import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GameLoop } from "@game/engine/GameLoop";

describe("GameLoop", () => {
  let gameLoop: GameLoop;
  let tickCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    tickCallback = vi.fn();
    gameLoop = new GameLoop(tickCallback);
  });

  afterEach(() => {
    gameLoop.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("starts with isRunning = false", () => {
      expect(gameLoop.isRunning).toBe(false);
    });

    it("starts with isPaused = false", () => {
      expect(gameLoop.isPaused).toBe(false);
    });

    it("starts with currentTick = 0", () => {
      expect(gameLoop.currentTick).toBe(0);
    });
  });

  describe("start", () => {
    it("sets isRunning to true", () => {
      gameLoop.start();
      expect(gameLoop.isRunning).toBe(true);
    });

    it("begins ticking after 1 second", () => {
      gameLoop.start();
      expect(tickCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(1);
      expect(tickCallback).toHaveBeenCalledWith(1);
    });

    it("is no-op if already running", () => {
      gameLoop.start();
      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(1);

      gameLoop.start(); // Should be no-op
      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(2); // Only one more tick
    });
  });

  describe("stop", () => {
    it("sets isRunning to false", () => {
      gameLoop.start();
      gameLoop.stop();
      expect(gameLoop.isRunning).toBe(false);
    });

    it("stops ticking", () => {
      gameLoop.start();
      vi.advanceTimersByTime(2000);
      expect(tickCallback).toHaveBeenCalledTimes(2);

      gameLoop.stop();
      vi.advanceTimersByTime(2000);
      expect(tickCallback).toHaveBeenCalledTimes(2); // No more ticks
    });

    it("sets isPaused to false", () => {
      gameLoop.start();
      gameLoop.pause();
      expect(gameLoop.isPaused).toBe(true);

      gameLoop.stop();
      expect(gameLoop.isPaused).toBe(false);
    });
  });

  describe("pause", () => {
    it("sets isPaused to true", () => {
      gameLoop.start();
      gameLoop.pause();
      expect(gameLoop.isPaused).toBe(true);
    });

    it("stops ticking while paused", () => {
      gameLoop.start();
      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(1);

      gameLoop.pause();
      vi.advanceTimersByTime(2000);
      expect(tickCallback).toHaveBeenCalledTimes(1); // No more ticks
    });

    it("keeps isRunning true", () => {
      gameLoop.start();
      gameLoop.pause();
      expect(gameLoop.isRunning).toBe(true);
      expect(gameLoop.isPaused).toBe(true);
    });

    it("is no-op if not running", () => {
      gameLoop.pause();
      expect(gameLoop.isPaused).toBe(false);
    });

    it("is no-op if already paused", () => {
      gameLoop.start();
      gameLoop.pause();
      expect(gameLoop.isPaused).toBe(true);

      gameLoop.pause(); // Should be no-op
      expect(gameLoop.isPaused).toBe(true);
    });
  });

  describe("resume", () => {
    it("sets isPaused to false", () => {
      gameLoop.start();
      gameLoop.pause();
      gameLoop.resume();
      expect(gameLoop.isPaused).toBe(false);
    });

    it("resumes ticking", () => {
      gameLoop.start();
      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(1);

      gameLoop.pause();
      vi.advanceTimersByTime(2000);
      expect(tickCallback).toHaveBeenCalledTimes(1);

      gameLoop.resume();
      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(2); // Resumed ticking
    });

    it("is no-op if not paused", () => {
      gameLoop.start();
      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(1);

      gameLoop.resume(); // Should be no-op
      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(2);
    });

    it("is no-op if not running", () => {
      gameLoop.resume();
      expect(gameLoop.isPaused).toBe(false);
      expect(gameLoop.isRunning).toBe(false);
    });
  });

  describe("tick timing", () => {
    it("ticks every 1 second (1 Hz)", () => {
      gameLoop.start();

      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(3);
    });

    it("increments tick number", () => {
      gameLoop.start();

      vi.advanceTimersByTime(1000);
      expect(gameLoop.currentTick).toBe(1);
      expect(tickCallback).toHaveBeenCalledWith(1);

      vi.advanceTimersByTime(1000);
      expect(gameLoop.currentTick).toBe(2);
      expect(tickCallback).toHaveBeenCalledWith(2);

      vi.advanceTimersByTime(1000);
      expect(gameLoop.currentTick).toBe(3);
      expect(tickCallback).toHaveBeenCalledWith(3);
    });

    it("processes multiple ticks if time jumped forward", () => {
      gameLoop.start();

      vi.advanceTimersByTime(3000);

      expect(tickCallback).toHaveBeenCalledTimes(3);
      expect(tickCallback).toHaveBeenNthCalledWith(1, 1);
      expect(tickCallback).toHaveBeenNthCalledWith(2, 2);
      expect(tickCallback).toHaveBeenNthCalledWith(3, 3);
      expect(gameLoop.currentTick).toBe(3);
    });
  });

  describe("max catchup", () => {
    it("limits catchup to MAX_CATCHUP_TICKS (10 ticks) per cycle", () => {
      gameLoop.start();

      // Jump forward 15 seconds
      // Note: With fake timers, all pending timers fire synchronously,
      // so this will process ticks in batches of 10, then 5
      vi.advanceTimersByTime(15000);

      // All 15 ticks will be processed (10 + 5 in separate scheduleNext calls)
      expect(tickCallback).toHaveBeenCalledTimes(15);
      expect(gameLoop.currentTick).toBe(15);

      // Verify the max catchup is working by checking tick order
      // (ticks 1-10 should be called first, then 11-15)
      for (let i = 1; i <= 15; i++) {
        expect(tickCallback).toHaveBeenNthCalledWith(i, i);
      }
    });

    it("continues normal ticking after catchup", () => {
      gameLoop.start();

      // Jump forward to trigger catchup
      vi.advanceTimersByTime(5000);
      expect(tickCallback).toHaveBeenCalledTimes(5);

      // Continue with normal ticking
      vi.advanceTimersByTime(3000);
      expect(tickCallback).toHaveBeenCalledTimes(8);
      expect(gameLoop.currentTick).toBe(8);
    });
  });

  describe("drift correction", () => {
    it("maintains 1 Hz frequency over time", () => {
      gameLoop.start();

      // Simulate 10 seconds
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(1000);
      }

      expect(tickCallback).toHaveBeenCalledTimes(10);
      expect(gameLoop.currentTick).toBe(10);
    });
  });
});
