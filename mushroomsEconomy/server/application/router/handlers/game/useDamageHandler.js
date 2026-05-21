module.exports = (mediator, answer) => (req, res) => {
    const { DAMAGE } = mediator.getEventTypes();

    const { unitGuid, damage, userGuid } = req.body;

    if (!unitGuid || typeof damage !== 'number' || !userGuid) {
        return res.send(answer.bad(242));
    }

    const success = mediator.call(DAMAGE, { unitGuid, damage, userGuid });

    if (!success) {
        return res.send(answer.bad(4002));
    }

    return res.send(answer.good(true));
};