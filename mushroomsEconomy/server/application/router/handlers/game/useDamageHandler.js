module.exports = (mediator, answer) => (req, res) => {
    const { DAMAGE } = mediator.getEventTypes();

    const { entityGuid, damage, mushroomsEconomy } = req.body;

    if (!entityGuid || typeof damage !== 'number' || !mushroomsEconomy) {
        return res.send(answer.bad(242));
    }

    const response = mediator.call(DAMAGE, { entityGuid, damage, mushroomsEconomy });

    if (response?.result) {
        return res.send(response);
    }

    return res.send(answer.bad(4002));
};