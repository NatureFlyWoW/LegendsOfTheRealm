import { ANSIColor } from "./Palette";

export interface Cell {
  char: string;
  fg: ANSIColor;
  bg: ANSIColor;
}

export class CharacterGrid {
  readonly width: number;
  readonly height: number;
  private cells: Cell[];
  private dirty: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height);
    this.dirty = new Uint8Array(width * height);
    this.clear();
  }

  private idx(x: number, y: number): number {
    return y * this.width + x;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getCell(x: number, y: number): Cell | null {
    if (!this.inBounds(x, y)) return null;
    return this.cells[this.idx(x, y)];
  }

  setCell(x: number, y: number, char: string, fg: ANSIColor, bg: ANSIColor): void {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    const cell = this.cells[i];
    if (cell.char === char && cell.fg === fg && cell.bg === bg) return;
    cell.char = char;
    cell.fg = fg;
    cell.bg = bg;
    this.dirty[i] = 1;
  }

  isDirty(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return this.dirty[this.idx(x, y)] === 1;
  }

  clearDirty(): void {
    this.dirty.fill(0);
  }

  markAllDirty(): void {
    this.dirty.fill(1);
  }

  clear(): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = { char: " ", fg: ANSIColor.White, bg: ANSIColor.Black };
      this.dirty[i] = 1;
    }
  }

  fill(char: string, fg: ANSIColor, bg: ANSIColor): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = { char, fg, bg };
      this.dirty[i] = 1;
    }
  }

  drawText(x: number, y: number, text: string, fg: ANSIColor, bg?: ANSIColor): void {
    for (let i = 0; i < text.length; i++) {
      this.setCell(x + i, y, text[i], fg, bg ?? ANSIColor.Black);
    }
  }
}
