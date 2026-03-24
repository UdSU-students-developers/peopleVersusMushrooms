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
    // @ts-ignore
    EVENTS_OVERLOAD['ERROR'] = 'ERROR';
    // @ts-ignore
    EVENTS_OVERLOAD['USER_REGISTERED'] = 'USER_REGISTERED';
    // @ts-ignore
    EVENTS_OVERLOAD['USER_LOGGED_OUT'] = 'USER_LOGGED_OUT';
    // @ts-ignore
    EVENTS_OVERLOAD['LOGIN'] = 'LOGIN';

    return new Mediator({ 
        EVENTS: EVENTS_OVERLOAD, 
        TRIGGERS 
    });
}

export default useMediator;