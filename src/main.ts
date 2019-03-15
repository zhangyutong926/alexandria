import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import settings = require("electron-settings");

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const defaultResolution = { width: 1366, height: 768 };
const dialogSize = { width: 400, height: 600 };
const screenResolution = {
    width: (<any>settings.get("graphics.resolution", defaultResolution))["width"] as number,
    height: (<any>settings.get("graphics.resolution", defaultResolution))["height"] as number
};
const frame = settings.get("graphics.frame", false) as boolean;

class Entrance {
    text: string;
    sceneId: string;
}

let playerWindow: Electron.BrowserWindow;
let episodesWindow: Electron.BrowserWindow;
let entrances: Entrance[];

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
ipcMain.on("quit-game", () => {
    app.quit();
});
ipcMain.on("open-episodes", (event: any, args: any) => {
    entrances = args;
    episodesWindow = new BrowserWindow({
        parent: playerWindow,
        modal: true,
        x: playerWindow.getBounds().x + playerWindow.getBounds().width / 2 - dialogSize.width / 2,
        y: playerWindow.getBounds().y + playerWindow.getBounds().height / 2 - dialogSize.height / 2,
        useContentSize: true,
        width: dialogSize.width,
        height: dialogSize.height,
        frame: false
    });
    episodesWindow.setResizable(false);
    episodesWindow.loadFile(path.join(__dirname, "../episodes.html"));
    episodesWindow.on("closed", () => {
        episodesWindow = null;
    });
});
ipcMain.on("get-entrances", (event: any, args: any) => {
    event.returnValue = entrances;
});
ipcMain.on("close-episodes", () => {

});
ipcMain.on("open-savings", () => {

});
ipcMain.on("close-savings", () => {

});
ipcMain.on("start-game", (event: any, args: any) => {
    playerWindow.webContents.send("start-game", args);
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
