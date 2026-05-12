module.exports = (mediator, answer) => (req, res) => {
    const { APPLY_DAMAGE } = mediator.getEventTypes();

    const { guid, damage, economyGuid } = req.body;

    if (!guid || typeof damage !== 'number' || !economyGuid) {
        return res.json(answer.error('Invalid params'));
    }

    const success = mediator.call(APPLY_DAMAGE, { guid, damage, economyGuid });

    if (!success) {
        return res.json(answer.error('Target not found'));
    }

    return res.json(answer.success());
};