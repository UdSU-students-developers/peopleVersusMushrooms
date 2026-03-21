import CONFIG from "../../config";
import Mediator from "../Mediator/Mediator";
import Store from "./Store";

const { TRIGGERS } = CONFIG.MEDIATOR;

const useStore = (mediator: Mediator) => {
    const store = new Store();
    mediator.set(TRIGGERS.SET_STORE, ({ name, value }: { name: string, value: any }) => store.set(name, value));
    mediator.set(TRIGGERS.GET_STORE, (name: string) => store.get(name));
    mediator.set(TRIGGERS.CLEAR_STORE, (name: string) => store.clear(name));
    return store;
}

export default useStore;