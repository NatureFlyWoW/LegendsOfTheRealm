import { CharacterGrid } from "./CharacterGrid";
import { colorToCSS, ANSIColor } from "./Palette";

export interface RendererConfig {
  ctx: CanvasRenderingContext2D;
  grid: CharacterGrid;
  cellWidth: number;
  cellHeight: number;
  fontFamily?: string;
}

/**
 * Renders a CharacterGrid to a CanvasRenderingContext2D using a
 * dirty-cell loop: only cells that have changed since the last
 * frame are redrawn.
 */
export class AsciiRenderer {
  readonly cellWidth: number;
  readonly cellHeight: number;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly grid: CharacterGrid;
  private readonly fontFamily: string;

  constructor(config: RendererConfig) {
    this.ctx = config.ctx;
    this.grid = config.grid;
    this.cellWidth = config.cellWidth;
    this.cellHeight = config.cellHeight;
    this.fontFamily = config.fontFamily ?? "monospace";

    // Set up the font once — it doesn't change between frames
    this.ctx.font = `${this.cellHeight}px ${this.fontFamily}`;
    this.ctx.textBaseline = "top";
  }

  /** Total pixel width of the rendered grid. */
  get pixelWidth(): number {
    return this.grid.width * this.cellWidth;
  }

  /** Total pixel height of the rendered grid. */
  get pixelHeight(): number {
    return this.grid.height * this.cellHeight;
  }

  /**
   * Renders one frame. Only dirty cells are drawn.
   * After rendering, all dirty flags are cleared.
   */
  renderFrame(): void {
    const { ctx, grid, cellWidth, cellHeight } = this;

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (!grid.isDirty(x, y)) continue;

        const cell = grid.getCell(x, y);
        if (cell === null) continue;

        const px = x * cellWidth;
        const py = y * cellHeight;

        // Draw background rect
        ctx.fillStyle = colorToCSS(cell.bg);
        ctx.fillRect(px, py, cellWidth, cellHeight);

        // Draw glyph (skip for space characters — bg-only optimization)
        if (cell.char !== " ") {
          ctx.fillStyle = colorToCSS(cell.fg);
          ctx.fillText(cell.char, px, py);
        }
      }
    }

    grid.clearDirty();
  }
}
