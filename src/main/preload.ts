import { contextBridge, ipcRenderer } from "electron";

const api = {
  // Save management
  createSave: (name: string) => ipcRenderer.invoke("save:create", name),
  openSave: (path: string) => ipcRenderer.invoke("save:open", path),
  listSaves: () => ipcRenderer.invoke("save:list"),
  backupSave: (path: string) => ipcRenderer.invoke("save:backup", path),

  // Game loop
  startGame: () => ipcRenderer.invoke("game:start"),
  stopGame: () => ipcRenderer.invoke("game:stop"),
  pauseGame: () => ipcRenderer.invoke("game:pause"),
  resumeGame: () => ipcRenderer.invoke("game:resume"),

  // State queries
  getGameState: () => ipcRenderer.invoke("state:get"),

  // Events from main
  onTick: (callback: (tick: number) => void) => {
    const handler = (_event: unknown, tick: number) => callback(tick);
    ipcRenderer.on("game:tick", handler);
    return () => ipcRenderer.removeListener("game:tick", handler);
  },

  // App info
  ping: () => "pong",
};

contextBridge.exposeInMainWorld("api", api);

export type GameAPI = typeof api;
