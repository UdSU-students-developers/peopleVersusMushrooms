module.exports = (mediator, answer) => {
    return (req, res) => {

        const { guid } = req.body;

        if (!guid) {
            return res.send(answer.bad(400, 'No guid'));
        }

        const { GROW_LARVA } = mediator.getTriggerTypes();

        const result = mediator.get(GROW_LARVA, guid);

        if (!result || !result.success) {
            return res.send(answer.bad(400, result?.message));
        }

        return res.send(answer.good(true));
    };
};