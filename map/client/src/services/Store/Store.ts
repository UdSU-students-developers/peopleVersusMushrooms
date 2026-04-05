import { TUser } from "../server/types";
import Mediator from '../Mediator/Mediator';
import { EMESSAGES, MEDIATOR } from "../../config";

const TOKEN = 'token';

interface IPlayer {
    guid: number;
    name: string;
    status?: string;
}

interface ILobby {
    guid: number;
    lobbyName: string;
    creator: number;
    players: IPlayer[];
    maxPlayers: number;
    status: 'open' | 'closed' | 'started';
    gameState: 'waiting' | 'playing';
}

class Store {
    user: TUser | null = null;
    lobbies: ILobby[] = [];
    currentLobby: ILobby | null = null;
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
        this.mediator.subscribe(EMESSAGES.CREATE_LOBBY, (data) => this.handleCreateLobby(data));
        this.mediator.subscribe(EMESSAGES.JOIN_TO_LOBBY, (data) => this.handleJoinToLobby(data));
        this.mediator.subscribe(EMESSAGES.LEAVE_LOBBY, (data) => this.handleLeaveLobby(data));
        this.mediator.subscribe(EMESSAGES.DROP_FROM_LOBBY, (data) => this.handleDropFromLobby(data));
        this.mediator.subscribe(EMESSAGES.START_GAME, (data) => this.handleStartGame(data));
        this.mediator.subscribe(EMESSAGES.GET_LOBBIES, (data) => this.handleGetLobbies(data));
        this.mediator.subscribe(EMESSAGES.LOBBY_UPDATED, (data) => this.handleLobbyUpdated(data));
        this.mediator.subscribe(EMESSAGES.LOBBIES_LIST_UPDATED, (data) => this.handleLobbiesListUpdated(data));

        this.mediator.set(MEDIATOR.TRIGGERS.GET_TOKEN, () => this.getToken());
        this.mediator.set(EMESSAGES.GET_CURRENT_LOBBY, () => this.getCurrentLobby());
        this.mediator.set(EMESSAGES.GET_LOBBIES_LIST, () => this.getLobbiesList());
        this.mediator.set(EMESSAGES.GET_USER, () => this.getUser());
    }

    handleLogin(data: TUser): void {
        console.log('Login:', data);
        this.user = data;
        if (data.token) {
            localStorage.setItem(TOKEN, data.token);
        }
    }

    handleRegistration(data: TUser): void {
        console.log('Registration:', data);
        this.user = data;
        if (data.token) {
            localStorage.setItem(TOKEN, data.token);
        }
    }

    handleLogout(data: TUser): void {
        console.log('Logout:', data);
        this.user = null;
        this.currentLobby = null;
        this.lobbies = [];
        localStorage.removeItem(TOKEN);
    }

    handleError(message: string): void {
        console.error('Error:', message);
    }

    handleCreateLobby(data: ILobby): void {
        console.log('Lobby created:', data);
        this.currentLobby = data;
        const existingIndex = this.lobbies.findIndex(lobby => lobby.guid === data.guid);
        if (existingIndex === -1) {
            this.lobbies.push(data);
        } else {
            this.lobbies[existingIndex] = data;
        }
    }

    handleJoinToLobby(data: ILobby): void {
        console.log('Joined to lobby:', data);
        this.currentLobby = data;
        const index = this.lobbies.findIndex(lobby => lobby.guid === data.guid);
        if (index !== -1) {
            this.lobbies[index] = data;
        }
    }

    handleLeaveLobby(data: any): void {
        console.log('Left lobby:', data);
        this.currentLobby = null;
        this.mediator.call(EMESSAGES.GET_LOBBIES, {});
    }

    handleDropFromLobby(data: ILobby): void {
        console.log('Player dropped from lobby:', data);
        if (this.currentLobby && this.currentLobby.guid === data.guid) {
            this.currentLobby = data;
        }
        const index = this.lobbies.findIndex(lobby => lobby.guid === data.guid);
        if (index !== -1) {
            this.lobbies[index] = data;
        }
    }

    handleStartGame(data: ILobby): void {
        console.log('Game started:', data);
        if (this.currentLobby && this.currentLobby.guid === data.guid) {
            this.currentLobby = data;
        }
        this.mediator.call(EMESSAGES.GAME_STARTED, data);
    }

    handleGetLobbies(data: ILobby[]): void {
        console.log('Lobbies list received:', data);
        this.lobbies = data || [];
    }

    handleLobbyUpdated(data: ILobby): void {
        console.log('Lobby updated:', data);
        if (this.currentLobby && this.currentLobby.guid === data.guid) {
            this.currentLobby = data;
        }
        const index = this.lobbies.findIndex(lobby => lobby.guid === data.guid);
        if (index !== -1) {
            this.lobbies[index] = data;
        }
    }

    handleLobbiesListUpdated(data: ILobby[]): void {
        console.log('Lobbies list updated:', data);
        this.lobbies = data || [];
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN);
    }

    getCurrentLobby(): ILobby | null {
        return this.currentLobby;
    }

    getLobbiesList(): ILobby[] {
        return this.lobbies;
    }

    getUser(): TUser | null {
        return this.user;
    }

    isUserInLobby(): boolean {
        return this.currentLobby !== null;
    }

    isUserLobbyCreator(): boolean {
        return this.currentLobby !== null && this.user !== null && this.currentLobby.creator === this.user.guid;
    }

    canStartGame(): boolean {
        return this.isUserLobbyCreator() &&
            this.currentLobby !== null &&
            this.currentLobby.players.length === this.currentLobby.maxPlayers &&
            this.currentLobby.status === 'closed';
    }

    getPlayersInCurrentLobby(): IPlayer[] {
        return this.currentLobby ? this.currentLobby.players : [];
    }
}

export default Store;