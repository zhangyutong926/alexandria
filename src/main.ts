import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import settings = require("electron-settings");

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const defaultResolution = { width: 1366, height: 768 };
const screenResolution = {
    width: (<any>settings.get("graphics.resolution", defaultResolution))["width"] as number,
    height: (<any>settings.get("graphics.resolution", defaultResolution))["height"] as number
};
const frame = settings.get("graphics.frame", false) as boolean;

let playerWindow: Electron.BrowserWindow;

ipcMain.on("log", (event: any, args: any) => {
    console.log(args);
});
ipcMain.on("get-game-config", (event: any, args: any) => {
    event.returnValue = {
        screenResolution: screenResolution,
        isDebugMode: settings.get("developer.debugMode", false) as boolean,
        gameLanguage: settings.get("gameplay.language", "english") as string
    };
});
ipcMain.on("quit", () => {
    app.quit();
});

console.log("Settings file path: " + settings.file().trim());

app.on("ready", () => {
    playerWindow = new BrowserWindow({
        frame: frame,
        width: screenResolution.width,
        height: screenResolution.height,
        useContentSize: true
    });
    playerWindow.setMenu(null);
    playerWindow.setResizable(false);
    playerWindow.loadFile(path.join(__dirname, "../player.html"));
    playerWindow.on("closed", () => {
        playerWindow = null;
    });
});

app.on("window-all-closed", () => {
    app.quit();
});
