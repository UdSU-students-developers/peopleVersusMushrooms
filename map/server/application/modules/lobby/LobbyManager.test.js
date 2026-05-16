const LobbyManager = require('./LobbyManager');
const Lobby = require('./Lobby');

//мокаем зависимости
jest.mock('./Lobby');
jest.mock('../BaseManager');

describe('LobbyManager', () => {
    let lobbyManager;
    let mockMediator;
    let mockAnswer;
    let mockIo;
    let mockCommon;

    beforeEach(() => {
        //создаем моки
        mockAnswer = {
            good: jest.fn((data) => ({ result: 'ok', data })),
            bad: jest.fn((code) => ({ result: 'error', error: { code } }))
        };

        mockMediator = {
            get: jest.fn(),
            call: jest.fn(),
            subscribe: jest.fn(),
            set: jest.fn(),
            getEventTypes: jest.fn(() => ({})),
            getTriggerTypes: jest.fn(() => ({
                GET_USER_BY_GUID: 'GET_USER_BY_GUID'
            }))
        };

        mockIo = {
            emit: jest.fn(),
            to: jest.fn(() => ({
                emit: jest.fn()
            })),
            on: jest.fn(),
            sockets: {
                sockets: new Map()
            }
        };

        mockCommon = {
            guid: jest.fn(() => 'test-guid')
        };

        // экземпляр LobbyManager
        lobbyManager = new LobbyManager({
            mediator: mockMediator,
            answer: mockAnswer,
            io: mockIo,
            common: mockCommon,
            db: {}
        });

        // подменяем lobbies
        lobbyManager.lobbies = {};
        
        // подменяем вспомогательные методы, чтобы не вызывать реальные зависимости
        lobbyManager.getUserByGuid = jest.fn();
        lobbyManager.sendToAll = jest.fn();
        lobbyManager._notifyLobbiesListUpdated = jest.fn();
        lobbyManager._destroyLobby = jest.fn();
        

        if (!lobbyManager.answer) {
            lobbyManager.answer = mockAnswer;
        }
    });

    //========= ТЕСТЫ CREATE_LOBBY =========
    describe('ТЕСТЫ НА СОЗДАНИЕ ЛОББИ', () => {
        //positive
        test('должен создать новое лобби', () => {
            const mockLobbyInstance = {
                get: jest.fn(() => ({ lobbyGuid: 'user-guid', lobbyName: 'test-room' }))
            };
            
            Lobby.mockImplementation(() => mockLobbyInstance);

            // подменяем isGuidInAnyLobby чтобы ничего не находил
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._createLobby({
                guid: 'user-guid',
                lobbyName: 'test-room',
                role: 'spectator'
            });

            expect(Lobby).toHaveBeenCalledWith({
                lobbyGuid: 'user-guid',
                lobbyName: 'test-room',
                role: 'spectator'
            });
            
            expect(lobbyManager.lobbies['user-guid']).toBe(mockLobbyInstance);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        //positive
        test('должен уничтожить существующее лобби при создании нового', () => {
            // создаем существующее лобби
            const existingLobby = {
                lobbyGuid: 'old-guid',
                isGuidInLobby: jest.fn(() => true)
            };
            lobbyManager.lobbies['old-guid'] = existingLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => existingLobby);

            const mockLobbyInstance = {
                get: jest.fn(() => ({ lobbyGuid: 'new-guid', lobbyName: 'new-room' }))
            };
            Lobby.mockImplementation(() => mockLobbyInstance);

            lobbyManager._createLobby({
                guid: 'user-guid',
                lobbyName: 'new-room',
                role: 'spectator'
            });

            expect(lobbyManager._destroyLobby).toHaveBeenCalledWith('old-guid');
        });
    });

    //========= ТЕСТЫ SET_READY =========
    describe('ТЕСТЫ НА УСТАНОВКУ READY', () => {
        //positive
        test('должен установить статус ready для игрока в лобби', () => {
            const mockLobby = {
                lobbyGuid: 'lobby-guid',
                setPlayerReady: jest.fn(() => true),
                isGuidInLobby: jest.fn(() => true)
            };
            
            lobbyManager.lobbies['lobby-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._setReady({ guid: 'player-guid' });

            expect(mockLobby.setPlayerReady).toHaveBeenCalledWith('player-guid');
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        //negative
        test('должен вернуть ошибку 2006, если игрок не в лобби', () => {
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._setReady({ guid: 'player-guid' });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2006);
        });

        //negative
        test('должен вернуть ошибку 1001, если setPlayerReady вернул false', () => {
            const mockLobby = {
                lobbyGuid: 'lobby-guid',
                setPlayerReady: jest.fn(() => false),
                isGuidInLobby: jest.fn(() => true)
            };
            
            lobbyManager.lobbies['lobby-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._setReady({ guid: 'player-guid' });

            expect(mockAnswer.bad).toHaveBeenCalledWith(1001);
        });
    });

    describe('ДОП ТЕСТЫ', () => {
        //positive
        test('_checkError должен вернуть bad при условии true', () => {
            const result = lobbyManager._checkError(true, 242);
            expect(mockAnswer.bad).toHaveBeenCalledWith(242);
        });

        //negative
        test('_checkError должен вернуть null при условии false', () => {
            const result = lobbyManager._checkError(false, 242);
            expect(result).toBeNull();
        });

        //positive
        test('getUserByGuid должен вызвать mediator.get', () => {
            const originalGetUserByGuid = LobbyManager.prototype.getUserByGuid;
            lobbyManager.getUserByGuid = originalGetUserByGuid.bind(lobbyManager);
            lobbyManager.mediator = mockMediator;
            lobbyManager.TRIGGERS = { GET_USER_BY_GUID: 'GET_USER_BY_GUID' };
            
            lobbyManager.getUserByGuid('test-guid');
            expect(mockMediator.get).toHaveBeenCalledWith('GET_USER_BY_GUID', 'test-guid');
        });

        //positive
        test('isGuidInAnyLobby должен найти лобби с игроком', () => {
            const mockLobby = {
                isGuidInLobby: jest.fn((guid) => guid === 'player-guid')
            };
            lobbyManager.lobbies['lobby1'] = mockLobby;

            const result = lobbyManager.isGuidInAnyLobby('player-guid');
            expect(result).toBe(mockLobby);
        });

        //negative
        test('isGuidInAnyLobby должкн вернуть undefined если игрок не найден', () => {
            const mockLobby = {
                isGuidInLobby: jest.fn(() => false)
            };
            lobbyManager.lobbies['lobby1'] = mockLobby;

            const result = lobbyManager.isGuidInAnyLobby('player-guid');
            expect(result).toBeUndefined();
        });
    });
});