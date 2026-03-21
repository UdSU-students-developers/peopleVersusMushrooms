module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token } = req.body;
        const { GET_ALL_UNITS } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        const result = mediator.get(GET_ALL_UNITS);

        return res.send(result);
    }
}