module.exports = (mediator, answer) => (req, res) => {
    const { DAMAGE } = mediator.getEventTypes();

    const { entityGuid, damage, mushroomsEconomy } = req.body;

    if (!entityGuid || typeof damage !== 'number' || !mushroomsEconomy) {
        return res.send(answer.bad(242));
    }

    const success = mediator.call(DAMAGE, { entityGuid, damage, mushroomsEconomy });

    if (!success) {
        return res.send(answer.bad(4002));
    }

    return res.send(answer.good(true));
};