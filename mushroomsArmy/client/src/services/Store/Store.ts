import { TUser } from "../server/types";

type TData = {
    token: string | null;
    user: TUser | null;
    [key: string]: unknown;
}

class Store {
    private data: TData = {
        token: null,
        user: null
    }

    set(name: string, value: unknown) {
        this.data[name] = value;
    }

    get(name: string) {
        return this.data[name];
    }

    clear(name: string) {
        this.data[name] = null;
    }
}

export default Store;