import Server from "../services/Server/Server";
import Mediator from "../services/Mediator/Mediator";
import CONFIG from "../config";
import { TScene } from "../services/Server/types";

const { SET_SCENE } = CONFIG.MEDIATOR.TRIGGERS;

export default class GameProcess {

    scene: TScene | null;
    server: Server;
    mediator: Mediator;

    constructor(server: Server, mediator: Mediator) {
        this.scene = null;
        this.server = server;
        this.mediator = mediator;
        this.mediator.set(SET_SCENE, (data) => this.triggerSetScene(data));
        //this.getScene();
    }

    getScene(guid: string) {
        if (!guid) return;
        //this.scene = this.triggerSetScene(guid);
    }
    
    get () {
        return {
            scene: this.scene,
        }
    }

    triggerSetScene(scene: TScene) {

    }

}