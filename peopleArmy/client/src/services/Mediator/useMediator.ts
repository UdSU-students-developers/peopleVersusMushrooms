import CONFIG from "../../config";
import Mediator, { TNamesArray } from "./Mediator";

const { MEDIATOR, SOCKETS } = CONFIG;

const useMediator = () => {
    const { EVENTS, TRIGGERS } = MEDIATOR;

    const EVENT_SOCKETS: TNamesArray = {};
    // @ts-ignore
    Object.keys(EVENTS).forEach((key: string) => EVENT_SOCKETS[key] = EVENTS[key]);
    // @ts-ignore
    Object.keys(SOCKETS).forEach((key: string) => EVENT_SOCKETS[key] = SOCKETS[key]);

    return new Mediator({ EVENTS: EVENT_SOCKETS, TRIGGERS });
}

export default useMediator;