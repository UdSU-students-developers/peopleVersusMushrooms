import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LobbyMenu from './LobbyMenu';
import { MediatorContext, ServerContext } from '../../App';

jest.mock('../../components/Button/Button', () => ({
    __esModule: true,
    default: ({ onClick, text, variant, className, isDisabled }: any) => (
        <button 
            onClick={onClick} 
            className={className} 
            data-variant={variant}
            disabled={isDisabled}
        >
            {text}
        </button>
    ),
}));

jest.mock('../../config', () => ({
    MEDIATOR: {
        TRIGGERS: {
            GET_STORE: 'GET_STORE',
            SET_STORE: 'SET_STORE',
        },
    },
    SOCKET: {
        CREATE_LOBBY: 'CREATE_LOBBY',
        GET_LOBBIES: 'GET_LOBBIES',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        SET_READY: 'SET_READY',
        START_GAME: 'START_GAME',
    },
}));

interface MockLobby {
    lobbyGuid: string;
    lobbyName: string;
    playersGuids: {
        spectator: string | null;
        peopleArmy: string | null;
        peopleEconomy: string | null;
        mushroomsArmy: string | null;
        mushroomsEconomy: string | null;
        mapGuid: string | null;
    };
    playersIsReady: {
        spectator: boolean;
        peopleArmy: boolean;
        peopleEconomy: boolean;
        mushroomsArmy: boolean;
        mushroomsEconomy: boolean;
    };
}

interface MockUser {
    name: string;
    guid: string;
}

interface MockMediator {
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
    get: jest.Mock;
    getEventTypes: jest.Mock;
    call: jest.Mock;
}

interface MockServer {
    createLobby: jest.Mock;
    getLobbies: jest.Mock;
    joinToLobby: jest.Mock;
    setReady: jest.Mock;
    startGame: jest.Mock;
    dropFromLobby: jest.Mock;
}

const createMockMediator = (user: MockUser | null = null, lobby: MockLobby | null = null, lobbies: MockLobby[] = []): MockMediator => {
    const subscribe = jest.fn();
    const unsubscribe = jest.fn();
    const call = jest.fn();
    const getEventTypes = jest.fn(() => ({
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        START_GAME: 'START_GAME',
    }));
    
    const get = jest.fn((trigger: string, name: string) => {
        if (trigger === 'GET_STORE' && name === 'user') return user;
        if (trigger === 'GET_STORE' && name === 'lobby') return lobby;
        if (trigger === 'GET_STORE' && name === 'lobbies') return lobbies;
        return null;
    });
    
    return { subscribe, unsubscribe, get, getEventTypes, call };
};

const createMockServer = (): MockServer => ({
    createLobby: jest.fn(),
    getLobbies: jest.fn(),
    joinToLobby: jest.fn(),
    setReady: jest.fn(),
    startGame: jest.fn(),
    dropFromLobby: jest.fn(),
});

describe('LobbyMenu', () => {
    let mockServer: MockServer;
    let mockMediator: MockMediator;
    const mockSetPage = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockServer = createMockServer();
        mockMediator = createMockMediator({ name: 'TestPlayer', guid: 'player-guid' });
    });

    const renderLobbyMenu = (user: MockUser | null = { name: 'TestPlayer', guid: 'player-guid' }, lobby: MockLobby | null = null, lobbies: MockLobby[] = []) => {
        mockMediator = createMockMediator(user, lobby, lobbies);
        
        const { MediatorContext, ServerContext } = require('../../App');
        
        return render(
            <ServerContext.Provider value={mockServer as any}>
                <MediatorContext.Provider value={mockMediator as any}>
                    <LobbyMenu setPage={mockSetPage} />
                </MediatorContext.Provider>
            </ServerContext.Provider>
        );
    };

    test('отображает заголовок лобби', () => {
        renderLobbyMenu();
        
        expect(screen.getByText('Лобби')).toBeInTheDocument();
    });

    test('отображает имя пользователя', () => {
        renderLobbyMenu({ name: 'TestPlayer', guid: 'player-guid' });
        
        expect(screen.getByText('Игрок: TestPlayer')).toBeInTheDocument();
    });

    test('отображает поле ввода для создания лобби', () => {
        renderLobbyMenu();
        
        expect(screen.getByPlaceholderText('Название лобби')).toBeInTheDocument();
    });

    test('отображает кнопку создания лобби', () => {
        renderLobbyMenu();
        
        expect(screen.getByText('Создать лобби')).toBeInTheDocument();
    });

    test('отображает кнопку обновления списка лобби', () => {
        renderLobbyMenu();
        
        expect(screen.getByText('Обновить')).toBeInTheDocument();
    });

    test('отображает список доступных лобби', () => {
        const lobbies: MockLobby[] = [
            {
                lobbyGuid: 'lobby-1',
                lobbyName: 'Test Lobby 1',
                playersGuids: {
                    spectator: null,
                    peopleArmy: null,
                    peopleEconomy: null,
                    mushroomsArmy: null,
                    mushroomsEconomy: null,
                    mapGuid: null,
                },
                playersIsReady: {
                    spectator: false,
                    peopleArmy: false,
                    peopleEconomy: false,
                    mushroomsArmy: false,
                    mushroomsEconomy: false,
                },
            },
        ];
        
        renderLobbyMenu({ name: 'TestPlayer', guid: 'player-guid' }, null, lobbies);
        
        expect(screen.getByText('Test Lobby 1')).toBeInTheDocument();
    });

    test('отображает сообщение об отсутствии лобби', () => {
        renderLobbyMenu();
        
        expect(screen.getByText('Нет доступных лобби')).toBeInTheDocument();
    });

    test('создаёт лобби при клике на кнопку', () => {
        renderLobbyMenu();
        
        const input = screen.getByPlaceholderText('Название лобби');
        fireEvent.change(input, { target: { value: 'New Lobby' } });
        
        fireEvent.click(screen.getByText('Создать лобби'));
        
        expect(mockServer.createLobby).toHaveBeenCalledWith('New Lobby');
    });

    test('не создаёт лобби с пустым названием', () => {
        renderLobbyMenu();
        
        fireEvent.click(screen.getByText('Создать лобби'));
        
        expect(mockServer.createLobby).not.toHaveBeenCalled();
    });

    test('вызывает getLobbies при клике на обновить', () => {
        renderLobbyMenu();
        
        fireEvent.click(screen.getByText('Обновить'));
        
        expect(mockServer.getLobbies).toHaveBeenCalled();
    });

    test('подписывается на события при монтировании', () => {
        renderLobbyMenu();
        
        expect(mockMediator.subscribe).toHaveBeenCalledWith('LOBBY_UPDATED', expect.any(Function));
        expect(mockMediator.subscribe).toHaveBeenCalledWith('LOBBIES_LIST_UPDATED', expect.any(Function));
        expect(mockMediator.subscribe).toHaveBeenCalledWith('START_GAME', expect.any(Function));
    });

    test('отписывается от событий при размонтировании', () => {
        const { unmount } = renderLobbyMenu();
        unmount();
        
        expect(mockMediator.unsubscribe).toHaveBeenCalledWith('LOBBY_UPDATED', expect.any(Function));
        expect(mockMediator.unsubscribe).toHaveBeenCalledWith('LOBBIES_LIST_UPDATED', expect.any(Function));
    });
});