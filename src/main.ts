import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import settings = require("electron-settings");

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// TODO More screen resolutions
const defaultResolution = { width: 1366, height: 768 };
const screenResolution = {
    width: (<any>settings.get("graphics.resolution", defaultResolution))["width"] as number,
    height: (<any>settings.get("graphics.resolution", defaultResolution))["height"] as number
};

let playerWindow: Electron.BrowserWindow;

ipcMain.on("log", (event: any, args: any) => {
    console.log(args);
});
ipcMain.on("is-debug-mode", (event: any, args: any) => {
    event.returnValue = settings.get("developer.debugMode", false) as boolean;
});
ipcMain.on("get-screen-resolution", (event: any, args: any) => {
    event.returnValue = screenResolution;
});

console.log("Settings file path: " + settings.file().trim());

app.on("ready", () => {
    playerWindow = new BrowserWindow({
        frame: settings.get("graphics.frame", false) as boolean,
        width: screenResolution.width,
        height: screenResolution.height,
        useContentSize: true
    });
    playerWindow.setResizable(false);
    playerWindow.loadFile(path.join(__dirname, "../player.html"));
    playerWindow.on("closed", () => {
        playerWindow = null;
    });
});

app.on("window-all-closed", () => {
    app.quit();
});
