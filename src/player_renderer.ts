import { ipcRenderer, remote } from "electron";
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
class Option {
    text: string;
    jumpToId: string;
}
class Entrance {
    text: string;
    sceneId: string;
}
class Scene {
    video: string;
    options: Array<Option>;
    defaultOption: number;
    choosingTime: number;
}
const entrances = obj.entrances.map((element: any) => {
    return {
        text: element.text,
        sceneId: element.sceneId
    };
});
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
let currentSceneId: string;

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
                ipcRenderer.send("start-game", {
                    sceneId: entrances[0].sceneId,
                    time: 0
                });
            }
            break;
        }
    }
};

const title = document.getElementById("title");
const videoPlayer = document.getElementById("video_player") as HTMLVideoElement;
const imageDisplay = document.getElementById("image_display") as HTMLImageElement;
const controlContainer = document.getElementById("control_container");
const optionsContainer = document.getElementById("options_container");
const countdown = document.getElementById("countdown");
const optionsScrollLeft = document.getElementById("options_scroll_left");
const optionsScrollRight = document.getElementById("options_scroll_right");
const pressEnter = document.getElementById("press_enter");
const showMenu = document.getElementById("show_menu");
const skipScene = document.getElementById("skip_scene");
const leftTopControl = document.getElementById("left_top_control");
const rightTopControl = document.getElementById("right_top_control");
const mainMenuControl = document.getElementById("main_menu_control");
const openEpisodes = document.getElementById("open_episodes");

title.innerHTML = gameName;

optionsScrollLeft.onclick = () => {
    optionsContainer.scrollLeft -= 50;
};
optionsScrollRight.onclick = () => {
    optionsContainer.scrollLeft += 50;
};
showMenu.onclick = () => {
    displayMainMenu();
};
skipScene.onclick = () => {
    displayScene(currentSceneId, -1);
};
openEpisodes.onclick = () => {
    ipcRenderer.send("open-episodes", entrances);
};

let played: boolean = false;
function displayMainMenu() {
    if (played) {
        playerWindow.reload();
    }
    inMainMenu = true;
    videoPlayer.pause();
    videoPlayer.hidden = true;
    controlContainer.hidden = true;
    imageDisplay.hidden = false;
    imageDisplay.src = "./res/" + homePageImage;
    pressEnter.hidden = false;
    leftTopControl.hidden = true;
    rightTopControl.hidden = true;
    mainMenuControl.hidden = false;
}

let chosen: boolean = false;
let next: string;
function displayScene(sceneId: string, time: number = 0) {
    played = true;
    inMainMenu = false;
    pressEnter.hidden = true;
    controlContainer.hidden = true;
    imageDisplay.hidden = true;
    videoPlayer.hidden = false;
    leftTopControl.hidden = false;
    rightTopControl.hidden = false;
    mainMenuControl.hidden = true;

    if (sceneId == "") {
        displayMainMenu();
        return;
    }
    currentSceneId = sceneId;
    const scene = gameContent[sceneId];
    console.log(sceneId);
    videoPlayer.src = "./res/" + scene.video;
    videoPlayer.currentTime = time;
    if (time != -1) {
        chosen = false;
    }
    const callback = (jumpToId: string) => {
        console.log(videoPlayer.paused);
        if (videoPlayer.paused) {
            if (next != "" && jumpToId != "") {
                displayScene(jumpToId);
                return;
            } else {
                displayMainMenu();
                return;
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
            if (!inMainMenu) {
                console.log(videoPlayer.currentTime + videoPlayer.duration - scene.choosingTime);
                if (!displayingOptions && videoPlayer.currentTime >= videoPlayer.duration - scene.choosingTime) {
                    displayOptions(scene, callback);
                    displayingOptions = true;
                }
            } else {
                videoPlayer.pause();
            }
        };
    }
    videoPlayer.onloadedmetadata = () => {
        console.log(time + " " + videoPlayer.duration);
        if (time == -1 && !chosen) {
            videoPlayer.currentTime = videoPlayer.duration;
        } else if (time == -1 && chosen) {
            displayScene(next);
            return;
        }
        if (time < videoPlayer.duration && time != -1) {
            videoPlayer.play();
        } else if (time == -1 && scene.choosingTime != -1) {
            displayScene(scene.options[scene.defaultOption].jumpToId);
            return;
        }
    };
    videoPlayer.onended = () => {
        if (chosen) {
            if (next != "") {
                displayScene(next);
                return;
            } else {
                displayMainMenu();
                return;
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

ipcRenderer.on("start-game", (event: any, args: any) => {
    displayScene(args.sceneId, args.time);
});
