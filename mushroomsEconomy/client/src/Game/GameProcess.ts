import Server from "../services/Server/Server";
import Mediator from "../services/Mediator/Mediator";
import CONFIG from "../config";
import { TScene } from "../services/Server/types";

const { START_GAME, UPDATE_SCENE } = CONFIG.SOCKET;

export default class GameProcess {

    scene: TScene | null;
    server: Server;
    mediator: Mediator;

    constructor(server: Server, mediator: Mediator) {
        this.scene = null;
        this.server = server;
        this.mediator = mediator;

        this.mediator.subscribe(START_GAME, (data: TScene) => this.startGame(data));
        this.mediator.subscribe(UPDATE_SCENE, (data: TScene) => this.updateScene(data));
    }
    
    get () {
        return {
            scene: this.scene
        }
    }

    startGame(data: TScene): void {
        console.log('Iya startanUUUlsOO!!1', data);
    }

    updateScene(data: TScene): void {
        this.scene = data;
        //console.log('update!', data);
    }
}