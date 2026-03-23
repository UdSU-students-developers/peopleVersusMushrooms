import CONFIG from "../../config";
import Mediator, { TNamesArray } from "./Mediator";

const useMediator = (): Mediator => {
    const { MEDIATOR, SOCKET } = CONFIG;
    const { EVENTS, TRIGGERS } = MEDIATOR;

    const EVENTS_OVERLOAD: TNamesArray = {};

    Object.keys(EVENTS).forEach(key => {
        // @ts-ignore
        EVENTS_OVERLOAD[key] = EVENTS[key];
    });
    Object.keys(SOCKET).forEach(key => {
        // @ts-ignore
        EVENTS_OVERLOAD[key] = SOCKET[key];
    });

    return new Mediator({ 
        EVENTS: EVENTS_OVERLOAD, 
        TRIGGERS 
    });
}

export default useMediator;