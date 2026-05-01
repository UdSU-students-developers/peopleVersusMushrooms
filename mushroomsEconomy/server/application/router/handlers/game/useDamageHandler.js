const CONFIG = require('../../../../config');

module.exports = (mediator, answer) => (req, res) => {
    try {
        const { guid, damage, economyGuid } = req.body;

        if (!guid || typeof damage !== 'number' || !economyGuid) {
            return res.json(answer.error('Invalid params'));
        }

        const economy = mediator.get(
            CONFIG.MEDIATOR.TRIGGERS.GET_MUSHROOMS_ECONOMY,
            { guid: economyGuid }
        );

        if (!economy) {
            return res.json(answer.error('Economy not found'));
        }

        const success = economy.applyDamage(guid, damage);

        if (!success) {
            return res.json(answer.error('Target not found'));
        }

        return res.json(answer.success());
    } catch (e) {
        return res.json(answer.error(e.message));
    }
};