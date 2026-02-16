import { ipcMain } from "electron";
import type { SaveManager } from "@game/engine/SaveManager";
import type { GameLoop } from "@game/engine/GameLoop";

export function registerIpcHandlers(saveManager: SaveManager, gameLoop: GameLoop): void {
  ipcMain.handle("save:create", async (_event, name: string) => {
    try {
      saveManager.createSave(name);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  });

  ipcMain.handle("save:open", async (_event, path: string) => {
    try {
      saveManager.openSave(path);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  });

  ipcMain.handle("save:list", async () => {
    return saveManager.listSaves();
  });

  ipcMain.handle("save:backup", async (_event, path: string) => {
    try {
      const backupPath = saveManager.backupSave(path);
      return { success: true, path: backupPath };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  });

  ipcMain.handle("game:start", async () => {
    gameLoop.start();
    return { success: true };
  });

  ipcMain.handle("game:stop", async () => {
    gameLoop.stop();
    return { success: true };
  });

  ipcMain.handle("game:pause", async () => {
    gameLoop.pause();
    return { success: true };
  });

  ipcMain.handle("game:resume", async () => {
    gameLoop.resume();
    return { success: true };
  });
}
