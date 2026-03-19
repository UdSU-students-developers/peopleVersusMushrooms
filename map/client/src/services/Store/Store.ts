import { TUser } from "../server/types";
import Mediator from '../Mediator/Mediator';
import { MEDIATOR } from "../../config";

const TOKEN = 'token';

class Store {
    user: TUser | null = null;
    mediator: Mediator;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.initMediator();
    }

    private initMediator(): void {
        this.mediator.subscribe(MEDIATOR.EVENTS.LOGIN, (data) => this.handleLogin(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.REGISTRATION, (data) => this.handleRegistration(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.LOGOUT, (data) => this.handleLogout(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.SHOW_ERROR, (message: string) => this.handleError(message));

        this.mediator.set(MEDIATOR.TRIGGERS.GET_TOKEN, () => this.getToken());
    }

    handleLogin(data: TUser): void {
        console.log(data);
    }

    handleRegistration(data: TUser): void {
        console.log(data);
    }

    handleLogout(data: TUser): void {
        console.log(data);
    }

    handleError(message: string): void {
        console.log(message);
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN);
    }
}

export default Store;