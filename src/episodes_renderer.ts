import { ipcRenderer, remote } from "electron";

class Entrance {
    text: string;
    sceneId: string;
}

const entrances: Entrance[] = ipcRenderer.sendSync("get-entrances");



