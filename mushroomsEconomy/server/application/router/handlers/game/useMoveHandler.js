module.exports = (mediator, answer) => (req, res) => {
    const { MOVE_UNIT } = mediator.getEventTypes();

    try {
        const { guid, economyGuid } = req.body;

        if (!guid || !economyGuid) {
            return res.json(answer.error('Invalid params'));
        }

        const success = mediator.call(MOVE_UNIT, { guid, economyGuid });

        if (!success) {
            return res.json(answer.error('Target not found'));
        }

        return res.json(answer.success());
    } catch (e) {
        return res.json(answer.error(e.message));
    }
};