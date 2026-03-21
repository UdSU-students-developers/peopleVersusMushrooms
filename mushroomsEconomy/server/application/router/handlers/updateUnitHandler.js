module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token, id, unitData } = req.body;
        const { UPDATE_UNIT } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!id || !unitData) {
            return res.send(answer.bad(13));
        }

        const result = mediator.get(UPDATE_UNIT, { id, unitData });

        return res.send(result);
    }
}