import CONFIG from "../../config";
import Mediator, { TNamesArray } from "./Mediator";

const useMediator = (): Mediator => {
    const { MEDIATOR, SOCKET } = CONFIG;

    const EVENTS_OVERLOAD: TNamesArray = {
        ...(MEDIATOR.EVENTS as TNamesArray),
        ...(SOCKET as TNamesArray),
    };

    return new Mediator({ 
        EVENTS: EVENTS_OVERLOAD, 
        TRIGGERS: MEDIATOR.TRIGGERS as TNamesArray
    });
}

export default useMediator;