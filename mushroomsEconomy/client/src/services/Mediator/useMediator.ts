import CONFIG from "../../config";
import Mediator, { TNamesArray } from "./Mediator";

const { MEDIATOR, SOCKET } = CONFIG;

const useMediator = () => {
    const { EVENTS, TRIGGERS } = MEDIATOR;
    const EVENT_SOCKETS: TNamesArray = {};

    Object.assign(EVENT_SOCKETS, EVENTS as TNamesArray);
    Object.assign(EVENT_SOCKETS, SOCKET as TNamesArray);

    return new Mediator({ EVENTS: EVENT_SOCKETS, TRIGGERS });
}

export default useMediator;
