import { TUser, TMessages, TMessage } from "../Server/types";

type TData = {
    token: string | null;
    user: TUser | null;
    messages: TMessages;
    guid: string | null;
    [key: string]: any;
}

class Store {
    messages: TMessages = [];
    chatHash: string = 'empty chat hash';

    private data: TData = {
        token: null,
        user: null,
        guid: null,
        messages: []
    }

    set(name: string, value: any) {
        this.data[name] = value;
    }

    get(name: string) {
        return this.data[name];
    }

    clear(name: string) {
        this.data[name] = null;
    }

    getMessages(): TMessages {
        return this.messages;
    }
}

export default Store;