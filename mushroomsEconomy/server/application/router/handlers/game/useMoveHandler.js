module.exports = (mediator, answer) => (req, res) => {
    const { MOVE_UNIT } = mediator.getEventTypes();

    const { guid, economyGuid } = req.body;

    if (!guid || !economyGuid) {
        return res.json(answer.error('Invalid params'));
    }

    const success = mediator.call(MOVE_UNIT, { guid, economyGuid });

    if (!success) {
        return res.json(answer.error('Target not found'));
    }

    return res.json(answer.success());
};