import { ipcRenderer } from "electron";
import * as path from "path";
import fs = require('fs');

const gamedataPath = path.join(__dirname, "../gamedata.json");

let obj = JSON.parse(fs.readFileSync(gamedataPath, "utf8")) as any;
const gameName : string = obj.gameName;
const homePageImage : string = obj.homePageImage;
const enableSaving : boolean = obj.enableSaving;
const entranceId : string = obj.entranceId;
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
const screenResolution = ipcRenderer.sendSync("request-screen-resolution") as { width: number; height: number };
videoPlayer.setAttribute("style", `top: 0; left: 0; width: 100%; height: 95%;`);

videoPlayer.play();

function playPause() {
    if (videoPlayer.paused) 
        videoPlayer.play(); 
    else 
        videoPlayer.pause(); 
}
