import { ipcRenderer, remote, Menu, MenuItem } from "electron";
import * as path from "path";
import fs = require('fs');

function log(a: any) {
    ipcRenderer.sendSync("log", a);
}
const playerWindow: Electron.BrowserWindow = remote.getCurrentWindow();
const gameConfig = ipcRenderer.sendSync("get-game-config");
window.addEventListener("keyup", (e: KeyboardEvent) => {
    switch (e.key) {
        case "F12":
        case "f12": {
            if (gameConfig.isDebugMode) {
                playerWindow.webContents.openDevTools();
            }
            break;
        }
    }
});

const gamedataPath = path.join(__dirname, `../gamedata-${gameConfig.gameLanguage}.json`);
let obj = JSON.parse(fs.readFileSync(gamedataPath, "utf8")) as any;
const gameName: string = obj.gameName;
const homePageImage: string = obj.homePageImage;
const enableSaving: boolean = obj.enableSaving;
const entranceId: string = obj.entranceId;
class Option {
    text: string;
    jumpToId: string;
}
class Scene {
    video: string;
    options: Array<Option>;
    defaultOption: number;
    choosingTime: number;
}
const gameContent: { [id: string]: Scene; } = {};
for (const key in obj.gameContent) {
    gameContent[key] = {
        video: obj.gameContent[key].video,
        options: obj.gameContent[key].options.forEach((element: any) => {
            return {
                text: element.text,
                jumpToId: element.jumpToId
            }
        }),
        defaultOption: obj.gameContent[key].defaultOption,
        choosingTime: obj.gameContent[key].choosingTime
    }
}

const videoPlayer = document.getElementById("video_player") as HTMLVideoElement;
const imageDisplay = document.getElementById("image_display") as HTMLImageElement;
const controlContainer = document.getElementById("control_container");
const optionsContainer = document.getElementById("options_container");
const countdown = document.getElementById("countdown");
document.getElementById("scroll_left").addEventListener("click", () => {
    optionsContainer.scrollLeft -= 50;
});
document.getElementById("scroll_right").addEventListener("click", () => {
    optionsContainer.scrollLeft += 50;
});

function displayMainMenu() {

}

function displayScene(sceneId: string, time: number = 0) {

}

function displayOptions(scene: Scene, callback: (jumpToId: string) => any) {
    controlContainer.removeAttribute("hidden");
    while (optionsContainer.hasChildNodes()) {
        optionsContainer.removeChild(optionsContainer.lastChild);
    }
    for (const option of scene.options) {
        const h2Node = document.createElement("h2");
        h2Node.setAttribute("class", "option-text");
        h2Node.addEventListener("click", () => {
            controlContainer.setAttribute("hidden", "");
            callback(option.jumpToId);
        });
        h2Node.innerHTML = option.text;
        const divNode = document.createElement("div");
        divNode.setAttribute("class", "option");
        divNode.appendChild(h2Node);
        optionsContainer.appendChild(divNode);
    }
    let timeRemaining = scene.choosingTime;
    countdown.innerHTML = String(timeRemaining);
    const interval = setInterval(() => {
        timeRemaining--;
        countdown.innerHTML = String(timeRemaining);
        if (timeRemaining == 0) {
            controlContainer.setAttribute("hidden", "");
            callback(scene.options[scene.defaultOption].jumpToId);
        }
    }, 1000);
}

displayOptions({
    video: "./res/video2.mp4",
    options: [
        {
            text: "Option 1",
            jumpToId: "option1"
        },
        {
            text: "Option 2",
            jumpToId: "option2"
        }
    ],
    defaultOption: 0,
    choosingTime: 5
}, (jumpToId) => {
    alert(jumpToId);
});
