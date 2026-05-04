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

        this.mediator.subscribe(START_GAME, (data: TScene) => this.eventStartGame(data));
        this.mediator.subscribe(UPDATE_SCENE, (data: TScene) => this.eventUpdateScene(data));
        this.mediator.subscribe(RELIEF_LOADED, (data: TRelief) => this.eventReliefLoaded(data));
    }
    
    get () {
        return {
            scene: this.scene
        }
    }


    //EVENTS
    eventStartGame(data: TScene): void {
        console.log('Данные о игре: ', data);
        this.scene = data;
    }

    eventUpdateScene(data: TScene): void {
        console.log('[updateScene] map length:', data?.map?.relief?.length, 'map[0]:', data?.map?.relief?.[0]?.slice(0,5));
        
        if (this.scene && (!data.map || !data.map.relief || data.map.relief.length === 0)) {
            data = { ...data, map: this.scene.map };
        }
        this.scene = data;
    }

    eventReliefLoaded(data: TRelief): void {
        console.log("Relief loaded");
        this.relief = data;
    }
}