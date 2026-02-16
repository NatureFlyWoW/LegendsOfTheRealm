import { describe, it, expect, vi } from "vitest";
import { AsciiRenderer } from "@renderer/ascii/Renderer";
import { CharacterGrid } from "@renderer/ascii/CharacterGrid";
import { ANSIColor, colorToCSS } from "@renderer/ascii/Palette";

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
  it("first render draws all cells (all dirty after construction)", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(4, 3); // 12 cells, all spaces initially
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    renderer.renderFrame();

    // All 12 cells should get a fillRect call (background)
    expect(ctx.fillRect).toHaveBeenCalledTimes(12);
    // All cells are spaces, so fillText should NOT be called
    expect(ctx.fillText).toHaveBeenCalledTimes(0);
  });

  it("after clearDirty, no dirty cells = zero draw calls", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(4, 3);
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    // First render clears dirty flags
    renderer.renderFrame();
    ctx.fillRect.mockClear();
    ctx.fillText.mockClear();

    // Second render with no changes
    renderer.renderFrame();
    expect(ctx.fillRect).toHaveBeenCalledTimes(0);
    expect(ctx.fillText).toHaveBeenCalledTimes(0);
  });

  it("changing 3 cells = exactly 3 fillRect + 3 fillText calls", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(10, 5);
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    // Initial render to clear dirty state
    renderer.renderFrame();
    ctx.fillRect.mockClear();
    ctx.fillText.mockClear();

    // Change exactly 3 cells with non-space characters
    grid.setCell(0, 0, "A", ANSIColor.White, ANSIColor.Black);
    grid.setCell(5, 2, "B", ANSIColor.Red, ANSIColor.Blue);
    grid.setCell(9, 4, "C", ANSIColor.Green, ANSIColor.Yellow);

    renderer.renderFrame();

    expect(ctx.fillRect).toHaveBeenCalledTimes(3);
    expect(ctx.fillText).toHaveBeenCalledTimes(3);
  });

  it("auto-clears dirty flags after renderFrame()", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(4, 3);
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    renderer.renderFrame();

    // All dirty flags should be cleared after render
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        expect(grid.isDirty(x, y)).toBe(false);
      }
    }
  });

  it("reports correct pixel dimensions", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(80, 24);
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    expect(renderer.cellWidth).toBe(12);
    expect(renderer.cellHeight).toBe(16);
    expect(renderer.pixelWidth).toBe(80 * 12); // 960
    expect(renderer.pixelHeight).toBe(24 * 16); // 384
  });

  it("space characters skip fillText (bg-only)", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(3, 1); // 3 cells
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    // Initial render: all cells are spaces
    renderer.renderFrame();

    // 3 background rects, 0 text calls
    expect(ctx.fillRect).toHaveBeenCalledTimes(3);
    expect(ctx.fillText).toHaveBeenCalledTimes(0);

    ctx.fillRect.mockClear();
    ctx.fillText.mockClear();

    // Set one cell to a non-space character, leave others as space
    grid.setCell(1, 0, "X", ANSIColor.White, ANSIColor.Black);

    renderer.renderFrame();

    // Only 1 cell is dirty: the one we changed
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
  });

  it("draws correct background and foreground colors", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(1, 1);
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    // Clear initial dirty state
    renderer.renderFrame();
    ctx.fillRect.mockClear();
    ctx.fillText.mockClear();

    grid.setCell(0, 0, "W", ANSIColor.BrightCyan, ANSIColor.Red);
    renderer.renderFrame();

    // Background fillRect should use the bg color
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 12, 16);
    // fillText should use the fg color
    expect(ctx.fillText).toHaveBeenCalledWith("W", 0, 0);
  });

  it("uses default font family when not specified", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(2, 1);
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
    });

    grid.setCell(0, 0, "A", ANSIColor.White, ANSIColor.Black);
    renderer.renderFrame();

    // Font should be set with the cell height and default monospace family
    expect(ctx.font).toContain("16");
    expect(ctx.font).toContain("monospace");
  });

  it("uses custom font family when specified", () => {
    const ctx = createMockCtx();
    const grid = new CharacterGrid(2, 1);
    const renderer = new AsciiRenderer({
      ctx,
      grid,
      cellWidth: 12,
      cellHeight: 16,
      fontFamily: "Courier New",
    });

    grid.setCell(0, 0, "A", ANSIColor.White, ANSIColor.Black);
    renderer.renderFrame();

    expect(ctx.font).toContain("Courier New");
  });
});
