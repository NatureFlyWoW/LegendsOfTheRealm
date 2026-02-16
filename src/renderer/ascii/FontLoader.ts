/**
 * FontLoader — CP437 glyph mapping and rendering providers.
 *
 * Provides:
 *  - Complete 256-entry CP437 to Unicode lookup table
 *  - FallbackGlyphProvider using Canvas fillText with a monospace font
 *  - BitmapFontLoader for extracting glyphs from a PNG sprite sheet
 */

// ---------------------------------------------------------------------------
// GlyphProvider interface
// ---------------------------------------------------------------------------

export interface GlyphProvider {
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly glyphCount: number;
  drawGlyph(
    ctx: CanvasRenderingContext2D,
    charCode: number,
    x: number,
    y: number,
    fgColor: string,
  ): void;
}

// ---------------------------------------------------------------------------
// CP437 lookup table (256 entries)
// ---------------------------------------------------------------------------

/**
 * Complete CP437 to Unicode mapping.
 *
 * Sources:
 *  - Index 0 is mapped to space (display convention)
 *  - 1-31: CP437 graphical characters (smileys, card suits, arrows, etc.)
 *  - 32-126: Standard ASCII printable range
 *  - 127: ⌂ (house)
 *  - 128-255: Extended CP437 (accented letters, box drawing, math symbols, etc.)
 */
const CP437_TABLE: string[] = [
  // 0x00-0x0F
  " ",      "\u263A", "\u263B", "\u2665", "\u2666", "\u2663", "\u2660", "\u2022",
  "\u25D8", "\u25CB", "\u25D9", "\u2642", "\u2640", "\u266A", "\u266B", "\u263C",
  // 0x10-0x1F
  "\u25BA", "\u25C4", "\u2195", "\u203C", "\u00B6", "\u00A7", "\u25AC", "\u21A8",
  "\u2191", "\u2193", "\u2192", "\u2190", "\u221F", "\u2194", "\u25B2", "\u25BC",
  // 0x20-0x2F (ASCII printable)
  " ", "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/",
  // 0x30-0x3F
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?",
  // 0x40-0x4F
  "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
  // 0x50-0x5F
  "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_",
  // 0x60-0x6F
  "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o",
  // 0x70-0x7F
  "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "\u2302",
  // 0x80-0x8F (accented letters)
  "\u00C7", "\u00FC", "\u00E9", "\u00E2", "\u00E4", "\u00E0", "\u00E5", "\u00E7",
  "\u00EA", "\u00EB", "\u00E8", "\u00EF", "\u00EE", "\u00EC", "\u00C4", "\u00C5",
  // 0x90-0x9F
  "\u00C9", "\u00E6", "\u00C6", "\u00F4", "\u00F6", "\u00F2", "\u00FB", "\u00F9",
  "\u00FF", "\u00D6", "\u00DC", "\u00A2", "\u00A3", "\u00A5", "\u20A7", "\u0192",
  // 0xA0-0xAF
  "\u00E1", "\u00ED", "\u00F3", "\u00FA", "\u00F1", "\u00D1", "\u00AA", "\u00BA",
  "\u00BF", "\u2310", "\u00AC", "\u00BD", "\u00BC", "\u00A1", "\u00AB", "\u00BB",
  // 0xB0-0xBF (shade blocks and box drawing)
  "\u2591", // B0: ░ light shade
  "\u2592", // B1: ▒ medium shade
  "\u2593", // B2: ▓ dark shade
  "\u2502", // B3: │ box drawings light vertical
  "\u2524", // B4: ┤ box drawings light vertical and left
  "\u2561", // B5: ╡ box drawings vertical single and left double
  "\u2562", // B6: ╢ box drawings vertical double and left single
  "\u2556", // B7: ╖ box drawings down double and left single
  "\u2555", // B8: ╕ box drawings down single and left double
  "\u2563", // B9: ╣ box drawings double vertical and left
  "\u2551", // BA: ║ box drawings double vertical
  "\u2557", // BB: ╗ box drawings double down and left
  "\u255D", // BC: ╝ box drawings double up and left
  "\u255C", // BD: ╜ box drawings up double and left single
  "\u255B", // BE: ╛ box drawings up single and left double
  "\u2510", // BF: ┐ box drawings light down and left
  // 0xC0-0xCF (box drawing continued)
  "\u2514", // C0: └ box drawings light up and right
  "\u2534", // C1: ┴ box drawings light up and horizontal
  "\u252C", // C2: ┬ box drawings light down and horizontal
  "\u251C", // C3: ├ box drawings light vertical and right
  "\u2500", // C4: ─ box drawings light horizontal
  "\u253C", // C5: ┼ box drawings light vertical and horizontal
  "\u255E", // C6: ╞ box drawings vertical single and right double
  "\u255F", // C7: ╟ box drawings vertical double and right single
  "\u255A", // C8: ╚ box drawings double up and right
  "\u2554", // C9: ╔ box drawings double down and right
  "\u2569", // CA: ╩ box drawings double up and horizontal
  "\u2566", // CB: ╦ box drawings double down and horizontal
  "\u2560", // CC: ╠ box drawings double vertical and right
  "\u2550", // CD: ═ box drawings double horizontal
  "\u256C", // CE: ╬ box drawings double vertical and horizontal
  "\u2567", // CF: ╧ box drawings up single and horizontal double
  // 0xD0-0xDF (box drawing end, block elements, Greek)
  "\u2568", // D0: ╨ box drawings up double and horizontal single
  "\u2564", // D1: ╤ box drawings down single and horizontal double
  "\u2565", // D2: ╥ box drawings down double and horizontal single
  "\u2559", // D3: ╙ box drawings up double and right single
  "\u2558", // D4: ╘ box drawings up single and right double
  "\u2552", // D5: ╒ box drawings down single and right double
  "\u2553", // D6: ╓ box drawings down double and right single
  "\u256B", // D7: ╫ box drawings vertical double and horizontal single
  "\u256A", // D8: ╪ box drawings vertical single and horizontal double
  "\u2518", // D9: ┘ box drawings light up and left
  "\u250C", // DA: ┌ box drawings light down and right
  "\u2588", // DB: █ full block
  "\u2584", // DC: ▄ lower half block
  "\u258C", // DD: ▌ left half block
  "\u2590", // DE: ▐ right half block
  "\u2580", // DF: ▀ upper half block
  // 0xE0-0xEF (Greek letters and math)
  "\u03B1", // E0: α greek small letter alpha
  "\u00DF", // E1: ß latin small letter sharp s
  "\u0393", // E2: Γ greek capital letter gamma
  "\u03C0", // E3: π greek small letter pi
  "\u03A3", // E4: Σ greek capital letter sigma
  "\u03C3", // E5: σ greek small letter sigma
  "\u00B5", // E6: µ micro sign
  "\u03C4", // E7: τ greek small letter tau
  "\u03A6", // E8: Φ greek capital letter phi
  "\u0398", // E9: Θ greek capital letter theta
  "\u03A9", // EA: Ω greek capital letter omega
  "\u03B4", // EB: δ greek small letter delta
  "\u221E", // EC: ∞ infinity
  "\u03C6", // ED: φ greek small letter phi
  "\u03B5", // EE: ε greek small letter epsilon
  "\u2229", // EF: ∩ intersection
  // 0xF0-0xFF (math and misc symbols)
  "\u2261", // F0: ≡ identical to
  "\u00B1", // F1: ± plus-minus sign
  "\u2265", // F2: ≥ greater-than or equal to
  "\u2264", // F3: ≤ less-than or equal to
  "\u2320", // F4: ⌠ top half integral
  "\u2321", // F5: ⌡ bottom half integral
  "\u00F7", // F6: ÷ division sign
  "\u2248", // F7: ≈ almost equal to
  "\u00B0", // F8: ° degree sign
  "\u2219", // F9: ∙ bullet operator
  "\u00B7", // FA: · middle dot
  "\u221A", // FB: √ square root
  "\u207F", // FC: ⁿ superscript latin small letter n
  "\u00B2", // FD: ² superscript two
  "\u25A0", // FE: ■ black square
  "\u00A0", // FF: non-breaking space
];

// ---------------------------------------------------------------------------
// Reverse mapping (Unicode char -> CP437 index)
// ---------------------------------------------------------------------------

const CHAR_TO_CP437 = new Map<string, number>();

// Build from forward table. Later indices overwrite earlier ones,
// so for duplicates (index 0 and 32 both map to space) the higher index wins.
// This means space -> 32, which is the canonical ASCII position.
for (let i = 0; i < CP437_TABLE.length; i++) {
  CHAR_TO_CP437.set(CP437_TABLE[i], i);
}

// ---------------------------------------------------------------------------
// FontLoader static class
// ---------------------------------------------------------------------------

export const FontLoader = {
  /**
   * Maps a CP437 index (0-255) to its Unicode character.
   */
  cp437ToChar(index: number): string {
    if (index < 0 || index >= CP437_TABLE.length) return " ";
    return CP437_TABLE[index];
  },

  /**
   * Reverse maps a Unicode character to its CP437 index.
   * Returns 63 ('?') for characters not in the CP437 set.
   */
  charToCP437(char: string): number {
    return CHAR_TO_CP437.get(char) ?? 63;
  },

  /**
   * Creates a fallback GlyphProvider that renders glyphs using Canvas fillText
   * with a monospace font. Used when no bitmap font is loaded.
   */
  createFallback(fontSize: number, fontFamily: string): GlyphProvider {
    const cellHeight = fontSize;
    const cellWidth = Math.round(fontSize * 0.6);
    const fontString = `${fontSize}px ${fontFamily}`;

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
        ctx.font = fontString;
        ctx.fillStyle = fgColor;
        ctx.textBaseline = "top";
        const ch = CP437_TABLE[charCode] ?? " ";
        ctx.fillText(ch, x, y);
      },
    };
  },

  /**
   * Loads a bitmap font from a PNG sprite sheet arranged as a grid of glyphs.
   *
   * The image must contain glyphs arranged in a grid with `glyphsPerRow` columns
   * and `glyphsPerCol` rows. Each glyph occupies a uniformly-sized cell.
   *
   * Returns a GlyphProvider that draws glyphs by blitting from the sprite sheet
   * using an offscreen canvas for color tinting.
   */
  loadBitmapFont(
    imageSrc: string,
    glyphsPerRow = 16,
    glyphsPerCol = 16,
  ): Promise<GlyphProvider> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const glyphW = Math.floor(img.width / glyphsPerRow);
        const glyphH = Math.floor(img.height / glyphsPerCol);
        const totalGlyphs = glyphsPerRow * glyphsPerCol;

        // Create an offscreen canvas to extract and tint glyph data
        const offscreen = document.createElement("canvas");
        offscreen.width = img.width;
        offscreen.height = img.height;
        const offCtx = offscreen.getContext("2d")!;
        offCtx.drawImage(img, 0, 0);

        resolve({
          cellWidth: glyphW,
          cellHeight: glyphH,
          glyphCount: totalGlyphs,
          drawGlyph(
            ctx: CanvasRenderingContext2D,
            charCode: number,
            x: number,
            y: number,
            fgColor: string,
          ): void {
            if (charCode < 0 || charCode >= totalGlyphs) return;

            const srcCol = charCode % glyphsPerRow;
            const srcRow = Math.floor(charCode / glyphsPerRow);
            const srcX = srcCol * glyphW;
            const srcY = srcRow * glyphH;

            // Create a temporary canvas for color-tinted glyph
            const tmp = document.createElement("canvas");
            tmp.width = glyphW;
            tmp.height = glyphH;
            const tmpCtx = tmp.getContext("2d")!;

            // Draw the glyph region
            tmpCtx.drawImage(
              offscreen,
              srcX, srcY, glyphW, glyphH,
              0, 0, glyphW, glyphH,
            );

            // Tint: use source-in compositing to replace color while keeping alpha
            tmpCtx.globalCompositeOperation = "source-in";
            tmpCtx.fillStyle = fgColor;
            tmpCtx.fillRect(0, 0, glyphW, glyphH);

            // Draw the tinted glyph to the target context
            ctx.drawImage(tmp, x, y);
          },
        });
      };
      img.onerror = () => {
        reject(new Error(`Failed to load bitmap font: ${imageSrc}`));
      };
      img.src = imageSrc;
    });
  },
};
