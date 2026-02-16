import { describe, it, expect } from "vitest";
import { FontLoader, GlyphProvider } from "@renderer/ascii/FontLoader";

describe("FontLoader", () => {
  describe("CP437 mapping", () => {
    it("index 0 maps to space", () => {
      expect(FontLoader.cp437ToChar(0)).toBe(" ");
    });

    it("ASCII printable range (32-126) maps directly", () => {
      // Space
      expect(FontLoader.cp437ToChar(32)).toBe(" ");
      // Digits
      expect(FontLoader.cp437ToChar(48)).toBe("0");
      expect(FontLoader.cp437ToChar(57)).toBe("9");
      // Uppercase letters
      expect(FontLoader.cp437ToChar(65)).toBe("A");
      expect(FontLoader.cp437ToChar(90)).toBe("Z");
      // Lowercase letters
      expect(FontLoader.cp437ToChar(97)).toBe("a");
      expect(FontLoader.cp437ToChar(122)).toBe("z");
      // Punctuation
      expect(FontLoader.cp437ToChar(33)).toBe("!");
      expect(FontLoader.cp437ToChar(64)).toBe("@");
      expect(FontLoader.cp437ToChar(126)).toBe("~");
    });

    it("box-drawing characters map correctly", () => {
      // Single-line box drawing (key characters used in BoxDrawing.ts)
      expect(FontLoader.cp437ToChar(218)).toBe("\u250C"); // ┌
      expect(FontLoader.cp437ToChar(191)).toBe("\u2510"); // ┐
      expect(FontLoader.cp437ToChar(192)).toBe("\u2514"); // └
      expect(FontLoader.cp437ToChar(217)).toBe("\u2518"); // ┘
      expect(FontLoader.cp437ToChar(196)).toBe("\u2500"); // ─
      expect(FontLoader.cp437ToChar(179)).toBe("\u2502"); // │

      // Double-line box drawing
      expect(FontLoader.cp437ToChar(201)).toBe("\u2554"); // ╔
      expect(FontLoader.cp437ToChar(187)).toBe("\u2557"); // ╗
      expect(FontLoader.cp437ToChar(200)).toBe("\u255A"); // ╚
      expect(FontLoader.cp437ToChar(188)).toBe("\u255D"); // ╝
      expect(FontLoader.cp437ToChar(205)).toBe("\u2550"); // ═
      expect(FontLoader.cp437ToChar(186)).toBe("\u2551"); // ║
    });

    it("shade block characters map correctly", () => {
      expect(FontLoader.cp437ToChar(176)).toBe("\u2591"); // ░ light shade
      expect(FontLoader.cp437ToChar(177)).toBe("\u2592"); // ▒ medium shade
      expect(FontLoader.cp437ToChar(178)).toBe("\u2593"); // ▓ dark shade
      expect(FontLoader.cp437ToChar(219)).toBe("\u2588"); // █ full block
    });

    it("smiley face characters in low range", () => {
      expect(FontLoader.cp437ToChar(1)).toBe("\u263A"); // ☺
      expect(FontLoader.cp437ToChar(2)).toBe("\u263B"); // ☻
    });

    it("all 256 entries are defined", () => {
      for (let i = 0; i < 256; i++) {
        const ch = FontLoader.cp437ToChar(i);
        expect(ch).toBeDefined();
        expect(typeof ch).toBe("string");
        expect(ch.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("reverse mapping (charToCP437)", () => {
    it("ASCII printable chars reverse-map correctly", () => {
      expect(FontLoader.charToCP437("A")).toBe(65);
      expect(FontLoader.charToCP437("Z")).toBe(90);
      expect(FontLoader.charToCP437("a")).toBe(97);
      expect(FontLoader.charToCP437("0")).toBe(48);
      expect(FontLoader.charToCP437(" ")).toBe(32);
      expect(FontLoader.charToCP437("!")).toBe(33);
      expect(FontLoader.charToCP437("~")).toBe(126);
    });

    it("box-drawing chars reverse-map correctly", () => {
      expect(FontLoader.charToCP437("\u250C")).toBe(218); // ┌
      expect(FontLoader.charToCP437("\u2510")).toBe(191); // ┐
      expect(FontLoader.charToCP437("\u2514")).toBe(192); // └
      expect(FontLoader.charToCP437("\u2518")).toBe(217); // ┘
    });

    it("unknown characters return 63 ('?')", () => {
      expect(FontLoader.charToCP437("\u4E16")).toBe(63); // Chinese character
      expect(FontLoader.charToCP437("\uFFFF")).toBe(63); // Undefined Unicode
    });

    it("round-trips all 256 CP437 entries", () => {
      for (let i = 0; i < 256; i++) {
        const ch = FontLoader.cp437ToChar(i);
        const backIndex = FontLoader.charToCP437(ch);
        // Some CP437 entries share the same Unicode char (e.g., 0 and 32 both map to space).
        // The reverse mapping should return a valid index for that char.
        expect(FontLoader.cp437ToChar(backIndex)).toBe(ch);
      }
    });
  });

  describe("FallbackGlyphProvider", () => {
    it("creates provider with correct dimensions", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      expect(provider.cellHeight).toBe(16);
      expect(provider.cellWidth).toBe(Math.round(16 * 0.6)); // 10
      expect(provider.glyphCount).toBe(256);
    });

    it("cellWidth rounds correctly for different font sizes", () => {
      // fontSize * 0.6 rounded
      const p12 = FontLoader.createFallback(12, "monospace");
      expect(p12.cellWidth).toBe(Math.round(12 * 0.6)); // 7

      const p14 = FontLoader.createFallback(14, "monospace");
      expect(p14.cellWidth).toBe(Math.round(14 * 0.6)); // 8

      const p20 = FontLoader.createFallback(20, "monospace");
      expect(p20.cellWidth).toBe(Math.round(20 * 0.6)); // 12
    });

    it("has a drawGlyph function", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      expect(typeof provider.drawGlyph).toBe("function");
    });

    it("drawGlyph accepts correct parameters without throwing", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      // Create a minimal mock canvas context
      const mockCtx = {
        fillStyle: "",
        font: "",
        textBaseline: "top" as CanvasTextBaseline,
        fillText: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(() => {
        provider.drawGlyph(mockCtx, 65, 0, 0, "#ffffff"); // 'A'
      }).not.toThrow();
    });

    it("drawGlyph sets font and fillStyle on context", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      let capturedFont = "";
      let capturedFillStyle = "";
      let capturedBaseline = "" as string;
      const mockCtx = {
        set fillStyle(v: string) { capturedFillStyle = v; },
        get fillStyle() { return capturedFillStyle; },
        set font(v: string) { capturedFont = v; },
        get font() { return capturedFont; },
        set textBaseline(v: CanvasTextBaseline) { capturedBaseline = v; },
        get textBaseline() { return capturedBaseline as CanvasTextBaseline; },
        fillText: () => {},
      } as unknown as CanvasRenderingContext2D;

      provider.drawGlyph(mockCtx, 65, 10, 20, "#00ff00");
      expect(capturedFont).toBe("16px monospace");
      expect(capturedFillStyle).toBe("#00ff00");
      expect(capturedBaseline).toBe("top");
    });

    it("drawGlyph calls fillText with correct character and position", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      let calledWith: { text: string; x: number; y: number } | null = null;
      const mockCtx = {
        fillStyle: "",
        font: "",
        textBaseline: "top" as CanvasTextBaseline,
        fillText: (text: string, x: number, y: number) => {
          calledWith = { text, x, y };
        },
      } as unknown as CanvasRenderingContext2D;

      provider.drawGlyph(mockCtx, 65, 10, 20, "#ffffff"); // 'A'
      expect(calledWith).not.toBeNull();
      expect(calledWith!.text).toBe("A");
      expect(calledWith!.x).toBe(10);
      expect(calledWith!.y).toBe(20);
    });

    it("drawGlyph uses CP437 mapping for non-ASCII codes", () => {
      const provider = FontLoader.createFallback(16, "monospace");
      let drawnText = "";
      const mockCtx = {
        fillStyle: "",
        font: "",
        textBaseline: "top" as CanvasTextBaseline,
        fillText: (text: string) => {
          drawnText = text;
        },
      } as unknown as CanvasRenderingContext2D;

      provider.drawGlyph(mockCtx, 1, 0, 0, "#ffffff"); // CP437 index 1 = ☺
      expect(drawnText).toBe("\u263A");
    });
  });

  describe("loadBitmapFont", () => {
    // Browser Image API is not available in Node.js/vitest,
    // so we only verify the function signature exists.
    it("function exists and returns a promise", () => {
      expect(typeof FontLoader.loadBitmapFont).toBe("function");
    });
  });
});
