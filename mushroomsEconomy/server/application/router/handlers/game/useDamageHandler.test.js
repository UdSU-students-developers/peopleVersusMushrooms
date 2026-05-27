const useDamageHandler = require('./useDamageHandler');
const CONFIG = require('../../../../config');

describe('useDamageHandler', () => {
    let mediator;
    let answer;
    let req;
    let res;
    beforeEach(() => {
        mediator = {
            call: jest.fn(),
            getEventTypes: jest.fn(() => ({
                APPLY_DAMAGE: CONFIG.MEDIATOR.EVENTS.APPLY_DAMAGE
            }))
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
        mediator.call.mockReturnValue(true);

        const handler = useDamageHandler(mediator, answer);
        await handler(req, res);

        expect(mediator.call).toHaveBeenCalledWith(
            CONFIG.MEDIATOR.EVENTS.APPLY_DAMAGE,
            { guid: 'unit-1', damage: 5, economyGuid: 'eco-1' }
        );

        expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    test('should return error if target not found', async () => {
        mediator.call.mockReturnValue(false);

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