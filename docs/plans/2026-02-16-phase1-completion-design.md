# Phase 1 Completion: Remaining UI Renderer Tasks

**Date:** 2026-02-16
**Status:** Approved
**Builds on:** Phase 1 Domain Foundations Design (2026-02-16)

---

## 1. Current State

Phase 1 is ~85% complete. Tracks A (Engine), B (Combat), and C (Data) are fully implemented with 490 passing tests. Track D (UI Renderer) has 5 of 10 deliverables done:

| Done | Missing |
|------|---------|
| Palette (16-color ANSI) | FontLoader (bitmap font extraction) |
| CharacterGrid (grid data structure) | Renderer (60fps canvas loop) |
| BoxDrawing (border utility) | AppShell.tsx (root layout) |
| uiStore (Zustand UI state) | Tailwind config + HTML polish |
| settingsStore (persisted settings) | |

---

## 2. Remaining Tasks

### Task 32: FontLoader (`src/renderer/ascii/FontLoader.ts`)

Loads a bitmap font PNG sprite sheet (16x16 grid = 256 CP437 glyphs). Extracts `ImageBitmap[]` indexed by codepoint. Falls back to Canvas `fillText` with a monospace font if the PNG fails to load.

**Tests:**
- Loads 256 glyphs from a 16x16 grid
- Each glyph is the expected pixel dimensions
- Graceful fallback on load failure (no crash, returns usable fallback glyphs)

### Task 33: Canvas Renderer (`src/renderer/ascii/Renderer.ts`)

Core 60 FPS render loop via `requestAnimationFrame`. Renders the CharacterGrid to an HTML5 Canvas. Dirty-cell optimization skips unchanged cells. Pre-tinted glyph cache keyed by `(glyph, fg)` with LRU eviction at 4096 entries (~4 MB).

**Tests:**
- Dirty-cell optimization: unchanged grid produces zero draw calls
- Full-dirty render completes in <16ms for 120x67 grid (60 FPS capable)
- Resize handling: canvas adjusts to container size
- LRU cache: evicts oldest entries when exceeding 4096

### Task 36: AppShell (`src/renderer/components/AppShell.tsx`)

Root layout component using Tailwind CSS:
- Frameless title bar with min/max/close buttons (wired to IPC)
- Menu bar with placeholder navigation
- Content area using CSS Grid for panel layout
- Dark theme (gray-950 background, gray-100 text)

**Tests:**
- Renders title bar, menu bar, content area
- Window control buttons call appropriate IPC methods
- Responsive panel grid

### Task 38: Tailwind Config + HTML Polish

- Tailwind CSS v4 setup via `@tailwindcss/vite` plugin (already installed)
- Add `@import "tailwindcss"` to a CSS entry point
- Update `src/renderer/index.html` with proper meta tags
- Update `src/renderer/main.tsx` to mount AppShell with store providers and TooltipProvider placeholder

**Tests:**
- Tailwind classes compile correctly
- React mounts without errors

---

## 3. Final Verification (Task 39)

After all Track D tasks are complete:

1. `npx tsc --noEmit` -- 0 errors across all tsconfig files
2. `npx vitest run` -- all tests pass (520+ expected)
3. `npx electron-vite build` -- builds main, preload, and renderer
4. Manual smoke test: `npx electron-vite dev` boots Electron window with AppShell
5. Tag `v0.1.0-phase1` on main

---

## 4. Architecture Notes

### Canvas Renderer Strategy

The Renderer draws to a single `<canvas>` element that fills the content area of the AppShell. Each cell is rendered as:
1. Fill background rect with `bg` color
2. Draw pre-tinted glyph from cache (or tint on demand and cache)

The LRU cache stores `(glyph_index, fg_color)` -> `ImageBitmap`. At 4096 entries with ~1KB per bitmap, this uses ~4MB. The full combination space (256 glyphs x 16 fg colors = 4096) fits exactly in cache at steady state.

### FontLoader Fallback

If the bitmap font PNG is unavailable (e.g., during testing or before assets are bundled), the FontLoader falls back to Canvas `fillText` with a system monospace font. This ensures tests can run in Node.js/jsdom without canvas image support.

### Tailwind v4

Tailwind v4 uses the `@tailwindcss/vite` plugin (already in dependencies) and `@import "tailwindcss"` in CSS. No `tailwind.config.js` needed -- configuration is done via CSS custom properties.

---

## 5. After Phase 1

Once tagged, Phase 2 (Cross-Domain Integration) will be designed in a separate brainstorming session covering:
- Engine tick dispatch calling combat formulas
- Engine loading game data via the data API
- UI subscribing to engine state via IPC bridge
- Character creation as the first end-to-end feature
