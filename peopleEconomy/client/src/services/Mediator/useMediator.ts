import { MEDIATOR, EMESSAGES } from "../../config";
import Mediator, { TNamesArray } from "./Mediator";

const useMediator = () => {
    const ALL_EVENTS: TNamesArray = { ...MEDIATOR.EVENTS };
    Object.keys(EMESSAGES as TNamesArray).forEach(key =>
        //@ts-ignore 
        ALL_EVENTS[key] = EMESSAGES[key]
    );

    const mediator = new Mediator({ 
        EVENTS: ALL_EVENTS, 
        TRIGGERS: MEDIATOR.TRIGGERS 
    });

    return mediator;
}

export default useMediator;