const LobbyManager = require('./LobbyManager');
const Lobby = require('./Lobby');

jest.mock('./Lobby');
jest.mock('../BaseManager');

describe('LobbyManager - removePlayer', () => {
    let lobbyManager;
    let mockMediator;
    let mockAnswer;
    let mockIo;
    let mockCommon;

    function createDefaultMockLobby(lobbyGuid = 'test-lobby-guid', creatorGuid = 'creator-guid', playerGuid = 'player-guid') {
        const playersGuids = {
            spectator: creatorGuid,
            peopleArmy: playerGuid,
            peopleEconomy: null,
            mushroomsArmy: null,
            mushroomsEconomy: null
        };
        return {
            lobbyGuid,
            lobbyName: 'test-lobby',
            playersGuids,
            hasPlayer: jest.fn((guid) => Object.values(playersGuids).includes(guid)),
            removePlayer: jest.fn((guid) => {
                for (let role in playersGuids) {
                    if (playersGuids[role] === guid) {
                        playersGuids[role] = null;
                        return true;
                    }
                }
                return false;
            }),
            getOwnerGuid: jest.fn(() => creatorGuid),
            getAllPlayersGuids: jest.fn(() => Object.values(playersGuids).filter(v => v !== null)),
            get: jest.fn(() => ({
                lobbyGuid,
                playersGuids: { ...playersGuids }
            }))
        };
    }

    beforeEach(() => {
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

        lobbyManager = new LobbyManager({
            mediator: mockMediator,
            answer: mockAnswer,
            io: mockIo,
            common: mockCommon,
            db: {}
        });

        lobbyManager.lobbies = {};
        lobbyManager.getUserByGuid = jest.fn();
        lobbyManager.sendToAll = jest.fn();
        lobbyManager._notifyLobbiesListUpdated = jest.fn();
        lobbyManager._destroyLobby = jest.fn();

        if (!lobbyManager.answer) {
            lobbyManager.answer = mockAnswer;
        }
    });

    describe('Позитивные сценарии удаления игрока', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            lobbyManager._checkRemoveRights = jest.fn(() => true);
            jest.clearAllMocks();
        });

        test('успешное удаление обычного игрока (peopleArmy) создателем лобби', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.hasPlayer).toHaveBeenCalledWith(PLAYER_GUID);
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(PLAYER_GUID);
            expect(lobbyManager.sendToAll).toHaveBeenCalled();
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('успешное удаление игрока с ролью peopleEconomy', () => {
            mockLobby.playersGuids.peopleEconomy = PLAYER_GUID;
            mockLobby.playersGuids.peopleArmy = null;

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(PLAYER_GUID);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('успешное удаление игрока с ролью mushroomsArmy', () => {
            mockLobby.playersGuids.mushroomsArmy = PLAYER_GUID;
            mockLobby.playersGuids.peopleArmy = null;

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(PLAYER_GUID);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('успешное удаление игрока с ролью mushroomsEconomy', () => {
            mockLobby.playersGuids.mushroomsEconomy = PLAYER_GUID;
            mockLobby.playersGuids.peopleArmy = null;

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(PLAYER_GUID);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('успешное удаление игрока с ролью spectator (не создателя)', () => {
            const spectatorGuid = 'spectator-guest';
            mockLobby.playersGuids.spectator = spectatorGuid;
            mockLobby.getOwnerGuid.mockReturnValue(CREATOR_GUID);

            lobbyManager._removePlayer({
                guid: spectatorGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(spectatorGuid);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('игрок удаляет сам себя (выход из лобби)', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: PLAYER_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(PLAYER_GUID);
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('удаление игрока из многолюдного лобби (все роли заняты)', () => {
            mockLobby.playersGuids = {
                spectator: CREATOR_GUID,
                peopleArmy: 'p1',
                peopleEconomy: 'p2',
                mushroomsArmy: 'p3',
                mushroomsEconomy: 'p4'
            };
            mockLobby.getAllPlayersGuids.mockReturnValue(['p1','p2','p3','p4', CREATOR_GUID]);

            lobbyManager._removePlayer({
                guid: 'p1',
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith('p1');
            expect(lobbyManager.sendToAll).toHaveBeenCalled();
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('удаление последнего игрока (кроме создателя) - лобби остаётся с создателем', () => {
            mockLobby.playersGuids = {
                spectator: CREATOR_GUID,
                peopleArmy: PLAYER_GUID,
                peopleEconomy: null,
                mushroomsArmy: null,
                mushroomsEconomy: null
            };
            mockLobby.getAllPlayersGuids.mockReturnValue([CREATOR_GUID, PLAYER_GUID]);

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(PLAYER_GUID);
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('удаление игрока с числовым guid', () => {
            const numericGuid = 12345;
            mockLobby.playersGuids.peopleArmy = numericGuid;

            lobbyManager._removePlayer({
                guid: numericGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(numericGuid);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('удаление игрока с временным GUID (гость)', () => {
            const tempGuid = 'temp-12345';
            mockLobby.playersGuids.peopleArmy = tempGuid;

            lobbyManager._removePlayer({
                guid: tempGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.removePlayer).toHaveBeenCalledWith(tempGuid);
            expect(mockAnswer.good).toHaveBeenCalled();
        });
    });

    describe('Негативные сценарии - невалидные параметры', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            lobbyManager._checkRemoveRights = jest.fn(() => true);
            jest.clearAllMocks();
        });

        test('lobbyGuid равен null', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: null,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('lobbyGuid равен undefined', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: undefined,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('lobbyGuid равен пустой строке', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: '',
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('lobbyGuid равен 0', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: 0,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('lobbyGuid равен false', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: false,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('guid игрока равен null', () => {
            lobbyManager._removePlayer({
                guid: null,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('guid игрока равен undefined', () => {
            lobbyManager._removePlayer({
                guid: undefined,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('guid игрока равен пустой строке', () => {
            lobbyManager._removePlayer({
                guid: '',
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('guid игрока равен 0', () => {
            lobbyManager._removePlayer({
                guid: 0,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('initiatorGuid равен null', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: null
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('оба параметра guid и lobbyGuid равны null', () => {
            lobbyManager._removePlayer({
                guid: null,
                lobbyGuid: null,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('отсутствует обязательный параметр guid', () => {
            lobbyManager._removePlayer({
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });
    });

    describe('Негативные сценарии - бизнес-логика', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            jest.clearAllMocks();
        });

        test('лобби не найдено (несуществующий lobbyGuid)', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: 'non-existent',
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('игрок не найден в указанном лобби', () => {
            mockLobby.hasPlayer.mockReturnValue(false);

            lobbyManager._removePlayer({
                guid: 'unknown-guid',
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('попытка удалить игрока, который уже был удалён ранее', () => {
            mockLobby.hasPlayer.mockReturnValue(false);

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('удаление игрока без прав (инициатор не создатель и не сам игрок)', () => {
            lobbyManager._checkRemoveRights = jest.fn(() => false);

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: 'stranger-guid'
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('попытка удалить создателя другим игроком', () => {
            lobbyManager._checkRemoveRights = jest.fn(() => false);

            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: PLAYER_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
        });

        test('попытка удалить игрока из лобби, которое находится в статусе "игра началась"', () => {
            mockLobby.gameStarted = true;

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });
    });

    describe('Удаление создателя лобби', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            lobbyManager._checkRemoveRights = jest.fn(() => true);
            jest.clearAllMocks();
        });

        test('создатель удаляет сам себя - лобби уничтожается', () => {
            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(CREATOR_GUID);
            expect(lobbyManager._destroyLobby).toHaveBeenCalledWith(LOBBY_GUID);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('создатель удаляет себя, в лобби есть другие игроки - лобби уничтожается', () => {
            mockLobby.playersGuids.peopleArmy = PLAYER_GUID;
            mockLobby.playersGuids.peopleEconomy = 'another-player';

            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(CREATOR_GUID);
            expect(lobbyManager._destroyLobby).toHaveBeenCalledWith(LOBBY_GUID);
        });

        test('создатель удаляет себя, в лобби никого нет - лобби уничтожается', () => {
            mockLobby.playersGuids = {
                spectator: CREATOR_GUID,
                peopleArmy: null,
                peopleEconomy: null,
                mushroomsArmy: null,
                mushroomsEconomy: null
            };
            mockLobby.getAllPlayersGuids.mockReturnValue([CREATOR_GUID]);

            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(CREATOR_GUID);
            expect(lobbyManager._destroyLobby).toHaveBeenCalled();
        });

        test('попытка удалить создателя без указания initiatorGuid', () => {
            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('попытка удалить создателя, когда он уже был удалён ранее', () => {
            mockLobby.playersGuids.spectator = null;
            mockLobby.hasPlayer.mockReturnValue(false);

            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
        });

        test('создатель удаляет себя, но лобби уже было уничтожено ранее', () => {
            delete lobbyManager.lobbies[LOBBY_GUID];

            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('создатель удаляет себя, но в методе removePlayer выбрасывается исключение', () => {
            mockLobby.removePlayer.mockImplementation(() => {
                throw new Error('Remove failed');
            });

            expect(() => {
                lobbyManager._removePlayer({
                    guid: CREATOR_GUID,
                    lobbyGuid: LOBBY_GUID,
                    initiatorGuid: CREATOR_GUID
                });
            }).toThrow();
            expect(lobbyManager._destroyLobby).not.toHaveBeenCalled();
        });
    });

    describe('Проверка прав доступа', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const STRANGER_GUID = 'stranger-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            jest.clearAllMocks();
        });

        test('удаление чужого игрока без прав - ошибка', () => {
            lobbyManager._checkRemoveRights = jest.fn(() => false);

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: STRANGER_GUID
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('удаление самого себя - всегда успех (даже без прав)', () => {
            lobbyManager._checkRemoveRights = jest.fn(() => true);

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: PLAYER_GUID
            });
            expect(mockAnswer.good).toHaveBeenCalled();
            expect(mockLobby.removePlayer).toHaveBeenCalled();
        });

        test('удаление с пустым initiatorGuid - ошибка', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: ''
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('удаление с initiatorGuid, который не в лобби - ошибка', () => {
            lobbyManager._checkRemoveRights = jest.fn(() => false);

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: 'outsider-guid'
            });
            expect(mockAnswer.bad).toHaveBeenCalled();
        });

        test('удаление создателя самим создателем - успех', () => {
            lobbyManager._checkRemoveRights = jest.fn(() => true);

            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockAnswer.good).toHaveBeenCalled();
        });
    });

    describe('Уведомления и побочные эффекты', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            lobbyManager._checkRemoveRights = jest.fn(() => true);
            jest.clearAllMocks();
        });

        test('после удаления игрока всем оставшимся отправляется событие player_left', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(lobbyManager.sendToAll).toHaveBeenCalledWith(
                LOBBY_GUID,
                'player_left',
                expect.objectContaining({ guid: PLAYER_GUID })
            );
        });

        test('удалённому игроку отправляется отдельное событие you_were_removed', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockIo.to).toHaveBeenCalledWith(PLAYER_GUID);
        });

        test('после удаления вызывается _notifyLobbiesListUpdated', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(lobbyManager._notifyLobbiesListUpdated).toHaveBeenCalled();
        });

        test('при удалении игрока отправляется только одно уведомление всем', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(lobbyManager.sendToAll).toHaveBeenCalledTimes(1);
        });

        test('если лобби уничтожено (удалён создатель), отправляется событие lobby_destroyed', () => {
            lobbyManager._removePlayer({
                guid: CREATOR_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(lobbyManager.sendToAll).toHaveBeenCalledWith(
                LOBBY_GUID,
                'lobby_destroyed',
                expect.anything()
            );
        });

        test('уведомление содержит корректные данные лобби', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(lobbyManager.sendToAll).toHaveBeenCalledWith(
                LOBBY_GUID,
                'player_left',
                expect.objectContaining({
                    lobbyGuid: LOBBY_GUID,
                    removedGuid: PLAYER_GUID
                })
            );
        });

        test('если удаление не удалось, уведомления не отправляются', () => {
            mockLobby.hasPlayer.mockReturnValue(false);

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(lobbyManager.sendToAll).not.toHaveBeenCalled();
            expect(lobbyManager._notifyLobbiesListUpdated).not.toHaveBeenCalled();
        });

        test('sendToAll вызывается с правильным типом события', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            const callArgs = lobbyManager.sendToAll.mock.calls[0];
            expect(callArgs[0]).toBe(LOBBY_GUID);
            expect(callArgs[1]).toBe('player_left');
            expect(callArgs[2]).toHaveProperty('guid', PLAYER_GUID);
        });
    });

    describe('Пограничные случаи и нестандартные типы guid', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, 'some-player');
            mockLobby.playersGuids.peopleArmy = null;
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            lobbyManager._checkRemoveRights = jest.fn(() => true);
            jest.clearAllMocks();
        });

        test('очень длинный guid (10000 символов)', () => {
            const longGuid = 'a'.repeat(10000);
            mockLobby.playersGuids.peopleArmy = longGuid;

            lobbyManager._removePlayer({
                guid: longGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(longGuid);
            expect(mockAnswer.good).toHaveBeenCalled();
        });

        test('guid со специальными символами', () => {
            const specialGuid = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
            mockLobby.playersGuids.peopleArmy = specialGuid;

            lobbyManager._removePlayer({
                guid: specialGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(specialGuid);
        });

        test('guid с пробелами', () => {
            const spacedGuid = 'player with spaces';
            mockLobby.playersGuids.peopleArmy = spacedGuid;

            lobbyManager._removePlayer({
                guid: spacedGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(spacedGuid);
        });

        test('guid с юникодом (кириллица)', () => {
            const unicodeGuid = 'игрок-тест';
            mockLobby.playersGuids.peopleArmy = unicodeGuid;

            lobbyManager._removePlayer({
                guid: unicodeGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(unicodeGuid);
        });

        test('guid с эмодзи', () => {
            const emojiGuid = '🎮player🎯';
            mockLobby.playersGuids.peopleArmy = emojiGuid;

            lobbyManager._removePlayer({
                guid: emojiGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(emojiGuid);
        });

        test('отрицательный числовой guid', () => {
            const negativeGuid = -42;
            mockLobby.playersGuids.peopleArmy = negativeGuid;

            lobbyManager._removePlayer({
                guid: negativeGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(negativeGuid);
        });

        test('дробный числовой guid', () => {
            const floatGuid = 3.14159;
            mockLobby.playersGuids.peopleArmy = floatGuid;

            lobbyManager._removePlayer({
                guid: floatGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(floatGuid);
        });

        test('Infinity как guid', () => {
            mockLobby.playersGuids.peopleArmy = Infinity;

            lobbyManager._removePlayer({
                guid: Infinity,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(Infinity);
        });

        test('NaN как guid', () => {
            mockLobby.playersGuids.peopleArmy = NaN;

            lobbyManager._removePlayer({
                guid: NaN,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(NaN);
        });

        test('объект как guid', () => {
            const objectGuid = { id: 'player-1', name: 'test' };
            mockLobby.playersGuids.peopleArmy = objectGuid;

            lobbyManager._removePlayer({
                guid: objectGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(objectGuid);
        });

        test('массив как guid', () => {
            const arrayGuid = ['player', 'test'];
            mockLobby.playersGuids.peopleArmy = arrayGuid;

            lobbyManager._removePlayer({
                guid: arrayGuid,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(arrayGuid);
        });

        test('логическое true как guid', () => {
            mockLobby.playersGuids.peopleArmy = true;

            lobbyManager._removePlayer({
                guid: true,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });
            expect(mockLobby.removePlayer).toHaveBeenCalledWith(true);
        });
    });

    describe('Проверка состояния после удаления', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            lobbyManager._checkRemoveRights = jest.fn(() => true);
            jest.clearAllMocks();
        });

        test('не изменяет другие роли при удалении игрока', () => {
            const beforeState = { ...mockLobby.playersGuids };

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.playersGuids.spectator).toBe(beforeState.spectator);
            expect(mockLobby.playersGuids.peopleEconomy).toBe(beforeState.peopleEconomy);
            expect(mockLobby.playersGuids.mushroomsArmy).toBe(beforeState.mushroomsArmy);
            expect(mockLobby.playersGuids.mushroomsEconomy).toBe(beforeState.mushroomsEconomy);
        });

        test('состояние не меняется при неудачной попытке удаления', () => {
            const beforeState = { ...mockLobby.playersGuids };

            mockLobby.hasPlayer.mockReturnValue(false);

            lobbyManager._removePlayer({
                guid: 'unknown',
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.playersGuids).toEqual(beforeState);
            expect(mockLobby.removePlayer).not.toHaveBeenCalled();
        });

        test('после удаления игрока его слот становится свободным', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.playersGuids.peopleArmy).toBeNull();
        });
    });

    describe('Интеграция с другими методами менеджера', () => {
        let mockLobby;
        const CREATOR_GUID = 'creator-guid';
        const PLAYER_GUID = 'player-guid';
        const LOBBY_GUID = 'test-lobby-guid';

        beforeEach(() => {
            mockLobby = createDefaultMockLobby(LOBBY_GUID, CREATOR_GUID, PLAYER_GUID);
            lobbyManager.lobbies[LOBBY_GUID] = mockLobby;
            lobbyManager._checkRemoveRights = jest.fn(() => true);
            jest.clearAllMocks();
        });

        test('после удаления игрока можно добавить нового на ту же роль', () => {
            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(mockLobby.playersGuids.peopleArmy).toBeNull();
        });

        test('удаление игрока не влияет на другие лобби', () => {
            const otherLobbyGuid = 'other-lobby';
            const otherLobby = createDefaultMockLobby(otherLobbyGuid, 'other-creator', 'other-player');
            lobbyManager.lobbies[otherLobbyGuid] = otherLobby;

            lobbyManager._removePlayer({
                guid: PLAYER_GUID,
                lobbyGuid: LOBBY_GUID,
                initiatorGuid: CREATOR_GUID
            });

            expect(lobbyManager.lobbies[otherLobbyGuid]).toBe(otherLobby);
        });
    });
});