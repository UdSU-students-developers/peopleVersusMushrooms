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

    //========= ТЕСТЫ JOIN_TO_LOBBY =========
    describe('ТЕСТЫ НА ПРИСОЕДИНЕНИЕ К ЛОББИ', () => {
        let mockLobby;

        beforeEach(() => {
            mockLobby = {
                lobbyGuid: 'creator-guid',
                lobbyName: 'test-room',
                canJoin: jest.fn(() => true),
                addPlayer: jest.fn(() => true),
                get: jest.fn(() => ({
                    lobbyGuid: 'creator-guid',
                    lobbyName: 'test-room',
                    playersGuids: {
                        spectator: 'creator-guid',
                        peopleArmy: 'player-guid',
                        peopleEconomy: null,
                        mushroomsArmy: null,
                        mushroomsEconomy: null
                    },
                    playersIsReady: {
                        spectator: false,
                        peopleArmy: false,
                        peopleEconomy: false,
                        mushroomsArmy: false,
                        mushroomsEconomy: false
                    }
                }))
            };
        });

        //positive
        test('должен успешно присоединить игрока к существующему лобби', () => {
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'creator-guid',
                role: 'peopleArmy'
            });

            expect(mockLobby.canJoin).toHaveBeenCalled();
            expect(mockLobby.addPlayer).toHaveBeenCalledWith('player-guid', 'peopleArmy');
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        //positive
        test('должен присоединить игрока с ролью spectator', () => {
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'creator-guid',
                role: 'spectator'
            });

            expect(mockLobby.addPlayer).toHaveBeenCalledWith('player-guid', 'spectator');
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        //positive
        test('должен присоединить игрока с ролью mushroomsEconomy', () => {
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'creator-guid',
                role: 'mushroomsEconomy'
            });

            expect(mockLobby.addPlayer).toHaveBeenCalledWith('player-guid', 'mushroomsEconomy');
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        //positive
        test('должен уничтожить старое лобби, если игрок уже в другом лобби', () => {
            const oldLobby = {
                lobbyGuid: 'old-creator',
                canJoin: jest.fn(() => true),
                addPlayer: jest.fn(() => true),
                get: jest.fn(() => ({ lobbyGuid: 'old-creator' }))
            };

            const newLobby = {
                lobbyGuid: 'new-creator',
                canJoin: jest.fn(() => true),
                addPlayer: jest.fn(() => true),
                get: jest.fn(() => ({ lobbyGuid: 'new-creator' }))
            };

            lobbyManager.lobbies['old-creator'] = oldLobby;
            lobbyManager.lobbies['new-creator'] = newLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => oldLobby);

            lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'new-creator',
                role: 'peopleArmy'
            });

            expect(lobbyManager._destroyLobby).toHaveBeenCalledWith('old-creator');
            expect(newLobby.addPlayer).toHaveBeenCalledWith('player-guid', 'peopleArmy');
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        //negative
        test('должен вернуть ошибку 2003, если лобби не существует', () => {
            lobbyManager.lobbies = {};
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'non-existent',
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2003);
            expect(result).toEqual({ result: 'error', error: { code: 2003 } });
        });

        //negative
        test('должен вернуть ошибку 2005, если игрок уже в этом же лобби', () => {
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'creator-guid',
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2005);
            expect(mockLobby.addPlayer).not.toHaveBeenCalled();
        });

        //negative
        test('должен вернуть ошибку 2004, если лобби заполнено', () => {
            mockLobby.canJoin = jest.fn(() => false);
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'creator-guid',
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2004);
            expect(mockLobby.addPlayer).not.toHaveBeenCalled();
        });

        //negative
        test('должен вернуть ошибку 2017, если addPlayer вернул false', () => {
            mockLobby.addPlayer = jest.fn(() => false);
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'creator-guid',
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2017);
        });

        //edge case
        test('должен вернуть ошибку 2003 при пустом lobbyGuid', () => {
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: undefined,
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2003);
        });

        //edge case
        test('должен вернуть ошибку 2003 при null lobbyGuid', () => {
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: null,
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2003);
        });

        //edge case
        test('должен вернуть ошибку 2017 при пустом guid', () => {
            mockLobby.addPlayer = jest.fn(() => false);
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: undefined,
                lobbyGuid: 'creator-guid',
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2017);
        });

        //edge case
        test('должен вернуть ошибку 2017 при пустой роли', () => {
            mockLobby.addPlayer = jest.fn(() => false);
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'player-guid',
                lobbyGuid: 'creator-guid',
                role: undefined
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2017);
        });

        //edge case
        test('должен корректно обработать присоединение к лобби с одним свободным местом', () => {
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'last-player',
                lobbyGuid: 'creator-guid',
                role: 'mushroomsEconomy'
            });

            expect(mockLobby.canJoin).toHaveBeenCalled();
            expect(mockLobby.addPlayer).toHaveBeenCalledWith('last-player', 'mushroomsEconomy');
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        //edge case
        test('должен вернуть ошибку 2004, если лобби уже полностью заполнено', () => {
            mockLobby.canJoin = jest.fn(() => false);
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._joinToLobby({
                guid: 'extra-player',
                lobbyGuid: 'creator-guid',
                role: 'peopleArmy'
            });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2004);
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

        //========= ТЕСТЫ LEAVE_LOBBY =========
    describe('ТЕСТЫ НА ВЫХОД ИЗ ЛОББИ', () => {
        //positive
        test('должен удалить обычного игрока из лобби при выходе', () => {
            const mockLobby = {
                lobbyGuid: 'lobby-guid',
                removePlayer: jest.fn(() => true),
                isGuidInLobby: jest.fn(() => true)
            };
        
            lobbyManager.lobbies['lobby-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._leaveLobby({ guid: 'player-guid' });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith('player-guid');
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
            expect(mockAnswer.good).toHaveBeenCalledWith(true);
        });

        //positive
        test('должен уничтожить все лобби, если выходит создатель', () => {
            const mockLobby = {
                lobbyGuid: 'lobby-guid',
                removePlayer: jest.fn(),
                isGuidInLobby: jest.fn(() => true)
            };
        
            lobbyManager.lobbies['lobby-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._leaveLobby({ guid: 'lobby-guid' });

            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
            expect(lobbyManager._destroyLobby).toHaveBeenCalledWith('lobby-guid');
            expect(mockAnswer.good).toHaveBeenCalledWith(true);
        });

        //negative
        test('должен вернуть ошибку 2006, если игрок не в лобби', () => {
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._leaveLobby({ guid: 'player-guid' });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2006);
        });

        //positive
        test('должен корректно обработать выход игрока, который не является создателем, но в лобби есть другие игроки', () => {
            const mockLobby = {
                lobbyGuid: 'creator-guid',
                removePlayer: jest.fn(() => true),
                isGuidInLobby: jest.fn(() => true)
            };
        
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._leaveLobby({ guid: 'player-guid' });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith('player-guid');
            expect(lobbyManager.lobbies['creator-guid']).toBe(mockLobby);
            expect(mockAnswer.good).toHaveBeenCalledWith(true);
        });

        //edge case
        test('должен вернуть ошибку, если guid не передан', () => {
           const result = lobbyManager._leaveLobby({ guid: undefined });
        
            expect(mockAnswer.bad).toHaveBeenCalledWith(2006);
        });
    });

    //========= ТЕСТЫ START_GAME =========
    describe('ТЕСТЫ НА СТАРТ ИГРЫ', () => {
        //positive
        test('должен успешно запустить игру, если все условия соблюдены', () => {
            const mockLobby = {
                lobbyGuid: 'creator-guid',
                canStarted: jest.fn(() => true),
                isGuidInLobby: jest.fn(() => true),
                getGuids: jest.fn(() => ({
                    lobbyGuid: 'creator-guid',
                    spectator: 'spectator-guid',
                    peopleArmy: 'army-guid',
                    peopleEconomy: 'economy-guid',
                    mushroomArmy: 'mushroom-army-guid',
                    mushroomEconomy: 'mushroom-economy-guid'
                }))
            };
        
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);
            lobbyManager.mediator.call = jest.fn();

            const result = lobbyManager._startGame({ guid: 'creator-guid' });

            expect(mockLobby.canStarted).toHaveBeenCalled();
            expect(lobbyManager.mediator.call).toHaveBeenCalledWith(
                lobbyManager.EVENTS.START_GAME_MAP, 
                mockLobby.getGuids()
            );
            expect(lobbyManager._destroyLobby).toHaveBeenCalledWith('creator-guid');
            expect(mockAnswer.good).toHaveBeenCalledWith(true);
        });

        //negative
        test('должен вернуть ошибку 2006, если игрок не в лобби', () => {
            lobbyManager.isGuidInAnyLobby = jest.fn(() => null);

            const result = lobbyManager._startGame({ guid: 'player-guid' });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2006);
        });

        //negative
        test('должен вернуть ошибку 2010, если игрок не создатель лобби', () => {
            const mockLobby = {
                lobbyGuid: 'creator-guid',
                canStarted: jest.fn(() => true),
                isGuidInLobby: jest.fn(() => true)
            };
        
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._startGame({ guid: 'player-guid' }); // не создатель

            expect(mockAnswer.bad).toHaveBeenCalledWith(2010);
            expect(mockLobby.canStarted).not.toHaveBeenCalled();
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
        });

        //negative
        test('должен вернуть ошибку 2012, если не все игроки готовы', () => {
            const mockLobby = {
                lobbyGuid: 'creator-guid',
                canStarted: jest.fn(() => false), // не все готовы
                isGuidInLobby: jest.fn(() => true)
            };
        
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._startGame({ guid: 'creator-guid' });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2012);
            expect(lobbyManager.mediator.call).not.toHaveBeenCalled();
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
        });

        //edge case
        test('должен корректно обработать ситуацию, когда лобби существует, но guid создателя не совпадает', () => {
            const mockLobby = {
                lobbyGuid: 'creator-guid',
                canStarted: jest.fn(() => true),
                isGuidInLobby: jest.fn(() => true)
            };
        
            lobbyManager.lobbies['creator-guid'] = mockLobby;
            lobbyManager.isGuidInAnyLobby = jest.fn(() => mockLobby);

            const result = lobbyManager._startGame({ guid: 'wrong-creator-guid' });

            expect(mockAnswer.bad).toHaveBeenCalledWith(2010);
            expect(mockLobby.canStarted).not.toHaveBeenCalled();
        });

        //edge case
        test('должен вернуть ошибку, если guid не передан', () => {
            const result = lobbyManager._startGame({ guid: undefined });
        
            expect(mockAnswer.bad).toHaveBeenCalledWith(2006);
        });
    });
});