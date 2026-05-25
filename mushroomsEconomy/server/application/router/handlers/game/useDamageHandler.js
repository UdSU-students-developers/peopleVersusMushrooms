module.exports = (mediator, answer) => (req, res) => {
    const { DAMAGE } = mediator.getEventTypes();

    const { entityGuid, damage, mushroomsEconomy } = req.body;

    if (!entityGuid || typeof damage !== 'number' || !mushroomsEconomy) {
        return res.send(answer.bad(242));
    }

    const result = mediator.call(DAMAGE, { entityGuid, damage, mushroomsEconomy });

    if (result === 4001) {
        return res.send(answer.bad(4001));
    }
    if (result === 4003) {
        return res.send(answer.bad(4003));
    }
    if (!result) {
        return res.send(answer.bad(4002));
    }

    return res.send(answer.good(true));
};