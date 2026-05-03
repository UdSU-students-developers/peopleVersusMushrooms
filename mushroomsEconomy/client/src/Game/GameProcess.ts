import Server from "../services/Server/Server";
import Mediator from "../services/Mediator/Mediator";
import CONFIG from "../config";
import { TRelief, TScene } from "../services/Server/types";

const { START_GAME, UPDATE_SCENE, RELIEF_LOADED } = CONFIG.SOCKET;

export default class GameProcess {

    scene: TScene | null;
    relief: TRelief | null;
    server: Server;
    mediator: Mediator;

    constructor(server: Server, mediator: Mediator) {
        this.scene = null;
        this.relief = null;
        this.server = server;
        this.mediator = mediator;

        this.mediator.subscribe(START_GAME, (data: TScene) => this.startGame(data));
        this.mediator.subscribe(UPDATE_SCENE, (data: TScene) => this.updateScene(data));
        this.mediator.subscribe(RELIEF_LOADED, (data: TRelief) => this.reliefLoaded(data));
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

    reliefLoaded(data: TRelief): void {
        console.log("Relief loaded");
        this.relief = data;
    }
}