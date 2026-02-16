// src/game/engine/EventBus.ts
import type { GameEvent, GameEventOfType } from "@shared/events";

type Handler<T extends GameEvent["type"]> = (event: GameEventOfType<T>) => void;
type AnyHandler = (event: GameEvent) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler<any>>>();
  private anyHandlers = new Set<AnyHandler>();

  on<T extends GameEvent["type"]>(type: T, handler: Handler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => { this.handlers.get(type)?.delete(handler); };
  }

  onAny(handler: AnyHandler): () => void {
    this.anyHandlers.add(handler);
    return () => { this.anyHandlers.delete(handler); };
  }

  emit(event: GameEvent): void {
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        handler(event);
      }
    }
    for (const handler of this.anyHandlers) {
      handler(event);
    }
  }

  clear(): void {
    this.handlers.clear();
    this.anyHandlers.clear();
  }
}
