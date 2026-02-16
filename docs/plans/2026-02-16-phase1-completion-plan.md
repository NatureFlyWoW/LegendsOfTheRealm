# Phase 1 Completion: UI Renderer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining 4 UI renderer tasks (FontLoader, canvas Renderer, AppShell, Tailwind/entry polish) and verify Phase 1 end-to-end.

**Architecture:** FontLoader extracts glyphs from a bitmap PNG (or falls back to Canvas fillText). Renderer uses requestAnimationFrame at 60 FPS with dirty-cell optimization and an LRU glyph tint cache. AppShell provides the Tailwind CSS root layout with title bar, menu bar, and content area. All tests run in Node.js/vitest without a real browser — Canvas/DOM APIs are mocked or tested via jsdom.

**Tech Stack:** TypeScript 5+, HTML5 Canvas API, React 19, Zustand, Tailwind CSS v4, Vitest

**Design doc:** `docs/plans/2026-02-16-phase1-completion-design.md`

**Parallel execution note:** Tasks 1-3 are independent and can execute in parallel (FontLoader, Renderer, AppShell are separate files with no interdependencies). Task 4 (Tailwind + entry polish) depends on Task 3 (AppShell). Task 5 (final verification) depends on all previous tasks.

---

## Task 1: FontLoader — Bitmap Font Extraction with Fallback

**Files:**
- Create: `src/renderer/ascii/FontLoader.ts`
- Create: `tests/renderer/ascii/FontLoader.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/renderer/ascii/FontLoader.test.ts
import { describe, it, expect, vi } from "vitest";
import { FontLoader, type GlyphProvider } from "@renderer/ascii/FontLoader";

describe("FontLoader", () => {
  describe("FallbackGlyphProvider", () => {
    it("creates a glyph provider without a bitmap font", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      expect(provider).toBeDefined();
      expect(provider.cellWidth).toBeGreaterThan(0);
      expect(provider.cellHeight).toBeGreaterThan(0);
    });

    it("has cell dimensions based on font size", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      // Monospace 16px: cell width ~ 9-10px, height = 16px
      expect(provider.cellHeight).toBe(16);
      expect(provider.cellWidth).toBeGreaterThanOrEqual(6);
      expect(provider.cellWidth).toBeLessThanOrEqual(16);
    });

    it("reports 256 available glyphs", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      expect(provider.glyphCount).toBe(256);
    });
  });

  describe("renderGlyph", () => {
    it("returns an object with drawGlyph function", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      expect(typeof provider.drawGlyph).toBe("function");
    });
  });

  describe("CP437 mapping", () => {
    it("maps ASCII printable range (32-126) directly", () => {
      expect(FontLoader.cp437ToChar(65)).toBe("A");
      expect(FontLoader.cp437ToChar(48)).toBe("0");
      expect(FontLoader.cp437ToChar(32)).toBe(" ");
    });

    it("maps index 0 to null character placeholder", () => {
      // Index 0 in CP437 is a blank/null — we use space
      expect(FontLoader.cp437ToChar(0)).toBe(" ");
    });

    it("maps box-drawing characters in 176-223 range", () => {
      // 218 = ┌ in CP437
      expect(FontLoader.cp437ToChar(218)).toBe("┌");
      // 191 = ┐
      expect(FontLoader.cp437ToChar(191)).toBe("┐");
      // 192 = └
      expect(FontLoader.cp437ToChar(192)).toBe("└");
      // 217 = ┘
      expect(FontLoader.cp437ToChar(217)).toBe("┘");
    });
  });

  describe("charToCP437", () => {
    it("reverse maps standard ASCII", () => {
      expect(FontLoader.charToCP437("A")).toBe(65);
      expect(FontLoader.charToCP437("0")).toBe(48);
      expect(FontLoader.charToCP437(" ")).toBe(32);
    });

    it("reverse maps Unicode box-drawing to CP437 indices", () => {
      expect(FontLoader.charToCP437("┌")).toBe(218);
      expect(FontLoader.charToCP437("┐")).toBe(191);
      expect(FontLoader.charToCP437("└")).toBe(192);
      expect(FontLoader.charToCP437("┘")).toBe(217);
    });

    it("returns 63 (?) for unknown characters", () => {
      expect(FontLoader.charToCP437("😀")).toBe(63);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/renderer/ascii/FontLoader.test.ts
```

Expected: FAIL — module `@renderer/ascii/FontLoader` not found.

**Step 3: Implement FontLoader**

```typescript
// src/renderer/ascii/FontLoader.ts

export interface GlyphProvider {
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly glyphCount: number;
  drawGlyph: (
    ctx: CanvasRenderingContext2D,
    charCode: number,
    x: number,
    y: number,
    fgColor: string,
  ) => void;
}

// CP437 to Unicode lookup table (256 entries)
// Standard ASCII (32-126) maps directly; others map to specific Unicode points
const CP437_TO_UNICODE: string[] = [
  // 0-31: Control chars / special symbols
  " ", "\u263A", "\u263B", "\u2665", "\u2666", "\u2663", "\u2660", "\u2022",
  "\u25D8", "\u25CB", "\u25D9", "\u2642", "\u2640", "\u266A", "\u266B", "\u263C",
  "\u25BA", "\u25C4", "\u2195", "\u203C", "\u00B6", "\u00A7", "\u25AC", "\u21A8",
  "\u2191", "\u2193", "\u2192", "\u2190", "\u221F", "\u2194", "\u25B2", "\u25BC",
  // 32-126: Standard ASCII (space through ~)
  ...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)),
  // 127: House
  "\u2302",
  // 128-175: International chars, math symbols
  "\u00C7", "\u00FC", "\u00E9", "\u00E2", "\u00E4", "\u00E0", "\u00E5", "\u00E7",
  "\u00EA", "\u00EB", "\u00E8", "\u00EF", "\u00EE", "\u00EC", "\u00C4", "\u00C5",
  "\u00C9", "\u00E6", "\u00C6", "\u00F4", "\u00F6", "\u00F2", "\u00FB", "\u00F9",
  "\u00FF", "\u00D6", "\u00DC", "\u00A2", "\u00A3", "\u00A5", "\u20A7", "\u0192",
  "\u00E1", "\u00ED", "\u00F3", "\u00FA", "\u00F1", "\u00D1", "\u00AA", "\u00BA",
  "\u00BF", "\u2310", "\u00AC", "\u00BD", "\u00BC", "\u00A1", "\u00AB", "\u00BB",
  // 176-223: Box drawing and blocks
  "\u2591", "\u2592", "\u2593", "\u2502", "\u2524", "\u2561", "\u2562", "\u2556",
  "\u2555", "\u2563", "\u2551", "\u2557", "\u255D", "\u255C", "\u255B", "\u2510",
  "\u2514", "\u2534", "\u252C", "\u251C", "\u2500", "\u253C", "\u255E", "\u255F",
  "\u255A", "\u2554", "\u2569", "\u2566", "\u2560", "\u2550", "\u256C", "\u2567",
  "\u2568", "\u2564", "\u2565", "\u2559", "\u2558", "\u2552", "\u2553", "\u256B",
  "\u256A", "\u2518", "\u250C", "\u2588", "\u2584", "\u258C", "\u2590", "\u2580",
  // 224-255: Greek letters, math, misc
  "\u03B1", "\u00DF", "\u0393", "\u03C0", "\u03A3", "\u03C3", "\u00B5", "\u03C4",
  "\u03A6", "\u0398", "\u03A9", "\u03B4", "\u221E", "\u03C6", "\u03B5", "\u2229",
  "\u2261", "\u00B1", "\u2265", "\u2264", "\u2320", "\u2321", "\u00F7", "\u2248",
  "\u00B0", "\u2219", "\u00B7", "\u221A", "\u207F", "\u00B2", "\u25A0", "\u00A0",
];

// Reverse map: Unicode char -> CP437 index
const UNICODE_TO_CP437 = new Map<string, number>();
for (let i = 0; i < 256; i++) {
  UNICODE_TO_CP437.set(CP437_TO_UNICODE[i], i);
}

export class FontLoader {
  static cp437ToChar(index: number): string {
    if (index < 0 || index >= 256) return " ";
    return CP437_TO_UNICODE[index];
  }

  static charToCP437(char: string): number {
    return UNICODE_TO_CP437.get(char) ?? 63; // 63 = '?'
  }

  static createFallback(fontSize: number, fontFamily: string): GlyphProvider {
    // Approximate cell width for monospace font (roughly 0.6 * height)
    const cellWidth = Math.round(fontSize * 0.6);
    const cellHeight = fontSize;

    return {
      cellWidth,
      cellHeight,
      glyphCount: 256,
      drawGlyph(
        ctx: CanvasRenderingContext2D,
        charCode: number,
        x: number,
        y: number,
        fgColor: string,
      ): void {
        const char = FontLoader.cp437ToChar(charCode);
        ctx.fillStyle = fgColor;
        ctx.font = `${fontSize}px "${fontFamily}", monospace`;
        ctx.textBaseline = "top";
        ctx.fillText(char, x, y);
      },
    };
  }

  static async loadBitmapFont(
    imageSrc: string,
    glyphsPerRow: number = 16,
    glyphsPerCol: number = 16,
  ): Promise<GlyphProvider> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cellWidth = Math.floor(img.width / glyphsPerRow);
        const cellHeight = Math.floor(img.height / glyphsPerCol);

        resolve({
          cellWidth,
          cellHeight,
          glyphCount: glyphsPerRow * glyphsPerCol,
          drawGlyph(
            ctx: CanvasRenderingContext2D,
            charCode: number,
            x: number,
            y: number,
            _fgColor: string,
          ): void {
            const sx = (charCode % glyphsPerRow) * cellWidth;
            const sy = Math.floor(charCode / glyphsPerRow) * cellHeight;
            ctx.drawImage(img, sx, sy, cellWidth, cellHeight, x, y, cellWidth, cellHeight);
          },
        });
      };
      img.onerror = () => reject(new Error(`Failed to load bitmap font: ${imageSrc}`));
      img.src = imageSrc;
    });
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/renderer/ascii/FontLoader.test.ts
```

Expected: PASS — all tests green.

**Step 5: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: All existing tests still pass.

**Step 6: Commit**

```bash
git add src/renderer/ascii/FontLoader.ts tests/renderer/ascii/FontLoader.test.ts
git commit -m "feat: add FontLoader with CP437 mapping and fallback glyph provider"
```

---

## Task 2: Canvas Renderer — 60 FPS Dirty-Cell Loop with LRU Glyph Cache

**Files:**
- Create: `src/renderer/ascii/LRUCache.ts`
- Create: `src/renderer/ascii/Renderer.ts`
- Create: `tests/renderer/ascii/LRUCache.test.ts`
- Create: `tests/renderer/ascii/Renderer.test.ts`

**Step 1: Write the failing tests for LRU cache**

```typescript
// tests/renderer/ascii/LRUCache.test.ts
import { describe, it, expect } from "vitest";
import { LRUCache } from "@renderer/ascii/LRUCache";

describe("LRUCache", () => {
  it("stores and retrieves values", () => {
    const cache = new LRUCache<string, number>(10);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("returns undefined for missing keys", () => {
    const cache = new LRUCache<string, number>(10);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("evicts least recently used when at capacity", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.set("d", 4); // evicts "a"
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("d")).toBe(4);
  });

  it("accessing a key makes it most recently used", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.get("a"); // touch "a" — now "b" is LRU
    cache.set("d", 4); // evicts "b"
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
  });

  it("reports correct size", () => {
    const cache = new LRUCache<string, number>(5);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
  });

  it("clear empties the cache", () => {
    const cache = new LRUCache<string, number>(5);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  it("handles capacity of 1", () => {
    const cache = new LRUCache<string, number>(1);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.size).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/renderer/ascii/LRUCache.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement LRUCache**

```typescript
// src/renderer/ascii/LRUCache.ts

export class LRUCache<K, V> {
  private map = new Map<K, V>();
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity);
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    // Move to end (most recent) by re-inserting
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict least recently used (first key in Map iteration order)
      const firstKey = this.map.keys().next().value!;
      this.map.delete(firstKey);
    }
    this.map.set(key, value);
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}
```

**Step 4: Run LRUCache test to verify it passes**

```bash
npx vitest run tests/renderer/ascii/LRUCache.test.ts
```

Expected: PASS.

**Step 5: Commit LRUCache**

```bash
git add src/renderer/ascii/LRUCache.ts tests/renderer/ascii/LRUCache.test.ts
git commit -m "feat: add LRU cache for glyph tinting"
```

**Step 6: Write the failing test for Renderer**

```typescript
// tests/renderer/ascii/Renderer.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AsciiRenderer, type RendererConfig } from "@renderer/ascii/Renderer";
import { CharacterGrid } from "@renderer/ascii/CharacterGrid";
import { ANSIColor } from "@renderer/ascii/Palette";

// Mock CanvasRenderingContext2D
function createMockCtx() {
  return {
    fillStyle: "",
    font: "",
    textBaseline: "",
    fillRect: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    canvas: { width: 960, height: 384 },
  } as unknown as CanvasRenderingContext2D;
}

describe("AsciiRenderer", () => {
  let grid: CharacterGrid;
  let ctx: CanvasRenderingContext2D;
  let renderer: AsciiRenderer;

  beforeEach(() => {
    grid = new CharacterGrid(120, 67);
    ctx = createMockCtx();
    renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 8,
      cellHeight: 16,
    });
  });

  it("renders all cells on first draw (all dirty)", () => {
    renderer.renderFrame();
    // Every cell gets a background fill + text draw
    // 120 * 67 = 8040 cells, each gets fillRect for bg
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("skips unchanged cells after clearDirty", () => {
    renderer.renderFrame();
    grid.clearDirty();
    (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
    (ctx.fillText as ReturnType<typeof vi.fn>).mockClear();

    renderer.renderFrame();
    // No dirty cells — zero draw calls
    expect((ctx.fillRect as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
    expect((ctx.fillText as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it("only redraws cells that changed", () => {
    renderer.renderFrame();
    grid.clearDirty();
    (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
    (ctx.fillText as ReturnType<typeof vi.fn>).mockClear();

    // Change 3 cells
    grid.setCell(0, 0, "A", ANSIColor.Red, ANSIColor.Black);
    grid.setCell(5, 5, "B", ANSIColor.Green, ANSIColor.Blue);
    grid.setCell(10, 10, "C", ANSIColor.White, ANSIColor.Black);

    renderer.renderFrame();
    // 3 dirty cells = 3 fillRect (bg) + 3 fillText (glyph)
    expect((ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
    expect((ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
  });

  it("auto-clears dirty flags after render", () => {
    grid.setCell(0, 0, "X", ANSIColor.White, ANSIColor.Black);
    renderer.renderFrame();
    expect(grid.isDirty(0, 0)).toBe(false);
  });

  it("has configurable cell dimensions", () => {
    expect(renderer.cellWidth).toBe(8);
    expect(renderer.cellHeight).toBe(16);
  });

  it("reports grid dimensions in pixels", () => {
    expect(renderer.pixelWidth).toBe(120 * 8);
    expect(renderer.pixelHeight).toBe(67 * 16);
  });

  it("skips space characters for glyph draw (bg only)", () => {
    grid.clearDirty();
    grid.setCell(0, 0, " ", ANSIColor.White, ANSIColor.Blue);
    (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
    (ctx.fillText as ReturnType<typeof vi.fn>).mockClear();

    renderer.renderFrame();
    // Should draw bg rect but skip fillText for space
    expect((ctx.fillRect as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    expect((ctx.fillText as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
```

**Step 7: Run test to verify it fails**

```bash
npx vitest run tests/renderer/ascii/Renderer.test.ts
```

Expected: FAIL — module not found.

**Step 8: Implement AsciiRenderer**

```typescript
// src/renderer/ascii/Renderer.ts
import { CharacterGrid } from "./CharacterGrid";
import { ANSI_COLORS, type ANSIColor } from "./Palette";

export interface RendererConfig {
  ctx: CanvasRenderingContext2D;
  grid: CharacterGrid;
  cellWidth: number;
  cellHeight: number;
  fontFamily?: string;
}

export class AsciiRenderer {
  private ctx: CanvasRenderingContext2D;
  private grid: CharacterGrid;
  readonly cellWidth: number;
  readonly cellHeight: number;
  private fontFamily: string;

  constructor(config: RendererConfig) {
    this.ctx = config.ctx;
    this.grid = config.grid;
    this.cellWidth = config.cellWidth;
    this.cellHeight = config.cellHeight;
    this.fontFamily = config.fontFamily ?? "monospace";
  }

  get pixelWidth(): number {
    return this.grid.width * this.cellWidth;
  }

  get pixelHeight(): number {
    return this.grid.height * this.cellHeight;
  }

  private colorToCSS(color: ANSIColor): string {
    const [r, g, b] = ANSI_COLORS[color];
    return `rgb(${r},${g},${b})`;
  }

  renderFrame(): void {
    const { ctx, grid, cellWidth, cellHeight } = this;
    ctx.font = `${cellHeight}px "${this.fontFamily}", monospace`;
    ctx.textBaseline = "top";

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (!grid.isDirty(x, y)) continue;

        const cell = grid.getCell(x, y);
        if (!cell) continue;

        const px = x * cellWidth;
        const py = y * cellHeight;

        // Draw background
        ctx.fillStyle = this.colorToCSS(cell.bg);
        ctx.fillRect(px, py, cellWidth, cellHeight);

        // Draw glyph (skip spaces — bg only)
        if (cell.char !== " ") {
          ctx.fillStyle = this.colorToCSS(cell.fg);
          ctx.fillText(cell.char, px, py);
        }
      }
    }

    grid.clearDirty();
  }
}
```

**Step 9: Run test to verify it passes**

```bash
npx vitest run tests/renderer/ascii/Renderer.test.ts
```

Expected: PASS.

**Step 10: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 11: Commit Renderer**

```bash
git add src/renderer/ascii/Renderer.ts tests/renderer/ascii/Renderer.test.ts
git commit -m "feat: add AsciiRenderer with dirty-cell optimization"
```

---

## Task 3: AppShell — Root Tailwind Layout Component

**Files:**
- Create: `src/renderer/components/AppShell.tsx`
- Create: `tests/renderer/components/AppShell.test.tsx`

**Step 1: Write the failing test**

Note: These tests use `@testing-library/react` which requires jsdom. The vitest config may need a test-specific environment. If vitest doesn't have jsdom configured globally, add `// @vitest-environment jsdom` at the top of the test file.

```typescript
// tests/renderer/components/AppShell.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppShell } from "@renderer/components/AppShell";

// Mock window.api for IPC calls
beforeAll(() => {
  (globalThis as any).window = globalThis.window ?? {};
  Object.defineProperty(globalThis, "window", {
    value: {
      ...globalThis.window,
      api: {
        ping: () => "pong",
        createSave: vi.fn(),
        openSave: vi.fn(),
        listSaves: vi.fn(),
        backupSave: vi.fn(),
        startGame: vi.fn(),
        stopGame: vi.fn(),
        pauseGame: vi.fn(),
        resumeGame: vi.fn(),
        getGameState: vi.fn(),
        onTick: vi.fn(() => () => {}),
      },
    },
    writable: true,
  });
});

describe("AppShell", () => {
  it("renders the title bar", () => {
    render(<AppShell />);
    expect(screen.getByText("Legends of the Shattered Realm")).toBeDefined();
  });

  it("renders navigation tabs", () => {
    render(<AppShell />);
    expect(screen.getByText("Character")).toBeDefined();
    expect(screen.getByText("Inventory")).toBeDefined();
    expect(screen.getByText("Talents")).toBeDefined();
    expect(screen.getByText("Quests")).toBeDefined();
  });

  it("renders the main content area", () => {
    render(<AppShell />);
    expect(screen.getByTestId("main-content")).toBeDefined();
  });

  it("renders window control buttons", () => {
    render(<AppShell />);
    expect(screen.getByTestId("btn-minimize")).toBeDefined();
    expect(screen.getByTestId("btn-maximize")).toBeDefined();
    expect(screen.getByTestId("btn-close")).toBeDefined();
  });

  it("switching tabs updates active tab", () => {
    render(<AppShell />);
    const inventoryTab = screen.getByText("Inventory");
    fireEvent.click(inventoryTab);
    // The tab should have an active indicator (aria-selected or class)
    expect(inventoryTab.getAttribute("aria-selected")).toBe("true");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/renderer/components/AppShell.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Implement AppShell**

```tsx
// src/renderer/components/AppShell.tsx
import React from "react";
import { useUIStore, type ActiveTab } from "../stores/uiStore";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "character", label: "Character" },
  { id: "inventory", label: "Inventory" },
  { id: "talents", label: "Talents" },
  { id: "quests", label: "Quests" },
  { id: "combat_log", label: "Combat Log" },
  { id: "world_map", label: "World Map" },
  { id: "professions", label: "Professions" },
  { id: "achievements", label: "Achievements" },
  { id: "settings", label: "Settings" },
];

function TitleBar() {
  return (
    <div className="flex items-center justify-between h-8 bg-gray-900 border-b border-gray-700 select-none"
         style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <span className="pl-3 text-sm font-mono text-amber-400">
        Legends of the Shattered Realm
      </span>
      <div className="flex" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <button data-testid="btn-minimize"
                className="w-10 h-8 text-gray-400 hover:bg-gray-700 hover:text-white text-sm">
          &#x2500;
        </button>
        <button data-testid="btn-maximize"
                className="w-10 h-8 text-gray-400 hover:bg-gray-700 hover:text-white text-sm">
          &#x25A1;
        </button>
        <button data-testid="btn-close"
                className="w-10 h-8 text-gray-400 hover:bg-red-600 hover:text-white text-sm">
          &#x2715;
        </button>
      </div>
    </div>
  );
}

function MenuBar() {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <nav className="flex items-center gap-1 px-2 h-9 bg-gray-900 border-b border-gray-800 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`px-3 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-gray-700 text-amber-400"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-mono">
      <TitleBar />
      <MenuBar />
      <main data-testid="main-content" className="flex-1 overflow-hidden p-2">
        {/* Canvas and panels will mount here in Phase 2 */}
      </main>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/renderer/components/AppShell.test.tsx
```

Expected: PASS.

**Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/renderer/components/AppShell.tsx tests/renderer/components/AppShell.test.tsx
git commit -m "feat: add AppShell with title bar, tab navigation, and content area"
```

---

## Task 4: Tailwind CSS Entry + React Mount Polish

**Files:**
- Create: `src/renderer/styles.css`
- Modify: `src/renderer/index.html` (add CSS import)
- Modify: `src/renderer/main.tsx` (mount AppShell)

**Depends on:** Task 3 (AppShell must exist)

**Step 1: Create Tailwind CSS entry point**

```css
/* src/renderer/styles.css */
@import "tailwindcss";
```

**Step 2: Update `src/renderer/index.html` to import CSS**

Replace the current `<body>` contents. The key change is adding the CSS link and ensuring the structure is correct for electron-vite:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" />
  <title>Legends of the Shattered Realm</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body class="bg-gray-950 text-gray-100 overflow-hidden">
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

**Step 3: Update `src/renderer/main.tsx` to mount AppShell**

```tsx
// src/renderer/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./components/AppShell";

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
```

**Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/renderer/styles.css src/renderer/index.html src/renderer/main.tsx
git commit -m "feat: add Tailwind CSS entry and wire AppShell into React mount"
```

---

## Task 5: Final Phase 1 Verification

**Depends on:** Tasks 1-4 all complete

**Step 1: Type check all code**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If there are errors, fix them and re-run.

**Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (target: 520+ tests).

**Step 3: Build with electron-vite**

```bash
npx electron-vite build
```

Expected: Builds main, preload, and renderer without errors. Output goes to `out/` directory.

If the build fails, diagnose and fix. Common issues:
- Missing type declarations for renderer environment
- Import resolution differences between vitest and electron-vite
- Tailwind v4 plugin configuration

**Step 4: Manual smoke test**

```bash
npx electron-vite dev
```

Expected: Electron window opens showing the dark-themed AppShell with title bar and tab navigation.

**Step 5: Fix any issues found in Steps 1-4**

If any step fails, fix the issue, run all tests again, and re-verify.

**Step 6: Tag the release**

```bash
git tag v0.1.0-phase1
```

**Step 7: Report Phase 1 completion metrics**

Count and report:
- Total test files
- Total test count
- Total source files
- Line count (approximate)
