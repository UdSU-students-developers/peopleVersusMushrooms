module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token, id } = req.body;
        const { DELETE_UNIT } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!id) {
            return res.send(answer.bad(13));
        }

        const result = mediator.get(DELETE_UNIT, id);

        return res.send(result);
    }
}