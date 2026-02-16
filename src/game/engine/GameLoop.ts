export type TickCallback = (tickNumber: number) => void;

export class GameLoop {
  private _isRunning = false;
  private _isPaused = false;
  private tickNumber = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastTickTime = 0;
  private onTick: TickCallback;
  private readonly TICK_INTERVAL_MS = 1000;
  private readonly MAX_CATCHUP_TICKS = 10;

  constructor(onTick: TickCallback) {
    this.onTick = onTick;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get currentTick(): number {
    return this.tickNumber;
  }

  start(): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this._isPaused = false;
    this.lastTickTime = Date.now();
    this.scheduleNext();
  }

  stop(): void {
    this._isRunning = false;
    this._isPaused = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  pause(): void {
    if (!this._isRunning || this._isPaused) return;
    this._isPaused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  resume(): void {
    if (!this._isRunning || !this._isPaused) return;
    this._isPaused = false;
    this.lastTickTime = Date.now();
    this.scheduleNext();
  }

  private scheduleNext(): void {
    if (!this._isRunning || this._isPaused) return;

    const now = Date.now();
    const elapsed = now - this.lastTickTime;
    const ticksToProcess = Math.min(
      Math.floor(elapsed / this.TICK_INTERVAL_MS),
      this.MAX_CATCHUP_TICKS
    );

    if (ticksToProcess > 0) {
      for (let i = 0; i < ticksToProcess; i++) {
        this.tickNumber++;
        this.onTick(this.tickNumber);
      }
      this.lastTickTime += ticksToProcess * this.TICK_INTERVAL_MS;
    }

    const nextTickIn = this.TICK_INTERVAL_MS - (Date.now() - this.lastTickTime);
    this.timer = setTimeout(() => this.scheduleNext(), Math.max(0, nextTickIn));
  }
}
