import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import settings = require("electron-settings");

// TODO More screen resolutions
const defaultResolution = { width: 1366, height: 768 };
const screenResolution = {
    width: (<any>settings.get("graphics.resolution", defaultResolution))["width"] as number,
    height: (<any>settings.get("graphics.resolution", defaultResolution))["height"] as number
};

let playerWindow: Electron.BrowserWindow;

app.on("ready", () => {
    console.log(settings.file());
  
    playerWindow = new BrowserWindow({
        frame: settings.get("graphics.frame", false) as boolean,
        width: screenResolution.width,
        height: screenResolution.height,
    });

    playerWindow.loadFile(path.join(__dirname, "../player.html"));

    ipcMain.on("request-screen-resolution", (event: any, args: any) => {
        event.returnValue = screenResolution;
    });

    playerWindow.on("closed", () => {
        playerWindow = null;
    });
});

app.on("window-all-closed", () => {
    app.quit();
});
