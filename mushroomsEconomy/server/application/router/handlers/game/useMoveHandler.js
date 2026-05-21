module.exports = (mediator, answer) => (req, res) => {
    const { MOVE_UNIT } = mediator.getEventTypes();

    const { guid, economyGuid } = req.body;

    if (!guid || !economyGuid) {
        return res.send(answer.bad(242));
    }

    const success = mediator.call(MOVE_UNIT, { guid, economyGuid });

    if (!success) {
        return res.send(answer.bad(4003));
    }

    return res.send(answer.good(true));
};