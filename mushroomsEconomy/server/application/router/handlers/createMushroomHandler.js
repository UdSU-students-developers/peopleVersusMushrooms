module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token, mushroomData } = req.body;
        const { CREATE_MUSHROOM } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!mushroomData) {
            return res.send(answer.bad(13));
        }

        const result = mediator.get(CREATE_MUSHROOM, mushroomData);

        return res.send(result);
    }
}