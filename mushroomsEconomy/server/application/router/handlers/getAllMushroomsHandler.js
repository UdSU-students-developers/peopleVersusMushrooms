module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token } = req.body;
        const { GET_ALL_MUSHROOMS } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        const result = mediator.get(GET_ALL_MUSHROOMS);

        return res.send(result);
    }
}