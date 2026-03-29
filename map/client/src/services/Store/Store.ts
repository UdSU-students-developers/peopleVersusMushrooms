import { TUser } from "../server/types";
import Mediator from '../Mediator/Mediator';
import { MEDIATOR } from "../../config";

const TOKEN = 'token';

interface IPlayer {
    guid: number;
    name: string;
    status?: string;
}

interface IRoom {
    guid: number;
    roomName: string;
    creator: number;
    players: IPlayer[];
    maxPlayers: number;
    status: 'open' | 'closed' | 'started';
    gameState: 'waiting' | 'playing';
}

class Store {
    user: TUser | null = null;
    rooms: IRoom[] = [];
    currentRoom: IRoom | null = null;
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
        this.mediator.subscribe(MEDIATOR.EVENTS.CREATE_ROOM, (data) => this.handleCreateRoom(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.JOIN_TO_ROOM, (data) => this.handleJoinToRoom(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.LEAVE_ROOM, (data) => this.handleLeaveRoom(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.DROP_FROM_ROOM, (data) => this.handleDropFromRoom(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.START_GAME, (data) => this.handleStartGame(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.GET_ROOMS, (data) => this.handleGetRooms(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.ROOM_UPDATED, (data) => this.handleRoomUpdated(data));
        this.mediator.subscribe(MEDIATOR.EVENTS.ROOMS_LIST_UPDATED, (data) => this.handleRoomsListUpdated(data));

        this.mediator.set(MEDIATOR.TRIGGERS.GET_TOKEN, () => this.getToken());
        this.mediator.set(MEDIATOR.TRIGGERS.GET_CURRENT_ROOM, () => this.getCurrentRoom());
        this.mediator.set(MEDIATOR.TRIGGERS.GET_ROOMS_LIST, () => this.getRoomsList());
        this.mediator.set(MEDIATOR.TRIGGERS.GET_USER, () => this.getUser());
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
        this.currentRoom = null;
        this.rooms = [];
        localStorage.removeItem(TOKEN);
    }

    handleError(message: string): void {
        console.error('Error:', message);
    }

    handleCreateRoom(data: IRoom): void {
        console.log('Room created:', data);
        this.currentRoom = data;
        const existingIndex = this.rooms.findIndex(room => room.guid === data.guid);
        if (existingIndex === -1) {
            this.rooms.push(data);
        } else {
            this.rooms[existingIndex] = data;
        }
    }

    handleJoinToRoom(data: IRoom): void {
        console.log('Joined to room:', data);
        this.currentRoom = data;
        const index = this.rooms.findIndex(room => room.guid === data.guid);
        if (index !== -1) {
            this.rooms[index] = data;
        }
    }

    handleLeaveRoom(data: any): void {
        console.log('Left room:', data);
        this.currentRoom = null;
        this.mediator.call(MEDIATOR.EVENTS.GET_ROOMS, {});
    }

    handleDropFromRoom(data: IRoom): void {
        console.log('Player dropped from room:', data);
        if (this.currentRoom && this.currentRoom.guid === data.guid) {
            this.currentRoom = data;
        }
        const index = this.rooms.findIndex(room => room.guid === data.guid);
        if (index !== -1) {
            this.rooms[index] = data;
        }
    }

    handleStartGame(data: IRoom): void {
        console.log('Game started:', data);
        if (this.currentRoom && this.currentRoom.guid === data.guid) {
            this.currentRoom = data;
        }
        this.mediator.call(MEDIATOR.EVENTS.GAME_STARTED, data);
    }

    handleGetRooms(data: IRoom[]): void {
        console.log('Rooms list received:', data);
        this.rooms = data || [];
    }

    handleRoomUpdated(data: IRoom): void {
        console.log('Room updated:', data);
        if (this.currentRoom && this.currentRoom.guid === data.guid) {
            this.currentRoom = data;
        }
        const index = this.rooms.findIndex(room => room.guid === data.guid);
        if (index !== -1) {
            this.rooms[index] = data;
        }
    }

    handleRoomsListUpdated(data: IRoom[]): void {
        console.log('Rooms list updated:', data);
        this.rooms = data || [];
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN);
    }

    getCurrentRoom(): IRoom | null {
        return this.currentRoom;
    }

    getRoomsList(): IRoom[] {
        return this.rooms;
    }

    getUser(): TUser | null {
        return this.user;
    }

    isUserInRoom(): boolean {
        return this.currentRoom !== null;
    }

    isUserRoomCreator(): boolean {
        return this.currentRoom !== null && this.user !== null && this.currentRoom.creator === this.user.guid;
    }

    canStartGame(): boolean {
        return this.isUserRoomCreator() &&
            this.currentRoom !== null &&
            this.currentRoom.players.length === this.currentRoom.maxPlayers &&
            this.currentRoom.status === 'closed';
    }

    getPlayersInCurrentRoom(): IPlayer[] {
        return this.currentRoom ? this.currentRoom.players : [];
    }
}

export default Store;