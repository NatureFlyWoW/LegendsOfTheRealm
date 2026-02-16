import { app, BrowserWindow, dialog } from "electron";
import { join } from "path";
import { SaveManager } from "@game/engine/SaveManager";
import { GameBridge } from "./ipc/gamebridge";
import { registerIpcHandlers } from "./ipc/handlers";

let gameBridge: GameBridge | null = null;
let saveManager: SaveManager | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
}

async function bootstrap(): Promise<void> {
  const win = createWindow();

  try {
    // Initialize save system
    saveManager = new SaveManager();
    const saves = saveManager.listSaves();

    let db;
    if (saves.length > 0) {
      // Open the first (most recent) save
      db = saveManager.openSave(saves[0]);
    } else {
      // Auto-create default save on first launch
      db = saveManager.createSave("Autosave");
    }

    // Boot game engine
    gameBridge = new GameBridge(db, win);
    await gameBridge.initialize();

    // Register IPC handlers
    registerIpcHandlers(saveManager, gameBridge);

    // Start the game loop
    gameBridge.getGameLoop().start();
  } catch (error) {
    dialog.showErrorBox(
      "Failed to start game",
      `The game engine failed to initialize:\n${(error as Error).message}`
    );
    app.quit();
  }
}

app.whenReady().then(bootstrap);

app.on("window-all-closed", async () => {
  if (gameBridge) {
    await gameBridge.shutdown();
  }
  if (saveManager) {
    saveManager.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
