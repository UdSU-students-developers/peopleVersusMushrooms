const Lobby = require('./Lobby');

describe('Lobby', () => {
    let lobby =null;

    beforeAll(() => {
        lobby = new Lobby({ lobbyName: 'test' });
    });

    test('lobby.get()', () => {
        const data = lobby.get();
        expect(data).toHaveProperty('lobbyName');
        expect(data.lobbyName).not.toBeUndefined();
        expect(data.lobbyName).not.toBe('');
    });

});
