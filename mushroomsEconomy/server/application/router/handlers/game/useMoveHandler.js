module.exports = (mediator, answer) => (req, res) => {
    const { MOVE_UNIT } = mediator.getEventTypes();

    const { guid, mushroomsEconomy } = req.body;

    if (!guid || !mushroomsEconomy) {
        return res.send(answer.bad(242));
    }

    const response = mediator.call(MOVE_UNIT, { guid, mushroomsEconomy });

    if (response?.result) {
        return res.send(response);
    }

    return res.send(answer.bad(4003));
};