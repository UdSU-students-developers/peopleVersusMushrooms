const CONFIG = require('../../../../config');
const economy = require('../../../economy/Economy');

module.exports = (mediator, answer) => (req, res) => {
    try {
        const { guid, damage, economyGuid } = req.body;

        if (!guid || typeof damage !== 'number' || !economyGuid) {
            return res.json(answer.error('Invalid params'));
        }

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