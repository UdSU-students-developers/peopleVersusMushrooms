module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token, unitData } = req.body;
        const { CREATE_UNIT } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!unitData) {
            return res.send(answer.bad(13));
        }

        const result = mediator.get(CREATE_UNIT, unitData);

        return res.send(result);
    }
}