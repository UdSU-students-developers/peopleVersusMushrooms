const LobbyManager = require('./LobbyManager');

// Мокаем, мокаем
jest.mock('../../../config', () => ({
    MESSAGES: {
        SET_READY: 'SET_READY',
        LOBBY_UPDATED: 'LOBBY_UPDATED',
        LOBBIES_LIST_UPDATED: 'LOBBIES_LIST_UPDATED',
        CREATE_LOBBY: 'CREATE_LOBBY',
        JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
        LEAVE_LOBBY: 'LEAVE_LOBBY',
        DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
        START_GAME: 'START_GAME',
        GET_LOBBIES: 'GET_LOBBIES',
        LOBBY_DESTROYED: 'LOBBY_DESTROYED'
    }
}));

jest.mock('./Lobby');

/// ТЕСТИРОВКА ФУНКЦИИ _setReady ///
describe('LobbyManager._setReady', () => {
    let lobbyManager;
    let mockUser;
    let mockLobby;
    let mockAnswer;
    let mockMediator;

    beforeEach(() => {
        // Создаем моки для answer
        mockAnswer = {
            good: jest.fn((data) => ({ result: 'success', data })),
            bad: jest.fn((code) => ({ result: 'error', code }))
        };

        // Создаем мок пользователя с валидным guid
        mockUser = {
            guid: 'valid-guid-123',
            socketId: 'socket-123',
            name: 'TestUser'
        };

        // Создаем мок лобби
        mockLobby = {
            lobbyGuid: 'lobby-guid-456',
            playersGuids: {
                creator: 'valid-guid-123',
                player2: 'another-guid-789',
                player3: null,
                player4: null
            },
            playersIsReady: {
                creator: false,
                player2: false,
                player3: false,
                player4: false
            },
            isGuidInLobby: jest.fn(),
            setPlayerReady: jest.fn(),
            get: jest.fn().mockReturnValue({
                lobbyGuid: 'lobby-guid-456',
                playersGuids: mockLobby?.playersGuids,
                playersIsReady: mockLobby?.playersIsReady
            }),
            canJoin: jest.fn(),
            canStarted: jest.fn(),
            addPlayer: jest.fn(),
            removePlayer: jest.fn(),
            getGuids: jest.fn()
        };

        // Создаем мок медаитора
        mockMediator = {
            subscribe: jest.fn(),
            set: jest.fn(),
            get: jest.fn(),
            call: jest.fn(),
            getEventTypes: jest.fn().mockReturnValue({
                SET_READY: 'SET_READY',
                CREATE_LOBBY: 'CREATE_LOBBY',
                JOIN_TO_LOBBY: 'JOIN_TO_LOBBY',
                LEAVE_LOBBY: 'LEAVE_LOBBY',
                DROP_FROM_LOBBY: 'DROP_FROM_LOBBY',
                START_GAME: 'START_GAME',
                GET_LOBBIES: 'GET_LOBBIES',
                LOGOUT: 'LOGOUT'
            }),
            getTriggerTypes: jest.fn().mockReturnValue({
                IS_GUID_IN_ANY_LOBBY: 'IS_GUID_IN_ANY_LOBBY',
                GET_USER_BY_GUID: 'GET_USER_BY_GUID'
            })
        };

        // Создаем экземпляр LobbyManager с отключенным io
        lobbyManager = new LobbyManager({
            answer: mockAnswer,
            mediator: mockMediator,
            io: null, //офаем
            db: {},
            common: {}
        });

        // Мокаем getUserByGuid по умолчанию
        lobbyManager.getUserByGuid = jest.fn().mockReturnValue(mockUser);
        
        // Мокаем isGuidInAnyLobby по умолчанию
        lobbyManager.isGuidInAnyLobby = jest.fn().mockReturnValue(mockLobby);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Негативные случаи', () => {
        test('должен вернуть ошибку 1001, если пользователь не найден', () => {
            // Arrange
            lobbyManager.getUserByGuid = jest.fn().mockReturnValue(null);

            // Act
            const result = lobbyManager._setReady('non-existent-guid');

            //ssret
            expect(result).toEqual({ result: 'error', code: 1001 });
            expect(mockAnswer.bad).toHaveBeenCalledWith(1001);
            expect(lobbyManager.getUserByGuid).toHaveBeenCalledWith('non-existent-guid');
        });

        test('должен вернуть ошибку 2006 если пользователь не состоит ни в одном лобби', () => {
            // Arrange
            lobbyManager.isGuidInAnyLobby = jest.fn().mockReturnValue(null);

            // Act
            const result = lobbyManager._setReady(mockUser.guid);

            // Assert
            expect(result).toEqual({ result: 'error', code: 2006 });
            expect(mockAnswer.bad).toHaveBeenCalledWith(2006);
            expect(lobbyManager.isGuidInAnyLobby).toHaveBeenCalledWith(mockUser.guid);
        });

        test('должен вернуть ошибку 1001, если игрок не найден в лобби (setplayerReady вернул false)', () => {
            // Arrange
            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    mockLobby.playersIsReady[role] = true;
                    return true;
                }
                return false;
            };
            
            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);
            lobbyManager.isGuidInAnyLobby = jest.fn().mockReturnValue(mockLobby);

            // Act
            const result = lobbyManager._setReady('guid-not-in-lobby');

            // Assert
            expect(result).toEqual({ result: 'error', code: 1001 });
            expect(mockLobby.setPlayerReady).toHaveBeenCalledWith('guid-not-in-lobby');
        });

        test('должен корректно обработать случай, когда лоббэ не существует (null)', () => {
            // Arrange
            lobbyManager.isGuidInAnyLobby = jest.fn().mockReturnValue(null);

            // Act
            const result = lobbyManager._setReady(mockUser.guid);

            // Assert
            expect(result).toEqual({ result: 'error', code: 2006 });
        });

        test('должен обработать случай, когда getUserByGuid выбрасывает исключение', () => {
            // Arrange
            lobbyManager.getUserByGuid = jest.fn(() => {
                throw new Error('Database connection error');
            });

            //аct & Assert
            expect(() => lobbyManager._setReady(mockUser.guid)).toThrow('Database connection error');
        });
    });

    describe('Погрничные случаи', () => {
        test.each([
            ['undefined', undefined],
            ['null', null],
            ['пустая строка', ''],
            ['строка из пробелов', '   '],
            ['число 0', 0],
            ['число 123', 123],
            ['спецсимволы', '!@#$%^&*()'],
            ['очень длинная строка', 'a'.repeat(1000)],
            ['GUID с пробелами', '  guid-with-spaces  '],
        ])('должен корректно обработать некорректный guid: %s', (description, guid) => {
            // Arrange
            lobbyManager.getUserByGuid = jest.fn().mockReturnValue(null);

            // Act
            const result = lobbyManager._setReady(guid);

            // Assert
            expect(result).toEqual({ result: 'error', code: 1001 });
            expect(lobbyManager.getUserByGuid).toHaveBeenCalledWith(guid);
        });

        test('должен корректно обработать случай, когда пользователь пытается установить ready дважды', () => {
            // Arrange
            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    const wasAlreadyReady = mockLobby.playersIsReady[role];
                    mockLobby.playersIsReady[role] = true;
                    return true; // Всегда возвращает true если игрок в лобби
                }
                return false;
            };

            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);

            //первый вызов
            const firstResult = lobbyManager._setReady(mockUser.guid);
            expect(firstResult).toEqual({ result: 'success', data: true });
            
            // Второй вызов (уже ready)
            const secondResult = lobbyManager._setReady(mockUser.guid);
            expect(secondResult).toEqual({ result: 'success', data: true }); // setPlayerReady все еще возвращает true, но не уверен
            expect(mockLobby.setPlayerReady).toHaveBeenCalledTimes(2);
        });

        test('должен корректно работать с пользователем без socketId', () => {
            // Arrange
            const userWithoutSocket = {
                guid: 'user-without-socket',
                socketId: null
            };
            
            lobbyManager.getUserByGuid = jest.fn().mockReturnValue(userWithoutSocket);
            
            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    mockLobby.playersIsReady[role] = true;
                    return true;
                }
                return false;
            };
            
            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);
            
            // Уьедимся что пользователь есть в лобби
            mockLobby.playersGuids.creator = 'user-without-socket';

            // Act
            const result = lobbyManager._setReady('user-without-socket');

            // Assert
            expect(result).toEqual({ result: 'success', data: true });
        });

        test('должен корректно работать с последним игроком, который ставит ready', () => {
            // Arrange
            mockLobby.playersGuids = {
                creator: 'guid-1',
                player2: 'guid-2',
                player3: 'guid-3',
                player4: 'guid-4'
            };
            mockLobby.playersIsReady = {
                creator: true,
                player2: true,
                player3: true,
                player4: false
            };

            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    mockLobby.playersIsReady[role] = true;
                    return true;
                }
                return false;
            };

            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);

            const lastUser = { guid: 'guid-4', socketId: 'socket-4' };
            lobbyManager.getUserByGuid = jest.fn().mockReturnValue(lastUser);

            // Act
            const result = lobbyManager._setReady('guid-4');

            // Assert
            expect(result).toEqual({ result: 'success', data: true });
            expect(mockLobby.playersIsReady.player4).toBe(true);
            // Все игроки теперь ready
            expect(Object.values(mockLobby.playersIsReady).every(ready => ready === true)).toBe(true);
        });
    });

    describe('Успешные случаи', () => {
        test('должен успешно усановить ready для пользователя', () => {
            // Arrange
            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    mockLobby.playersIsReady[role] = true;
                    return true;
                }
                return false;
            };

            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);

            // Act
            const result = lobbyManager._setReady(mockUser.guid);

            // Assert
            expect(result).toEqual({ result: 'success', data: true });
            expect(mockAnswer.good).toHaveBeenCalledWith(true);
            expect(mockLobby.setPlayerReady).toHaveBeenCalledWith(mockUser.guid);
            expect(mockLobby.playersIsReady.creator).toBe(true);
        });

        test('должен вызывать все необходимые методы в правильном порядке', () => {
            // Arrange
            const callOrder = [];
            
            lobbyManager.getUserByGuid = jest.fn(() => {
                callOrder.push('getUserByGuid');
                return mockUser;
            });
            
            lobbyManager.isGuidInAnyLobby = jest.fn(() => {
                callOrder.push('isGuidInAnyLobby');
                return mockLobby;
            });
            
            mockLobby.setPlayerReady = jest.fn(() => {
                callOrder.push('setPlayerReady');
                return true;
            });

            //Act
            lobbyManager._setReady(mockUser.guid);

            // Assert
            expect(callOrder).toEqual([
                'getUserByGuid',
                'isGuidInAnyLobby',
                'setPlayerReady'
            ]);
        });

        test('должен корректно работать с разными ролями игроков', () => {
            // Arrange
            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    mockLobby.playersIsReady[role] = true;
                    return true;
                }
                return false;
            };

            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);
            
            // Тестиовка для роли player2
            const player2 = { guid: 'another-guid-789', socketId: 'socket-789' };
            lobbyManager.getUserByGuid = jest.fn().mockReturnValue(player2);

            // Act
            const result = lobbyManager._setReady('another-guid-789');

            // Assert
            expect(result).toEqual({ result: 'success', data: true });
            expect(mockLobby.playersIsReady.player2).toBe(true);
            expect(mockLobby.playersIsReady.creator).toBe(false); // Создатель все еще не ready
        });
    });

    describe('Интеграционные проверки', () => {
        test('should not modify other players ready status', () => {
            // Arrange
            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    mockLobby.playersIsReady[role] = true;
                    return true;
                }
                return false;
            };

            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);
            
            // Запоминаем начальное состояние
            const initialReadyStatus = { ...mockLobby.playersIsReady };

            // Act
            lobbyManager._setReady(mockUser.guid);

            // Assert
            // Только creator должен измениться
            expect(mockLobby.playersIsReady.creator).toBe(true);
            expect(mockLobby.playersIsReady.player2).toBe(initialReadyStatus.player2);
        });

        test('should handle rapid successive calls', () => {
            //rrange
            const realSetPlayerReady = (guid) => {
                const role = Object.keys(mockLobby.playersGuids).find(
                    role => mockLobby.playersGuids[role] === guid
                );
                if (role) {
                    mockLobby.playersIsReady[role] = true;
                    return true;
                }
                return false;
            };

            mockLobby.setPlayerReady = jest.fn(realSetPlayerReady);
            
            const users = [
                { guid: 'valid-guid-123', socketId: 'socket-1' },
                { guid: 'another-guid-789', socketId: 'socket-2' }
            ];

            // Act
            users.forEach(user => {
                lobbyManager.getUserByGuid = jest.fn().mockReturnValue(user);
                const result = lobbyManager._setReady(user.guid);
                expect(result).toEqual({ result: 'success', data: true });
            });

            // Assert
            expect(mockLobby.playersIsReady.creator).toBe(true);
            expect(mockLobby.playersIsReady.player2).toBe(true);
        });
    });
});