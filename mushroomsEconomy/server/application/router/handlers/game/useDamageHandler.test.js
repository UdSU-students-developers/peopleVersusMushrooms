const useDamageHandler = require('./useDamageHandler');
const CONFIG = require('../../../../config');

describe('useDamageHandler', () => {
    let mediator;
    let answer;
    let req;
    let res;
    let economy;

    beforeEach(() => {
        economy = {
            applyDamage: jest.fn()
        };

        mediator = {
            get: jest.fn()
        };

        answer = {
            success: jest.fn(() => ({ ok: true })),
            error: jest.fn((msg) => ({ ok: false, msg }))
        };

        req = {
            body: {
                guid: 'unit-1',
                damage: 5,
                economyGuid: 'eco-1'
            }
        };

        res = {
            json: jest.fn()
        };
    });

    test('should apply damage and return success', async () => {
        mediator.get.mockReturnValue(economy);
        economy.applyDamage.mockReturnValue(true);

        const handler = useDamageHandler(mediator, answer);
        await handler(req, res);

        expect(mediator.get).toHaveBeenCalledWith(
            CONFIG.MEDIATOR.TRIGGERS.GET_MUSHROOMS_ECONOMY,
            { guid: 'eco-1' }
        );

        expect(economy.applyDamage).toHaveBeenCalledWith('unit-1', 5);

        expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    test('should return error if economy not found', async () => {
        mediator.get.mockReturnValue(null);

        const handler = useDamageHandler(mediator, answer);
        await handler(req, res);

        expect(res.json).toHaveBeenCalledWith(
            answer.error('Economy not found')
        );
    });

    test('should return error if target not found', async () => {
        mediator.get.mockReturnValue(economy);
        economy.applyDamage.mockReturnValue(false);

        const handler = useDamageHandler(mediator, answer);
        await handler(req, res);

        expect(res.json).toHaveBeenCalledWith(
            answer.error('Target not found')
        );
    });

    test('should validate params', async () => {
        req.body = { damage: 5 }; // нет guid

        const handler = useDamageHandler(mediator, answer);
        await handler(req, res);

        expect(res.json).toHaveBeenCalledWith(
            answer.error('Invalid params')
        );
    });
});