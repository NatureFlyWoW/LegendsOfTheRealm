import { CharacterGrid } from "./CharacterGrid";
import { ANSIColor } from "./Palette";

export type BorderStyle = "single" | "double";

const SINGLE = { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" };
const DOUBLE = { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" };

export function drawBorder(
  grid: CharacterGrid,
  x: number,
  y: number,
  w: number,
  h: number,
  style: BorderStyle = "single",
  fg: ANSIColor = ANSIColor.White,
  bg: ANSIColor = ANSIColor.Black,
): void {
  if (w < 2 || h < 2) return;
  const chars = style === "double" ? DOUBLE : SINGLE;

  // Corners
  grid.setCell(x, y, chars.tl, fg, bg);
  grid.setCell(x + w - 1, y, chars.tr, fg, bg);
  grid.setCell(x, y + h - 1, chars.bl, fg, bg);
  grid.setCell(x + w - 1, y + h - 1, chars.br, fg, bg);

  // Horizontal edges
  for (let i = 1; i < w - 1; i++) {
    grid.setCell(x + i, y, chars.h, fg, bg);
    grid.setCell(x + i, y + h - 1, chars.h, fg, bg);
  }

  // Vertical edges
  for (let j = 1; j < h - 1; j++) {
    grid.setCell(x, y + j, chars.v, fg, bg);
    grid.setCell(x + w - 1, y + j, chars.v, fg, bg);
  }
}

export function drawTitle(
  grid: CharacterGrid,
  x: number,
  y: number,
  w: number,
  title: string,
  fg: ANSIColor = ANSIColor.BrightWhite,
  bg: ANSIColor = ANSIColor.Black,
): void {
  const maxLen = w - 4;
  const text = title.length > maxLen ? title.slice(0, maxLen) : title;
  const startX = x + Math.floor((w - text.length) / 2);
  grid.drawText(startX, y, text, fg, bg);
}
