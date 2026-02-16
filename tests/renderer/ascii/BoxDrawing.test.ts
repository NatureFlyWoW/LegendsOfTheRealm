import { describe, it, expect } from "vitest";
import { drawBorder, drawTitle } from "@renderer/ascii/BoxDrawing";
import { CharacterGrid } from "@renderer/ascii/CharacterGrid";
import { ANSIColor } from "@renderer/ascii/Palette";

describe("BoxDrawing", () => {
  describe("drawBorder", () => {
    it("single border places correct corner chars", () => {
      const grid = new CharacterGrid(10, 10);
      drawBorder(grid, 1, 1, 5, 5, "single");

      expect(grid.getCell(1, 1)!.char).toBe("┌"); // top-left
      expect(grid.getCell(5, 1)!.char).toBe("┐"); // top-right
      expect(grid.getCell(1, 5)!.char).toBe("└"); // bottom-left
      expect(grid.getCell(5, 5)!.char).toBe("┘"); // bottom-right
    });

    it("single border places correct edge chars", () => {
      const grid = new CharacterGrid(10, 10);
      drawBorder(grid, 1, 1, 5, 5, "single");

      // Horizontal edges
      expect(grid.getCell(2, 1)!.char).toBe("─");
      expect(grid.getCell(3, 1)!.char).toBe("─");
      expect(grid.getCell(4, 1)!.char).toBe("─");
      expect(grid.getCell(2, 5)!.char).toBe("─");

      // Vertical edges
      expect(grid.getCell(1, 2)!.char).toBe("│");
      expect(grid.getCell(1, 3)!.char).toBe("│");
      expect(grid.getCell(1, 4)!.char).toBe("│");
      expect(grid.getCell(5, 2)!.char).toBe("│");
    });

    it("double border uses correct chars", () => {
      const grid = new CharacterGrid(10, 10);
      drawBorder(grid, 1, 1, 5, 5, "double");

      expect(grid.getCell(1, 1)!.char).toBe("╔"); // top-left
      expect(grid.getCell(5, 1)!.char).toBe("╗"); // top-right
      expect(grid.getCell(1, 5)!.char).toBe("╚"); // bottom-left
      expect(grid.getCell(5, 5)!.char).toBe("╝"); // bottom-right
      expect(grid.getCell(2, 1)!.char).toBe("═"); // horizontal
      expect(grid.getCell(1, 2)!.char).toBe("║"); // vertical
    });

    it("minimum size 2x2 works", () => {
      const grid = new CharacterGrid(10, 10);
      drawBorder(grid, 1, 1, 2, 2, "single");

      expect(grid.getCell(1, 1)!.char).toBe("┌");
      expect(grid.getCell(2, 1)!.char).toBe("┐");
      expect(grid.getCell(1, 2)!.char).toBe("└");
      expect(grid.getCell(2, 2)!.char).toBe("┘");
    });

    it("size < 2 does nothing (no crash)", () => {
      const grid = new CharacterGrid(10, 10);
      grid.clear();

      expect(() => {
        drawBorder(grid, 1, 1, 1, 5, "single");
        drawBorder(grid, 1, 1, 5, 1, "single");
        drawBorder(grid, 1, 1, 0, 0, "single");
      }).not.toThrow();

      // Verify grid is still clear (no border drawn)
      expect(grid.getCell(1, 1)!.char).toBe(" ");
    });

    it("applies foreground and background colors", () => {
      const grid = new CharacterGrid(10, 10);
      drawBorder(grid, 1, 1, 5, 5, "single", ANSIColor.Cyan, ANSIColor.Blue);

      expect(grid.getCell(1, 1)!.fg).toBe(ANSIColor.Cyan);
      expect(grid.getCell(1, 1)!.bg).toBe(ANSIColor.Blue);
      expect(grid.getCell(2, 1)!.fg).toBe(ANSIColor.Cyan);
      expect(grid.getCell(2, 1)!.bg).toBe(ANSIColor.Blue);
    });

    it("defaults to white on black", () => {
      const grid = new CharacterGrid(10, 10);
      drawBorder(grid, 1, 1, 5, 5);

      expect(grid.getCell(1, 1)!.fg).toBe(ANSIColor.White);
      expect(grid.getCell(1, 1)!.bg).toBe(ANSIColor.Black);
    });

    it("handles partial out-of-bounds gracefully", () => {
      const grid = new CharacterGrid(10, 10);
      expect(() => {
        drawBorder(grid, 8, 8, 5, 5, "single"); // Extends beyond grid
      }).not.toThrow();
    });
  });

  describe("drawTitle", () => {
    it("centers text in border", () => {
      const grid = new CharacterGrid(20, 10);
      drawBorder(grid, 0, 0, 20, 5, "single");
      drawTitle(grid, 0, 0, 20, "Title");

      // "Title" is 5 chars, width is 20
      // Center position: (20 - 5) / 2 = 7.5 -> 7
      expect(grid.getCell(7, 0)!.char).toBe("T");
      expect(grid.getCell(8, 0)!.char).toBe("i");
      expect(grid.getCell(9, 0)!.char).toBe("t");
      expect(grid.getCell(10, 0)!.char).toBe("l");
      expect(grid.getCell(11, 0)!.char).toBe("e");
    });

    it("truncates long titles", () => {
      const grid = new CharacterGrid(10, 10);
      drawTitle(grid, 0, 0, 10, "VeryLongTitleText");

      // maxLen = 10 - 4 = 6, truncated to "VeryLo"
      // Center position: (10 - 6) / 2 = 2
      expect(grid.getCell(2, 0)!.char).toBe("V");
      expect(grid.getCell(7, 0)!.char).toBe("o"); // Last char of truncated text
      expect(grid.getCell(8, 0)!.char).toBe(" "); // Should not extend beyond maxLen
    });

    it("applies foreground and background colors", () => {
      const grid = new CharacterGrid(20, 10);
      drawTitle(grid, 0, 0, 20, "Title", ANSIColor.Yellow, ANSIColor.Red);

      expect(grid.getCell(7, 0)!.fg).toBe(ANSIColor.Yellow);
      expect(grid.getCell(7, 0)!.bg).toBe(ANSIColor.Red);
    });

    it("defaults to bright white on black", () => {
      const grid = new CharacterGrid(20, 10);
      drawTitle(grid, 0, 0, 20, "Title");

      expect(grid.getCell(7, 0)!.fg).toBe(ANSIColor.BrightWhite);
      expect(grid.getCell(7, 0)!.bg).toBe(ANSIColor.Black);
    });

    it("handles empty title", () => {
      const grid = new CharacterGrid(20, 10);
      expect(() => {
        drawTitle(grid, 0, 0, 20, "");
      }).not.toThrow();
    });

    it("handles narrow width", () => {
      const grid = new CharacterGrid(20, 10);
      expect(() => {
        drawTitle(grid, 0, 0, 3, "Title"); // maxLen = -1
      }).not.toThrow();
    });
  });

  describe("integration", () => {
    it("draws a complete bordered panel with title", () => {
      const grid = new CharacterGrid(30, 10);
      drawBorder(grid, 0, 0, 30, 10, "double", ANSIColor.BrightBlue);
      drawTitle(grid, 0, 0, 30, "Character Sheet", ANSIColor.BrightYellow);

      // Verify border corners
      expect(grid.getCell(0, 0)!.char).toBe("╔");
      expect(grid.getCell(29, 0)!.char).toBe("╗");
      expect(grid.getCell(0, 9)!.char).toBe("╚");
      expect(grid.getCell(29, 9)!.char).toBe("╝");

      // Verify title is present (centered)
      expect(grid.getCell(7, 0)!.char).toBe("C");
      expect(grid.getCell(8, 0)!.char).toBe("h");
    });
  });
});
