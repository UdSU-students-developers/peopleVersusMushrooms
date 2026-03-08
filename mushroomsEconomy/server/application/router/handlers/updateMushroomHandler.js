module.exports = (mediator, answer) => {
    return (req, res) => {
        const { token, id, mushroomData } = req.body;
        const { UPDATE_MUSHROOM } = mediator.getTriggerTypes();

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!id || !mushroomData) {
            return res.send(answer.bad(13));
        }

        const result = mediator.get(UPDATE_MUSHROOM, { id, mushroomData });

        return res.send(result);
    }
}