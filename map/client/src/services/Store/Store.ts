import { TUser } from "../server/types";
import Mediator from '../Mediator/Mediator';
import { EMESSAGES } from "../../config";

const TOKEN = 'token';

class Store {
    user: TUser | null = null;
    mediator: Mediator;

    constructor(mediator: Mediator) {
        this.mediator = mediator;
        this.initMediator();
    }

    private initMediator(): void {
        this.mediator.subscribe(EMESSAGES.LOGIN, this.handleLogin.bind(this));
        this.mediator.subscribe(EMESSAGES.REGISTRATION, this.handleRegistration.bind(this));
        this.mediator.subscribe(EMESSAGES.LOGOUT, this.handleLogout.bind(this));
        this.mediator.set(EMESSAGES.GET_TOKEN, () => this.getToken());
    }

    private handleLogin(data: TUser): void {
        console.log(data);
    }

    private handleRegistration(data: TUser): void {
        console.log(data);
    }

    private handleLogout(data: TUser): void {
        console.log(data);
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN);
    }
}

export default Store;