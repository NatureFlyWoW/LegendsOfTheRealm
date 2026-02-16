import { describe, it, expect } from "vitest";
import { CharacterGrid } from "@renderer/ascii/CharacterGrid";
import { ANSIColor } from "@renderer/ascii/Palette";

describe("CharacterGrid", () => {
  it("constructor creates grid with correct dimensions", () => {
    const grid = new CharacterGrid(80, 24);
    expect(grid.width).toBe(80);
    expect(grid.height).toBe(24);
  });

  it("initializes with space/white/black", () => {
    const grid = new CharacterGrid(10, 5);
    const cell = grid.getCell(0, 0);
    expect(cell).not.toBeNull();
    expect(cell!.char).toBe(" ");
    expect(cell!.fg).toBe(ANSIColor.White);
    expect(cell!.bg).toBe(ANSIColor.Black);
  });

  it("setCell and getCell work", () => {
    const grid = new CharacterGrid(10, 5);
    grid.setCell(2, 3, "X", ANSIColor.Red, ANSIColor.Blue);
    const cell = grid.getCell(2, 3);
    expect(cell).not.toBeNull();
    expect(cell!.char).toBe("X");
    expect(cell!.fg).toBe(ANSIColor.Red);
    expect(cell!.bg).toBe(ANSIColor.Blue);
  });

  it("setCell marks dirty", () => {
    const grid = new CharacterGrid(10, 5);
    grid.clearDirty();
    expect(grid.isDirty(2, 3)).toBe(false);
    grid.setCell(2, 3, "X", ANSIColor.Red, ANSIColor.Blue);
    expect(grid.isDirty(2, 3)).toBe(true);
  });

  it("clearDirty clears dirty flags", () => {
    const grid = new CharacterGrid(10, 5);
    grid.setCell(2, 3, "X", ANSIColor.Red, ANSIColor.Blue);
    expect(grid.isDirty(2, 3)).toBe(true);
    grid.clearDirty();
    expect(grid.isDirty(2, 3)).toBe(false);
  });

  it("markAllDirty marks all cells dirty", () => {
    const grid = new CharacterGrid(10, 5);
    grid.clearDirty();
    grid.markAllDirty();
    expect(grid.isDirty(0, 0)).toBe(true);
    expect(grid.isDirty(9, 4)).toBe(true);
    expect(grid.isDirty(5, 2)).toBe(true);
  });

  it("setCell with same values does NOT mark dirty (optimization)", () => {
    const grid = new CharacterGrid(10, 5);
    grid.setCell(2, 3, "X", ANSIColor.Red, ANSIColor.Blue);
    grid.clearDirty();
    grid.setCell(2, 3, "X", ANSIColor.Red, ANSIColor.Blue);
    expect(grid.isDirty(2, 3)).toBe(false);
  });

  it("fill sets all cells", () => {
    const grid = new CharacterGrid(10, 5);
    grid.fill("█", ANSIColor.Green, ANSIColor.Yellow);
    const cell1 = grid.getCell(0, 0);
    const cell2 = grid.getCell(9, 4);
    expect(cell1!.char).toBe("█");
    expect(cell1!.fg).toBe(ANSIColor.Green);
    expect(cell1!.bg).toBe(ANSIColor.Yellow);
    expect(cell2!.char).toBe("█");
    expect(cell2!.fg).toBe(ANSIColor.Green);
    expect(cell2!.bg).toBe(ANSIColor.Yellow);
  });

  it("fill marks all cells dirty", () => {
    const grid = new CharacterGrid(10, 5);
    grid.clearDirty();
    grid.fill("█", ANSIColor.Green, ANSIColor.Yellow);
    expect(grid.isDirty(0, 0)).toBe(true);
    expect(grid.isDirty(9, 4)).toBe(true);
  });

  it("clear resets to space/white/black", () => {
    const grid = new CharacterGrid(10, 5);
    grid.fill("█", ANSIColor.Green, ANSIColor.Yellow);
    grid.clear();
    const cell = grid.getCell(5, 2);
    expect(cell!.char).toBe(" ");
    expect(cell!.fg).toBe(ANSIColor.White);
    expect(cell!.bg).toBe(ANSIColor.Black);
  });

  it("clear marks all cells dirty", () => {
    const grid = new CharacterGrid(10, 5);
    grid.clearDirty();
    grid.clear();
    expect(grid.isDirty(0, 0)).toBe(true);
    expect(grid.isDirty(9, 4)).toBe(true);
  });

  it("drawText writes string horizontally", () => {
    const grid = new CharacterGrid(10, 5);
    grid.drawText(1, 2, "Hello", ANSIColor.Cyan);
    expect(grid.getCell(1, 2)!.char).toBe("H");
    expect(grid.getCell(2, 2)!.char).toBe("e");
    expect(grid.getCell(3, 2)!.char).toBe("l");
    expect(grid.getCell(4, 2)!.char).toBe("l");
    expect(grid.getCell(5, 2)!.char).toBe("o");
    expect(grid.getCell(1, 2)!.fg).toBe(ANSIColor.Cyan);
  });

  it("drawText with custom background", () => {
    const grid = new CharacterGrid(10, 5);
    grid.drawText(1, 2, "Hi", ANSIColor.White, ANSIColor.Red);
    expect(grid.getCell(1, 2)!.bg).toBe(ANSIColor.Red);
    expect(grid.getCell(2, 2)!.bg).toBe(ANSIColor.Red);
  });

  it("drawText defaults to black background", () => {
    const grid = new CharacterGrid(10, 5);
    grid.drawText(1, 2, "Hi", ANSIColor.White);
    expect(grid.getCell(1, 2)!.bg).toBe(ANSIColor.Black);
  });

  it("out-of-bounds getCell returns null", () => {
    const grid = new CharacterGrid(10, 5);
    expect(grid.getCell(-1, 0)).toBeNull();
    expect(grid.getCell(0, -1)).toBeNull();
    expect(grid.getCell(10, 0)).toBeNull();
    expect(grid.getCell(0, 5)).toBeNull();
  });

  it("out-of-bounds setCell is safe (no crash)", () => {
    const grid = new CharacterGrid(10, 5);
    expect(() => {
      grid.setCell(-1, 0, "X", ANSIColor.Red, ANSIColor.Blue);
      grid.setCell(0, -1, "X", ANSIColor.Red, ANSIColor.Blue);
      grid.setCell(10, 0, "X", ANSIColor.Red, ANSIColor.Blue);
      grid.setCell(0, 5, "X", ANSIColor.Red, ANSIColor.Blue);
    }).not.toThrow();
  });

  it("out-of-bounds isDirty returns false", () => {
    const grid = new CharacterGrid(10, 5);
    expect(grid.isDirty(-1, 0)).toBe(false);
    expect(grid.isDirty(10, 0)).toBe(false);
  });

  it("drawText partial out-of-bounds writes only visible portion", () => {
    const grid = new CharacterGrid(10, 5);
    grid.drawText(8, 2, "Hello", ANSIColor.Cyan);
    expect(grid.getCell(8, 2)!.char).toBe("H");
    expect(grid.getCell(9, 2)!.char).toBe("e");
    // Characters beyond width should not crash
    expect(grid.getCell(10, 2)).toBeNull();
  });
});
