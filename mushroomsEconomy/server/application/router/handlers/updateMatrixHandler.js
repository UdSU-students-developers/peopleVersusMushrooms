module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token, newMatrix } = req.body;
        const { UPDATE_MATRIX } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!newMatrix) {
            return res.send(answer.bad(13));
        }

        const result = mediator.get(UPDATE_MATRIX, newMatrix);

        return res.send(result);
    }
}