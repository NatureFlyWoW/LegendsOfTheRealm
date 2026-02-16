// src/renderer/ascii/Palette.ts
export enum ANSIColor {
  Black = 0, Red = 1, Green = 2, Yellow = 3,
  Blue = 4, Magenta = 5, Cyan = 6, White = 7,
  BrightBlack = 8, BrightRed = 9, BrightGreen = 10, BrightYellow = 11,
  BrightBlue = 12, BrightMagenta = 13, BrightCyan = 14, BrightWhite = 15,
}

export type RGB = [number, number, number];

export const ANSI_COLORS: RGB[] = [
  [0, 0, 0],       // 0: Black
  [170, 0, 0],     // 1: Red
  [0, 170, 0],     // 2: Green
  [170, 85, 0],    // 3: Yellow (dark)
  [0, 0, 170],     // 4: Blue
  [170, 0, 170],   // 5: Magenta
  [0, 170, 170],   // 6: Cyan
  [170, 170, 170], // 7: White
  [85, 85, 85],    // 8: Bright Black (Dark Grey)
  [255, 85, 85],   // 9: Bright Red
  [85, 255, 85],   // 10: Bright Green
  [255, 255, 85],  // 11: Bright Yellow
  [85, 85, 255],   // 12: Bright Blue
  [255, 85, 255],  // 13: Bright Magenta
  [85, 255, 255],  // 14: Bright Cyan
  [255, 255, 255], // 15: Bright White
];

const QUALITY_COLORS: Record<string, ANSIColor> = {
  common: ANSIColor.White,
  uncommon: ANSIColor.Green,
  rare: ANSIColor.BrightBlue,
  epic: ANSIColor.BrightMagenta,
  legendary: ANSIColor.BrightYellow,
};

export function getQualityColor(quality: string): ANSIColor {
  return QUALITY_COLORS[quality] ?? ANSIColor.White;
}

export function colorToHex(color: ANSIColor): string {
  const [r, g, b] = ANSI_COLORS[color];
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function colorToCSS(color: ANSIColor): string {
  const [r, g, b] = ANSI_COLORS[color];
  return `rgb(${r}, ${g}, ${b})`;
}
