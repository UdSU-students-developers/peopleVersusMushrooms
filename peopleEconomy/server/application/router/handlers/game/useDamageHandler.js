module.exports = (mediator, answer) => (req, res) => {
    const { DAMAGE } = mediator.getEventTypes();

    const { entityGuid, damage, peopleEconomy } = req.body;

    if (!entityGuid || typeof damage !== 'number' || !peopleEconomy) {
        return res.json(answer.bad(242));
    }

    const success = mediator.call(DAMAGE, { entityGuid, damage, peopleEconomy });

    if (!success) {
        return res.json(answer.bad(4002));
    }

    return res.json(answer.good(true));
};