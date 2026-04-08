import CONFIG from "../../config";
import Mediator from "../Mediator/Mediator";
import Store from "./Store";

const { TRIGGERS } = CONFIG.MEDIATOR;

const useStore = (mediator: Mediator) => {
    const store = new Store();
    const { SET_STORE, GET_STORE, CLEAR_STORE } = mediator.getTriggerTypes();

    mediator.set(SET_STORE, ({ name, value }: { name: string, value: any }) => 
        store.set(name, value)
    );
    mediator.set(GET_STORE, (name: string) => 
        store.get(name)
    );
    mediator.set(CLEAR_STORE, (name: string) => 
        store.clear(name)
    );

    return store;
}

export default useStore;