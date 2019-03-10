import { ipcRenderer, remote, Menu, MenuItem } from "electron";
import * as path from "path";
import fs = require('fs');

function log(a: any) {
    ipcRenderer.sendSync("log", a);
}
const playerWindow: Electron.BrowserWindow = remote.getCurrentWindow();
const gameConfig = ipcRenderer.sendSync("get-game-config");

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
        options: obj.gameContent[key].options.map((element: any) => {
            return {
                text: element.text,
                jumpToId: element.jumpToId
            }
        }),
        defaultOption: obj.gameContent[key].defaultOption,
        choosingTime: obj.gameContent[key].choosingTime
    }
}

let inMainMenu: boolean;
window.onkeyup = (e: KeyboardEvent) => {
    switch (e.key) {
        case "F12":
        case "f12": {
            if (gameConfig.isDebugMode) {
                playerWindow.webContents.openDevTools();
            }
            break;
        }
        case "Enter":
        case "enter": {
            if (inMainMenu) {
                displayScene(entranceId);
            }
            break;
        }
    }
};

const videoPlayer = document.getElementById("video_player") as HTMLVideoElement;
const imageDisplay = document.getElementById("image_display") as HTMLImageElement;
const controlContainer = document.getElementById("control_container");
const optionsContainer = document.getElementById("options_container");
const countdown = document.getElementById("countdown");
const optionsScrollLeft = document.getElementById("options_scroll_left");
const optionsScrollRight = document.getElementById("options_scroll_right");
const pressEnter = document.getElementById("press_enter");
optionsScrollLeft.onclick = () => {
    optionsContainer.scrollLeft -= 50;
};
optionsScrollRight.onclick = () => {
    optionsContainer.scrollLeft += 50;
};

function displayMainMenu() {
    inMainMenu = true;
    videoPlayer.pause();
    videoPlayer.hidden = true;
    controlContainer.hidden = true;
    imageDisplay.hidden = false;
    imageDisplay.src = "./res/" + homePageImage;
    pressEnter.hidden = false;
}

function displayScene(sceneId: string, time: number = 0) {
    inMainMenu = false;
    pressEnter.hidden = true;
    controlContainer.hidden = true;
    imageDisplay.hidden = true;
    videoPlayer.hidden = false;

    const scene = gameContent[sceneId];
    console.log(sceneId);
    videoPlayer.src = "./res/" + scene.video;
    videoPlayer.currentTime = time;
    let next: string;
    let chosen: boolean = false;
    const callback = (jumpToId: string) => {
        console.log(videoPlayer.ended);
        if (videoPlayer.ended) {
            if (next != "") {
                displayScene(jumpToId);
            } else {
                displayMainMenu();
            }
        } else {
            next = jumpToId;
            chosen = true;
        }
    };
    if (scene.choosingTime == -1) {
        displayOptions(scene, callback);
    } else {
        let displayingOptions = false;
        videoPlayer.ontimeupdate = () => {
            console.log(videoPlayer.currentTime + videoPlayer.duration - scene.choosingTime);
            if (!displayingOptions && videoPlayer.currentTime >= videoPlayer.duration - scene.choosingTime) {
                displayOptions(scene, callback);
                displayingOptions = true;
            }
        };
    }
    videoPlayer.onloadedmetadata = () => {
        console.log(time + " " + videoPlayer.duration);
        if (time < videoPlayer.duration) {
            videoPlayer.play();
        }
    };
    videoPlayer.onended = () => {
        if (chosen) {
            if (next != "") {
                displayScene(next);
            } else {
                displayMainMenu();
            }
        }
    };
}

function checkOverflow(el: HTMLElement) {
    const curOverflow = el.style.overflow;
    if (!curOverflow || curOverflow === "visible")
        el.style.overflow = "hidden";
    const isOverflowing = el.clientWidth < el.scrollWidth
        || el.clientHeight < el.scrollHeight;
    el.style.overflow = curOverflow;
    return isOverflowing;
}

function displayOptions(scene: Scene, callback: (jumpToId: string) => any) {
    controlContainer.hidden = false;
    while (optionsContainer.hasChildNodes()) {
        optionsContainer.removeChild(optionsContainer.lastChild);
    }
    let interval: NodeJS.Timeout;
    for (const option of scene.options) {
        const h2Node = document.createElement("h2");
        h2Node.setAttribute("class", "option-text");
        h2Node.onclick = () => {
            clearInterval(interval);
            controlContainer.hidden = true;
            callback(option.jumpToId);
        };
        h2Node.innerHTML = option.text;
        const divNode = document.createElement("div");
        divNode.setAttribute("class", "option");
        divNode.appendChild(h2Node);
        optionsContainer.appendChild(divNode);
    }
    optionsScrollLeft.hidden = optionsScrollRight.hidden = !checkOverflow(optionsContainer);
    if (scene.choosingTime == -1) {
        countdown.innerHTML = "";
    } else {
        let timeRemaining = scene.choosingTime;
        countdown.innerHTML = String(timeRemaining);
        interval = setInterval(() => {
            timeRemaining--;
            countdown.innerHTML = String(timeRemaining);
            if (timeRemaining == 0) {
                clearInterval(interval);
                controlContainer.hidden = true;
                callback(scene.options[scene.defaultOption].jumpToId);
            }
        }, 1000);
    }
}

displayMainMenu();
