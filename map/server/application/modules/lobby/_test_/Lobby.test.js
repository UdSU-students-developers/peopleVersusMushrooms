const Lobby = require('./Lobby');

jest.mock('../../../config', () => ({
    LOBBY_MAX_SIZE: 5
}));

/// ТЕСТИРОВКА ФУНКЦИИ addPlayer ///
describe('Lobby - addPlayer', () => {
    describe('Позитивные сценарии', () => {
        test('успешное добавление игрока на свободную роль', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('player1-guid', 'peopleEconomy');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe('player1-guid');
        });

        test('успешное добавление игрока на рол spectator если она свобдна', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('spectator-guid', 'spectator');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.spectator).toBe('spectator-guid');
        });

        test('последовательное добавление игроков на все свободные роли', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const additions = [
                { guid: 'player-1', role: 'peopleEconomy' },
                { guid: 'player-2', role: 'mushroomsArmy' },
                { guid: 'player-3', role: 'mushroomsEconomy' },
                { guid: 'player-4', role: 'spectator' }
            ];
            
            additions.forEach(({ guid, role }) => {
                const result = lobby.addPlayer(guid, role);
                expect(result).toBe(true);
                expect(lobby.playersGuids[role]).toBe(guid);
            });
            
            expect(lobby.playersGuids).toEqual({
                spectator: 'player-4',
                peopleArmy: 'host-guid',
                peopleEconomy: 'player-1',
                mushroomsArmy: 'player-2',
                mushroomsEconomy: 'player-3'
            });
        });

        test('добавление игрока с числовым guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer(42, 'peopleEconomy');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe(42);
        });
    });

    describe('Негативные сценарии - невлаидные параметры', () => {
        let lobby;

        beforeEach(() => {
            lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
        });

        test('guid равен null', () => {
            expect(lobby.addPlayer(null, 'peopleEconomy')).toBe(false);
        });

        test('guid равен undefined', () => {
            expect(lobby.addPlayer(undefined, 'peopleEconomy')).toBe(false);
        });

        test('guid равен пустой строке', () => {
            expect(lobby.addPlayer('', 'peopleEconomy')).toBe(false);
        });

        test('guid равен 0', () => {
            expect(lobby.addPlayer(0, 'peopleEconomy')).toBe(false);
        });

        test('guid равен false', () => {
            expect(lobby.addPlayer(false, 'peopleEconomy')).toBe(false);
        });

        test('role равен null', () => {
            expect(lobby.addPlayer('player1', null)).toBe(false);
        });

        test('role равен undefined', () => {
            expect(lobby.addPlayer('player1', undefined)).toBe(false);
        });

        test('role равен пустой строке', () => {
            expect(lobby.addPlayer('player1', '')).toBe(false);
        });

        test('role равен 0', () => {
            expect(lobby.addPlayer('player1', 0)).toBe(false);
        });

        test('оба параметра null', () => {
            expect(lobby.addPlayer(null, null)).toBe(false);
        });

        test('оба параметра undefined', () => {
            expect(lobby.addPlayer(undefined, undefined)).toBe(false);
        });

        test('оба параметра пустые стрки', () => {
            expect(lobby.addPlayer('', '')).toBe(false);
        });
    });

    describe('Негативные сценарии - занятые роли', () => {
        test('попытка занять роль создателя', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('intruder-guid', 'peopleArmy');
            
            expect(result).toBe(false);
            expect(lobby.playersGuids.peopleArmy).toBe('host-guid');
        });

        test('попытка занять роль уже добавленного игрока', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('player1', 'mushroomsArmy');
            const result = lobby.addPlayer('player2', 'mushroomsArmy');
            
            expect(result).toBe(false);
            expect(lobby.playersGuids.mushroomsArmy).toBe('player1');
        });

        test('попытка занять занятую роль spectator', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('spec-1', 'spectator');
            const result = lobby.addPlayer('spec-2', 'spectator');
            
            expect(result).toBe(false);
            expect(lobby.playersGuids.spectator).toBe('spec-1');
        });

        test('попытка занять все роли когда они уже заняты', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('p1', 'peopleEconomy');
            lobby.addPlayer('p2', 'mushroomsArmy');
            lobby.addPlayer('p3', 'mushroomsEconomy');
            lobby.addPlayer('p4', 'spectator');
            
            ['peopleArmy', 'peopleEconomy', 'mushroomsArmy', 'mushroomsEconomy', 'spectator'].forEach(role => {
                expect(lobby.addPlayer('extra-player', role)).toBe(false);
            });
        });
    });

    describe('Негативные сценарии - дублирование guid', () => {
        test('попытка использовать guid создателя', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('host-guid', 'peopleEconomy');
            
            expect(result).toBe(false);
        });

        test('попытка использовать lobbyGuid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'lobby-123', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('lobby-123', 'peopleEconomy');
            
            expect(result).toBe(false);
        });

        test('попытка добавить игрока с guid уже существующего игрока', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('existing-player', 'mushroomsArmy');
            const result = lobby.addPlayer('existing-player', 'peopleEconomy');
            
            expect(result).toBe(false);
        });

        test('попытка использовать guid существующего spectator', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('spectator-1', 'spectator');
            const result = lobby.addPlayer('spectator-1', 'mushroomsEconomy');
            
            expect(result).toBe(false);
        });

        test('попытка добавить игрока с guid равным lobbyguid через переменную', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const maliciousGuid = lobby.lobbyGuid;
            const result = lobby.addPlayer(maliciousGuid, 'peopleEconomy');
            
            expect(result).toBe(false);
        });
    });

    describe('Пограничные случаи', () => {
        test('очень длинный guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const longGuid = 'a'.repeat(10000);
            const result = lobby.addPlayer(longGuid, 'peopleEconomy');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe(longGuid);
        });

        test('guid со специальными символами', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const specialGuid = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
            const result = lobby.addPlayer(specialGuid, 'peopleEconomy');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe(specialGuid);
        });

        test('guid с пробелами', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('player with spaces', 'peopleEconomy');
            
            expect(result).toBe(true);
        });

        test('guid с юникодом', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('игрок-тест', 'peopleEconomy');
            
            expect(result).toBe(true);
        });

        test('guid с эмодзи', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('🎮player🎯', 'peopleEconomy');
            
            expect(result).toBe(true);
        });

        test('отрицательный числовой guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer(-1, 'peopleEconomy');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe(-1);
        });

        test('дробный числовой guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer(3.14, 'peopleEconomy');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe(3.14);
        });

        test('Infinity как guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer(Infinity, 'peopleEconomy');
            
            expect(result).toBe(true);
        });

        test('NaN как guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer(NaN, 'peopleEconomy');
            
            // NaN это false значение? Нет, NaN это true
            expect(result).toBe(true);
        });

        test('объект как guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const objectGuid = { id: 'player-1', name: 'test' };
            const result = lobby.addPlayer(objectGuid, 'peopleEconomy');
            
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe(objectGuid);
        });

        test('массив как guid', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer(['player', 'test'], 'peopleEconomy');
            
            expect(result).toBe(true);
        });

        test('несуществующая роль', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('player1', 'nonExistentRole');
            
            // Обращение к несуществующему свойству объекта вернет undefined
            // undefined === null это false, поэтому проверка не пройдет
            expect(result).toBe(false);
        });
    });

    describe('Проверка состояния', () => {
        test('не изменяет другие роли при добавлении игрока', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const beforeState = {
                spectator: lobby.playersGuids.spectator,
                peopleArmy: lobby.playersGuids.peopleArmy,
                peopleEconomy: lobby.playersGuids.peopleEconomy,
                mushroomsArmy: lobby.playersGuids.mushroomsArmy,
                mushroomsEconomy: lobby.playersGuids.mushroomsEconomy
            };
            
            lobby.addPlayer('new-player', 'mushroomsArmy');
            
            expect(lobby.playersGuids.spectator).toBe(beforeState.spectator);
            expect(lobby.playersGuids.peopleArmy).toBe(beforeState.peopleArmy);
            expect(lobby.playersGuids.peopleEconomy).toBe(beforeState.peopleEconomy);
            expect(lobby.playersGuids.mushroomsEconomy).toBe(beforeState.mushroomsEconomy);
            expect(lobby.playersGuids.mushroomsArmy).not.toBe(beforeState.mushroomsArmy);
        });

        test('не изменяеет playersIsReady при добавлении игрока', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const beforeReady = { ...lobby.playersIsReady };
            
            lobby.addPlayer('new-player', 'mushroomsArmy');
            
            expect(lobby.playersIsReady).toEqual(beforeReady);
        });

        test('состояние после нескольких успешных добавлений', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('player1', 'peopleEconomy');
            lobby.addPlayer('player2', 'mushroomsArmy');
            
            expect(lobby.playersGuids).toEqual({
                spectator: null,
                peopleArmy: 'host-guid',
                peopleEconomy: 'player1',
                mushroomsArmy: 'player2',
                mushroomsEconomy: null
            });
        });

        test('состояние не меняется при неудачной ппытке добавления', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const beforeState = { ...lobby.playersGuids };
            
            lobby.addPlayer('host-guid', 'peopleEconomy'); // дубликат создателя
            
            expect(lobby.playersGuids).toEqual(beforeState);
        });
    });

    describe('Интеграция с другими методами', () => {
        test('canjoin после добавления игроков', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            expect(lobby.canJoin()).toBe(true);
            
            lobby.addPlayer('p1', 'peopleEconomy');
            expect(lobby.canJoin()).toBe(true);
            
            lobby.addPlayer('p2', 'mushroomsArmy');
            expect(lobby.canJoin()).toBe(true);
            
            lobby.addPlayer('p3', 'mushroomsEconomy');
            expect(lobby.canJoin()).toBe(true);
            
            lobby.addPlayer('p4', 'spectator');
            expect(lobby.canJoin()).toBe(false);
        });

        test('isGuidInLobby после добавления игрока', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            expect(lobby.isGuidInLobby('new-player')).toBe(false);
            
            lobby.addPlayer('new-player', 'peopleEconomy');
            
            expect(lobby.isGuidInLobby('new-player')).toBe(true);
        });

        test('get после добавления игрока возвращает актуальное состояние', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('player1', 'mushroomsArmy');
            
            const state = lobby.get();
            
            expect(state.playersGuids).toEqual({
                spectator: null,
                peopleArmy: 'host-guid',
                peopleEconomy: null,
                mushroomsArmy: 'player1',
                mushroomsEconomy: null
            });
        });

        test('removePlayer после добавления', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('player1', 'mushroomsArmy');
            expect(lobby.isGuidInLobby('player1')).toBe(true);
            
            lobby.removePlayer('player1');
            expect(lobby.isGuidInLobby('player1')).toBe(false);
            expect(lobby.playersGuids.mushroomsArmy).toBeNull();
        });

        test('setPlayerReady после добавления', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 'host-guid', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            lobby.addPlayer('player1', 'mushroomsArmy');
            
            const result = lobby.setPlayerReady('player1');
            
            expect(result).toBe(true);
            expect(lobby.playersIsReady.mushroomsArmy).toBe(true);
        });
    });

    describe('Граничcные случаи с lobbyGuid', () => {
        test('lobbyGuid как пустая строка', () => {
            const lobby = new Lobby({ 
                lobbyGuid: '', 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('player1', 'peopleEconomy');
            
            // '' это false значение, поэтому создатель не будет добавлен?
            // Но конструктор все равно попытается добавить его
            expect(result).toBe(true);
            expect(lobby.playersGuids.peopleEconomy).toBe('player1');
        });

        test('lobbyGuid равен 0', () => {
            const lobby = new Lobby({ 
                lobbyGuid: 0, 
                lobbyName: 'test-room',
                role: 'peopleArmy'
            });
            
            const result = lobby.addPlayer('player1', 'peopleEconomy');
            
            // 0 это false, создатель не будет добавлен, роль peopleArmy свободна
            expect(result).toBe(true);
        });
    });
});