import { TUser } from "../server/types";

type TData = {
    token: string | null;
    user: TUser | null;
}

class Store {
    private data: TData = {
        token: null,
        user: null
    }

    set(name: string, value: any) {
        // @ts-ignore
        this.data[name] = value;
    }

    get(name: string) {
        // @ts-ignore
        return this.data[name];
    }

    clear(name: string) {
        // @ts-ignore
        this.data[name] = null;
    }
}

export default Store;